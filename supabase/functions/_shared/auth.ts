// Shared authentication + authorization helpers for edge functions.
// Every user-touching function should call authenticateUser() to verify the JWT,
// then optionally requireNotSuspended() / requireAdmin() / requirePremium().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';
import { jsonError } from './http.ts';

export type UserContext = {
  userId: string;
  email: string | null;
  authHeader: string;
  // User-scoped supabase client (RLS enforced against the caller).
  supabaseAsUser: ReturnType<typeof createClient>;
};

export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
}

export async function authenticateUser(
  req: Request,
): Promise<{ ok: true; ctx: UserContext } | { ok: false; response: Response }> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, response: jsonError(401, 'Unauthorized') };
  }
  const supabaseAsUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAsUser.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { ok: false, response: jsonError(401, 'Unauthorized') };
  }
  return {
    ok: true,
    ctx: {
      userId: data.claims.sub as string,
      email: (data.claims.email as string | undefined) ?? null,
      authHeader,
      supabaseAsUser,
    },
  };
}

export async function requireNotSuspended(userId: string): Promise<Response | null> {
  const svc = adminClient();
  const { data, error } = await svc.rpc('is_user_suspended', { _user_id: userId });
  if (error) {
    console.error('is_user_suspended error', error);
    return null; // fail-open on tooling glitch, but log
  }
  if (data === true) return jsonError(403, 'Your account is currently suspended.');
  return null;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const svc = adminClient();
  const { data } = await svc.rpc('has_role', { _user_id: userId, _role: 'admin' });
  return data === true;
}

export async function requireAdmin(userId: string): Promise<Response | null> {
  return (await isAdmin(userId)) ? null : jsonError(403, 'Admin access required');
}

export async function requirePremium(userId: string): Promise<Response | null> {
  const svc = adminClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('is_premium, subscription_ends_at')
    .eq('id', userId)
    .maybeSingle();
  const active = !!profile?.is_premium &&
    (!profile.subscription_ends_at || new Date(profile.subscription_ends_at as string) > new Date());
  if (active) return null;
  if (await isAdmin(userId)) return null;
  return jsonError(403, 'Premium subscription required');
}

// Rate limit an authenticated user for a named action.
// Returns null when allowed, or a 429 Response when the caller has exceeded the window.
export async function rateLimit(opts: {
  userId: string;
  action: string;
  max: number;
  windowSec: number;
}): Promise<Response | null> {
  const svc = adminClient();
  const { data, error } = await svc.rpc('rate_limit_check', {
    _user_id: opts.userId,
    _action: opts.action,
    _max: opts.max,
    _window_sec: opts.windowSec,
  });
  if (error) {
    console.error('rate_limit_check error', error);
    return null; // fail-open
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.allowed === true) return null;
  const resetAt = row.reset_at as string | undefined;
  return jsonError(429, 'Too many requests. Please slow down.', {
    retry_after: resetAt,
  });
}

// Best-effort audit logging.
export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  severity: 'info' | 'warn' | 'critical',
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    const svc = adminClient();
    await svc.from('security_events').insert({
      event_type: eventType,
      user_id: userId,
      severity,
      metadata,
    });
  } catch (e) {
    console.error('logSecurityEvent failed', e);
  }
}