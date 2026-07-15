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

    const { conversationId, userMessage, assistantMessage } = await req.json();
    if (!conversationId || typeof conversationId !== 'string') return jsonError(400, 'conversationId required');

    const { data: convo } = await supabase
      .from('ai_conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!convo) return jsonError(404, 'not found');
    if (convo.title && convo.title !== 'New Chat') {
      return new Response(JSON.stringify({ title: convo.title, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Generate a concise conversation title (max 6 words, no quotes, no trailing punctuation) that describes this exchange:\n\nUser: ${String(userMessage ?? '').slice(0, 500)}\nAssistant: ${String(assistantMessage ?? '').slice(0, 500)}\n\nReturn ONLY the title text.`;

    const resp = await callLovableChat({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: 'You write short, specific conversation titles.' },
        { role: 'user', content: prompt },
      ],
      stream: false,
    });
    if (!resp.ok) {
      const handled = handleAiStatus(resp.status);
      if (handled) return handled;
      return jsonError(502, `AI error ${resp.status}`);
    }
    const data = await resp.json();
    let title = String(data?.choices?.[0]?.message?.content ?? '').trim();
    title = title.replace(/^["'`]|["'`]$/g, '').replace(/[.!?]+$/, '').slice(0, 60);
    if (!title) title = 'New Chat';

    await supabase.from('ai_conversations').update({ title }).eq('id', conversationId).eq('user_id', userId);
    return new Response(JSON.stringify({ title }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-chat-title error', e);
    return jsonError(500, e instanceof Error ? e.message : 'Unknown error');
  }
});