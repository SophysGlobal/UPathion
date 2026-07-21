import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function secureOtp6(): string {
  // Cryptographically random, uniformly distributed 6-digit code.
  const buf = new Uint32Array(1)
  let n: number
  do {
    crypto.getRandomValues(buf)
    n = buf[0]
  } while (n >= 4_294_000_000) // reject bias band
  return (n % 1_000_000).toString().padStart(6, '0')
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
    const email = String(body.email || '').trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || email.length > 254) return json({ error: 'Invalid email' }, 400)

    const pepper = Deno.env.get('STUDENT_VERIFICATION_PEPPER')
    if (!pepper) {
      console.error('STUDENT_VERIFICATION_PEPPER not configured')
      return json({ error: 'Server misconfigured' }, 500)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Enforce college/university only. High-school students never verify by school email.
    const { data: profile } = await admin
      .from('profiles')
      .select('school_name, school_id, status, verification_status')
      .eq('id', userId)
      .maybeSingle()

    const statusStr = String(profile?.status || '').toLowerCase()
    const eligible = statusStr === 'undergraduate' || statusStr === 'graduate' || statusStr === 'college'
    if (!eligible) {
      return json({
        error: 'School-email verification is only available for college and university students.',
      }, 400)
    }

    // Already-active verification? Block re-issue.
    const { data: activeSev } = await admin
      .from('student_email_verifications')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (activeSev) return json({ error: 'You are already verified for this academic year.' }, 400)

    // Consult per-school allowlist. NO generic .edu fallback.
    const emailDomain = email.split('@')[1] || ''
    if (!emailDomain) return json({ error: 'Invalid email' }, 400)

    let matchedSchoolId: string | null = profile?.school_id ?? null
    // Find an approved 'student' domain that matches the email, scoped to the user's school when known.
    let query = admin
      .from('school_email_domains')
      .select('school_id, domain, domain_type, verification_allowed, manual_review_required')
      .eq('verification_allowed', true)
      .in('domain_type', ['student'])
      .eq('domain', emailDomain)
      .limit(1)
    if (matchedSchoolId) query = query.eq('school_id', matchedSchoolId)
    const { data: allow } = await query.maybeSingle()

    if (!allow || allow.manual_review_required !== false) {
      await admin.from('security_events').insert({
        event_type: 'student_verification_domain_rejected',
        user_id: userId,
        severity: 'info',
        metadata: { email_domain: emailDomain, school_id: matchedSchoolId },
      })
      return json({
        error:
          'This email domain has not been approved for automated verification. Please use your school-issued student email, or contact support.',
      }, 400)
    }
    matchedSchoolId = allow.school_id

    // Rate limit: max 3 codes per 10 min
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('student_verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)
    if ((count ?? 0) >= 3) return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429)

    // Generate 6-digit code (CSPRNG) and HMAC-hash it with a server pepper.
    const code = secureOtp6()
    const codeHash = await hmacHex(pepper, `${userId}:${code}`)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: insertErr } = await admin.from('student_verification_codes').insert({
      user_id: userId,
      email,
      code_hash: codeHash,
      school_id: matchedSchoolId,
      expires_at: expiresAt,
    })
    if (insertErr) throw insertErr

    await admin.from('profiles').update({ verification_status: 'pending' }).eq('id', userId)

    await admin.from('security_events').insert({
      event_type: 'student_verification_code_sent',
      user_id: userId,
      severity: 'info',
      metadata: { email_domain: emailDomain, school_id: matchedSchoolId },
    })

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="margin:0 0 8px 0">Verify your student status</h2>
          <p style="color:#555">Enter this code in UPathion to confirm your school email:</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px;text-align:center;background:#f5f5f7;padding:16px;border-radius:12px">${code}</p>
          <p style="color:#888;font-size:12px">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'UPathion <onboarding@resend.dev>',
          to: [email],
          subject: 'Your UPathion student verification code',
          html,
        }),
      })
      if (!resp.ok) {
        const t = await resp.text()
        console.error('Resend failure', resp.status, t)
      }
    } else {
      console.warn('RESEND_API_KEY missing — code was created but no email sent')
    }

    return json({ ok: true, email })
  } catch (e) {
    console.error(e)
    return json({ error: 'Server error' }, 500)
  }
})