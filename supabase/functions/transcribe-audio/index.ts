import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonError, requirePremiumUser, aiRateLimit, LOVABLE_API_KEY } from '../_shared/ai-auth.ts';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requirePremiumUser(req);
    if (!auth.ok) return auth.response;
    if (!LOVABLE_API_KEY) return jsonError(500, 'LOVABLE_API_KEY not configured');

    // 20 transcriptions per hour per user.
    const limited = await aiRateLimit(auth.userId, 'transcribe_audio', 20, 3600);
    if (limited) return limited;

    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return jsonError(400, 'multipart/form-data required');
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError(400, 'file required');
    if (file.size === 0) return jsonError(400, 'empty recording');
    if (file.size > MAX_AUDIO_BYTES) return jsonError(413, 'recording too large');

    const mime = (file.type || '').toLowerCase();
    const extMap: Record<string, string> = {
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
    };
    const ext = extMap[mime.split(';')[0]] ?? 'wav';

    const upstream = new FormData();
    upstream.append('model', 'openai/gpt-4o-mini-transcribe');
    upstream.append('file', file, `recording.${ext}`);

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('transcribe error', resp.status, errText);
      if (resp.status === 429) return jsonError(429, 'Rate limited');
      if (resp.status === 402) return jsonError(402, 'AI credits exhausted');
      return jsonError(502, `Transcription failed: ${resp.status}`);
    }
    const data = await resp.json();
    const text = String(data?.text ?? '').trim();
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('transcribe-audio error', e);
    return jsonError(500, e instanceof Error ? e.message : 'Unknown error');
  }
});