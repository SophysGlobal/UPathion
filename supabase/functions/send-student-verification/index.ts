import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ACADEMIC_TLDS = ['.edu', '.ac.uk', '.edu.au', '.ac.in', '.edu.cn', '.ac.jp', '.edu.sg', '.ac.nz', '.edu.sa']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function sha256(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Find the user's declared school
    const { data: profile } = await admin
      .from('profiles')
      .select('school_name, verification_status')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.verification_status === 'verified') return json({ error: 'Already verified' }, 400)

    let schoolId: string | null = null
    let schoolDomains: string[] = []
    if (profile?.school_name) {
      const { data: school } = await admin
        .from('schools')
        .select('id, domains')
        .ilike('name', profile.school_name)
        .maybeSingle()
      if (school) {
        schoolId = school.id
        schoolDomains = (school.domains || []) as string[]
      }
    }

    const emailDomain = email.split('@')[1]
    const matchesSchoolDomain = schoolDomains.some((d) => {
      const dn = String(d).toLowerCase()
      return emailDomain === dn || emailDomain.endsWith('.' + dn)
    })
    const matchesAcademicTld = ACADEMIC_TLDS.some((tld) => emailDomain.endsWith(tld))
    if (!matchesSchoolDomain && !matchesAcademicTld) {
      return json({
        error: 'This email does not look like an institutional student email. Use your school-issued address (e.g. name@school.edu).',
      }, 400)
    }

    // Rate limit: max 3 codes per 10 min
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('student_verification_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)
    if ((count ?? 0) >= 3) return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429)

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await sha256(`${userId}:${code}`)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: insertErr } = await admin.from('student_verification_codes').insert({
      user_id: userId,
      email,
      code_hash: codeHash,
      school_id: schoolId,
      expires_at: expiresAt,
    })
    if (insertErr) throw insertErr

    await admin.from('profiles').update({ verification_status: 'pending' }).eq('id', userId)

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