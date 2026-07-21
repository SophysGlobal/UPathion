// Shared HTTP helpers for edge functions.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Expose-Headers': 'x-conversation-id',
};

export function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function jsonOk(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...((init?.headers as Record<string, string>) ?? {}),
    },
  });
}

export function newRequestId(): string {
  // Short correlation id for structured logs.
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function logEvent(fn: string, reqId: string, event: string, extra?: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ fn, reqId, event, ...(extra ?? {}) }));
  } catch {
    console.log(`[${fn}:${reqId}] ${event}`);
  }
}

// Very small runtime validator so we don't have to ship Zod into every function.
// Usage: const p = pickString(body, "priceId", { min: 1, max: 100 });
export function pickString(
  obj: unknown,
  key: string,
  opts: { min?: number; max?: number; pattern?: RegExp; required?: boolean } = {},
): { ok: true; value: string } | { ok: false; error: string } {
  const required = opts.required ?? true;
  const raw = (obj as Record<string, unknown> | null | undefined)?.[key];
  if (raw === undefined || raw === null || raw === '') {
    if (!required) return { ok: true, value: '' };
    return { ok: false, error: `${key} is required` };
  }
  if (typeof raw !== 'string') return { ok: false, error: `${key} must be a string` };
  const value = raw.trim();
  if (opts.min !== undefined && value.length < opts.min) return { ok: false, error: `${key} too short` };
  if (opts.max !== undefined && value.length > opts.max) return { ok: false, error: `${key} too long` };
  if (opts.pattern && !opts.pattern.test(value)) return { ok: false, error: `${key} format invalid` };
  return { ok: true, value };
}