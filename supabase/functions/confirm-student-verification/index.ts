import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function hmacHex(pepper: string, input: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(input))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsRes, error: claimsErr } = await supabaseAuth.auth.getClaims(token)
    if (claimsErr || !claimsRes?.claims?.sub) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsRes.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const code = String(body.code || '').trim()
    if (!/^\d{6}$/.test(code)) return json({ error: 'Invalid code format' }, 400)

    const pepper = Deno.env.get('STUDENT_VERIFICATION_PEPPER')
    if (!pepper) {
      console.error('STUDENT_VERIFICATION_PEPPER not configured')
      return json({ error: 'Server misconfigured' }, 500)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: rows, error: rowsErr } = await admin
      .from('student_verification_codes')
      .select('id, code_hash, email, school_id, expires_at, attempts, consumed_at')
      .eq('user_id', userId)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (rowsErr) throw rowsErr
    const row = rows?.[0]
    if (!row) return json({ error: 'No active code — request a new one.' }, 400)

    if ((row.attempts ?? 0) >= 5) {
      await admin.from('profiles').update({ verification_status: 'failed' }).eq('id', userId)
      await admin.from('security_events').insert({
        event_type: 'student_verification_locked',
        user_id: userId, severity: 'warn', metadata: { code_id: row.id },
      })
      return json({ error: 'Too many attempts. Request a new code.' }, 429)
    }

    const expectedHash = await hmacHex(pepper, `${userId}:${code}`)
    if (!timingSafeEqual(expectedHash, String(row.code_hash))) {
      await admin
        .from('student_verification_codes')
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq('id', row.id)
      await admin.from('security_events').insert({
        event_type: 'student_verification_code_mismatch',
        user_id: userId, severity: 'info', metadata: { code_id: row.id },
      })
      return json({ error: 'Incorrect code' }, 400)
    }

    await admin
      .from('student_verification_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', row.id)

    // Compute academic-year expiry (Aug 1 rule, 60-day carry).
    const nowIso = new Date().toISOString()
    const { data: expData, error: expErr } = await admin.rpc('academic_year_expiry', { _verified_at: nowIso })
    if (expErr) throw expErr
    const expiresAt = expData as unknown as string
    const verifiedDomain = String(row.email).split('@')[1] || ''

    // Revoke any prior active verifications for this user (single active row invariant).
    await admin
      .from('student_email_verifications')
      .update({ status: 'revoked' })
      .eq('user_id', userId)
      .eq('status', 'active')

    const { error: sevErr } = await admin.from('student_email_verifications').insert({
      user_id: userId,
      school_id: row.school_id,
      verified_email: row.email,
      verified_domain: verifiedDomain,
      verified_at: nowIso,
      expires_at: expiresAt,
      status: 'active',
      method: 'otp_resend',
    })
    if (sevErr) throw sevErr

    // Mirror to profile (service_role bypasses the sensitive-field trigger).
    await admin.from('profiles').update({
      verification_status: 'verified',
      verified_at: nowIso,
      verified_email: row.email,
      verified_school_id: row.school_id,
    }).eq('id', userId)

    await admin.from('security_events').insert({
      event_type: 'student_verification_success',
      user_id: userId, severity: 'info',
      metadata: { school_id: row.school_id, expires_at: expiresAt },
    })

    return json({ ok: true, expires_at: expiresAt })
  } catch (e) {
    console.error(e)
    return json({ error: 'Server error' }, 500)
  }
})