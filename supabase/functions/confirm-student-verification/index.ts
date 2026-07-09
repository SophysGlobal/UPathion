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
    const code = String(body.code || '').trim()
    if (!/^\d{6}$/.test(code)) return json({ error: 'Invalid code format' }, 400)

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
      return json({ error: 'Too many attempts. Request a new code.' }, 429)
    }

    const expectedHash = await sha256(`${userId}:${code}`)
    if (expectedHash !== row.code_hash) {
      await admin
        .from('student_verification_codes')
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq('id', row.id)
      return json({ error: 'Incorrect code' }, 400)
    }

    await admin
      .from('student_verification_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', row.id)

    await admin.from('profiles').update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_email: row.email,
      verified_school_id: row.school_id,
    }).eq('id', userId)

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: 'Server error' }, 500)
  }
})