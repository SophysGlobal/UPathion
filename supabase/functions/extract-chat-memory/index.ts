import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  jsonError,
  requirePremiumUser,
  callLovableChat,
  handleAiStatus,
  CHAT_MODEL,
  LOVABLE_API_KEY,
} from '../_shared/ai-auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requirePremiumUser(req);
    if (!auth.ok) return auth.response;
    const { userId, supabase } = auth;
    if (!LOVABLE_API_KEY) return jsonError(500, 'LOVABLE_API_KEY not configured');

    const { conversationId, sourceMessageId, userMessage, assistantMessage } = await req.json();
    const prompt = `Extract 0-3 DURABLE facts about the user that would be genuinely useful to remember for future conversations (long-term goals, preferences, academic focus, ongoing projects, target schools/majors, etc.). Ignore trivia, one-time details, and anything the user did not clearly state about themselves.\n\nReturn JSON only, no prose, matching:\n{"memories":[{"content":"short 1-sentence fact","category":"academics|career|preferences|personal|goals|other","importance":1-5}]}\n\nUser message: ${String(userMessage ?? '').slice(0, 2000)}\n\nAssistant reply: ${String(assistantMessage ?? '').slice(0, 2000)}`;

    const resp = await callLovableChat({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: 'You extract durable user facts as strict JSON. Return {"memories":[]} if nothing is worth remembering.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      stream: false,
    });
    if (!resp.ok) {
      const handled = handleAiStatus(resp.status);
      if (handled) return handled;
      return jsonError(502, `AI error ${resp.status}`);
    }
    const data = await resp.json();
    let parsed: { memories?: Array<{ content?: string; category?: string; importance?: number }> } = {};
    try { parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? '{}'); } catch { parsed = {}; }
    const memories = Array.isArray(parsed.memories) ? parsed.memories : [];

    let inserted = 0;
    for (const m of memories.slice(0, 3)) {
      const content = String(m?.content ?? '').trim();
      if (!content || content.length < 6 || content.length > 400) continue;

      // Dedupe: skip if a very similar memory already exists
      const { data: existing } = await supabase
        .from('ai_memories')
        .select('id')
        .eq('user_id', userId)
        .eq('active', true)
        .ilike('content', `%${content.slice(0, 30)}%`)
        .limit(1);
      if (existing && existing.length > 0) continue;

      await supabase.from('ai_memories').insert({
        user_id: userId,
        content,
        category: typeof m?.category === 'string' ? m.category : null,
        importance: Math.max(1, Math.min(5, Number(m?.importance) || 1)),
        source_conversation_id: conversationId ?? null,
        source_message_id: sourceMessageId ?? null,
      });
      inserted += 1;
    }

    return new Response(JSON.stringify({ inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('extract-chat-memory error', e);
    return jsonError(500, e instanceof Error ? e.message : 'Unknown error');
  }
});