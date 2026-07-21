// Shared auth + premium check for AI edge functions.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.0';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'x-conversation-id',
};

export function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function requirePremiumUser(req: Request): Promise<
  | { ok: true; userId: string; supabase: ReturnType<typeof createClient> }
  | { ok: false; response: Response }
> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, response: jsonError(401, 'Missing authorization header') };
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
  if (authError || !claimsData?.claims?.sub) {
    return { ok: false, response: jsonError(401, 'Invalid or expired token') };
  }
  const userId = claimsData.claims.sub as string;

  // Block suspended accounts before any billable AI work.
  const { data: suspended } = await supabase.rpc('is_user_suspended', { _user_id: userId });
  if (suspended === true) {
    return { ok: false, response: jsonError(403, 'Your account is currently suspended.') };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, subscription_ends_at')
    .eq('id', userId)
    .single();

  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });

  const now = new Date();
  const isActive = !!profile?.is_premium &&
    (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > now);

  if (!isActive && !isAdmin) {
    return { ok: false, response: jsonError(403, 'Premium subscription required') };
  }
  return { ok: true, userId, supabase };
}

// Per-user rate limit for AI endpoints. Returns null when allowed,
// or a 429 response to short-circuit the handler.
export async function aiRateLimit(
  userId: string,
  action: string,
  max: number,
  windowSec: number,
): Promise<Response | null> {
  const svc = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
  const { data, error } = await svc.rpc('rate_limit_check', {
    _user_id: userId,
    _action: action,
    _max: max,
    _window_sec: windowSec,
  });
  if (error) {
    console.error('rate_limit_check error', error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.allowed === true) return null;
  return jsonError(429, 'Too many requests. Please slow down.');
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

export const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';
export const CHAT_MODEL = 'openai/gpt-5.5';

export async function callLovableChat(body: Record<string, unknown>): Promise<Response> {
  return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Lovable-API-Key': LOVABLE_API_KEY,
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export function handleAiStatus(status: number): Response | null {
  if (status === 429) return jsonError(429, 'Rate limit exceeded, please try again shortly.');
  if (status === 402) return jsonError(402, 'AI credits exhausted. Please add funds to your Lovable AI workspace.');
  return null;
}