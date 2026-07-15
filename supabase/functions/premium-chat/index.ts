import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  jsonError,
  requirePremiumUser,
  callLovableChat,
  handleAiStatus,
  CHAT_MODEL,
  LOVABLE_API_KEY,
  serviceClient,
} from '../_shared/ai-auth.ts';

type Attachment = { storagePath: string; mimeType: string };
type IncomingMessage = { role: 'user' | 'assistant' | 'system'; content: string; attachments?: Attachment[] };

const MAX_MSG_LEN = 20000;
const MAX_HISTORY = 30;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requirePremiumUser(req);
    if (!auth.ok) return auth.response;
    const { userId, supabase } = auth;

    if (!LOVABLE_API_KEY) return jsonError(500, 'LOVABLE_API_KEY not configured');

    const body = await req.json();
    let conversationId: string | null = body.conversationId ?? null;
    const incoming: IncomingMessage[] = Array.isArray(body.messages) ? body.messages : [];
    if (incoming.length === 0) return jsonError(400, 'messages required');
    const latest = incoming[incoming.length - 1];
    if (!latest || latest.role !== 'user' || typeof latest.content !== 'string') {
      return jsonError(400, 'last message must be user');
    }
    if (latest.content.length > MAX_MSG_LEN) return jsonError(400, 'message too long');

    // Create conversation if missing
    if (!conversationId) {
      const { data: convo, error: cErr } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: 'New Chat' })
        .select('id')
        .single();
      if (cErr || !convo) return jsonError(500, 'Failed to create conversation');
      conversationId = convo.id as string;
    } else {
      // Verify ownership
      const { data: exists } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!exists) return jsonError(404, 'Conversation not found');
    }

    // Save user message
    const { data: userMsg, error: uErr } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: latest.content,
      })
      .select('id')
      .single();
    if (uErr || !userMsg) return jsonError(500, 'Failed to save message');

    // Save attachments referenced on latest user message
    const attachments = Array.isArray(latest.attachments) ? latest.attachments : [];
    const svc = serviceClient();
    const signedImageParts: Array<{ type: 'image_url'; image_url: { url: string } }> = [];
    for (const att of attachments) {
      if (!att?.storagePath || typeof att.storagePath !== 'string') continue;
      // Ensure the path is under the user's folder
      if (!att.storagePath.startsWith(`${userId}/`)) continue;
      await supabase.from('ai_message_attachments').insert({
        message_id: userMsg.id,
        user_id: userId,
        storage_path: att.storagePath,
        mime_type: att.mimeType || 'image/jpeg',
        size_bytes: 0,
      });
      const { data: signed } = await svc.storage
        .from('ai-chat-uploads')
        .createSignedUrl(att.storagePath, 60 * 60);
      if (signed?.signedUrl) {
        signedImageParts.push({ type: 'image_url', image_url: { url: signed.signedUrl } });
      }
    }

    // Retrieve memories (top ~8, active) matching keywords in latest message
    const words = latest.content.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    let memories: Array<{ content: string }> = [];
    if (words.length > 0) {
      const { data: memoryHits } = await supabase
        .from('ai_memories')
        .select('content, updated_at')
        .eq('user_id', userId)
        .eq('active', true)
        .or(words.slice(0, 6).map((w) => `content.ilike.%${w}%`).join(','))
        .order('updated_at', { ascending: false })
        .limit(8);
      memories = memoryHits ?? [];
    }
    if (memories.length === 0) {
      const { data: recent } = await supabase
        .from('ai_memories')
        .select('content')
        .eq('user_id', userId)
        .eq('active', true)
        .order('updated_at', { ascending: false })
        .limit(4);
      memories = recent ?? [];
    }

    // Load recent conversation history for context
    const { data: historyRows } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(MAX_HISTORY);
    const history = (historyRows ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content ?? '',
    }));

    const memoryBlock = memories.length
      ? `\n\nRelevant long-term memory about this user (use only if relevant, do not recite):\n${memories.map((m) => `- ${m.content}`).join('\n')}`
      : '';

    const systemMessage = {
      role: 'system' as const,
      content:
        'You are the UPathion Premium AI assistant, helping high school, college, and grad students with academics, careers, and planning. Be warm, concise, and specific. Use markdown when helpful.' +
        memoryBlock,
    };

    // Attach images to the LAST user message as vision content parts
    const modelMessages: Array<Record<string, unknown>> = history.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const lastUser = history[history.length - 1];
    if (signedImageParts.length > 0 && lastUser) {
      modelMessages.push({
        role: 'user',
        content: [{ type: 'text', text: lastUser.content }, ...signedImageParts],
      });
    } else if (lastUser) {
      modelMessages.push({ role: 'user', content: lastUser.content });
    }

    const upstream = await callLovableChat({
      model: CHAT_MODEL,
      messages: [systemMessage, ...modelMessages],
      stream: true,
    });
    if (!upstream.ok) {
      const handled = handleAiStatus(upstream.status);
      if (handled) return handled;
      const errText = await upstream.text();
      console.error('AI upstream error', upstream.status, errText);
      return jsonError(502, `AI provider error: ${upstream.status}`);
    }

    // Tee the stream: forward to client, collect for saving assistant message
    const [clientStream, saveStream] = upstream.body!.tee();

    (async () => {
      try {
        const reader = saveStream.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let assistant = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const j = line.slice(6).trim();
            if (j === '[DONE]') continue;
            try {
              const parsed = JSON.parse(j);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') assistant += delta;
            } catch { /* ignore */ }
          }
        }
        if (assistant.trim()) {
          const { data: savedAssistant } = await supabase
            .from('ai_messages')
            .insert({
              conversation_id: conversationId!,
              user_id: userId,
              role: 'assistant',
              content: assistant,
            })
            .select('id')
            .single();

          // Async: title generation for first exchange & memory extraction
          const { count } = await supabase
            .from('ai_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conversationId!);

          const supaUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const authHeader = req.headers.get('Authorization') ?? '';
          const post = (path: string, body: unknown) =>
            fetch(`${supaUrl}/functions/v1/${path}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: authHeader },
              body: JSON.stringify(body),
            }).catch((e) => console.error(`Async ${path} failed`, e));

          if ((count ?? 0) <= 2) {
            post('generate-chat-title', {
              conversationId,
              userMessage: latest.content,
              assistantMessage: assistant,
            });
          }
          post('extract-chat-memory', {
            conversationId,
            sourceMessageId: savedAssistant?.id,
            userMessage: latest.content,
            assistantMessage: assistant,
          });
        }
      } catch (e) {
        console.error('save stream error', e);
      }
    })();

    return new Response(clientStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'X-Conversation-Id': conversationId,
      },
    });
  } catch (e) {
    console.error('premium-chat error', e);
    return jsonError(500, e instanceof Error ? e.message : 'Unknown error');
  }
});
