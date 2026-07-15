import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AIConversation = {
  id: string;
  title: string;
  archived_at: string | null;
  deleted_at: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type AIAttachment = {
  id: string;
  storage_path: string;
  mime_type: string;
  signedUrl?: string;
};

export type AIMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  error: string | null;
  created_at: string;
  attachments?: AIAttachment[];
};

export function useAIConversationsList(includeArchived = false) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const q = supabase
      .from("ai_conversations")
      .select("id,title,archived_at,deleted_at,last_message_at,created_at,updated_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false })
      .limit(200);
    const { data, error } = includeArchived ? await q : await q.is("archived_at", null);
    if (error) console.error(error);
    setConversations((data as AIConversation[]) ?? []);
    setLoading(false);
  }, [user, includeArchived]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`ai_convos_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_conversations", filter: `user_id=eq.${user.id}` },
        () => void refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refresh]);

  return { conversations, loading, refresh };
}

export function useAIMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId || !user) { setMessages([]); return; }
    setLoading(true);
    const { data: msgs } = await supabase
      .from("ai_messages")
      .select("id, role, content, error, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    const rows = (msgs ?? []) as AIMessageRow[];

    if (rows.length > 0) {
      const { data: atts } = await supabase
        .from("ai_message_attachments")
        .select("id, message_id, storage_path, mime_type")
        .in("message_id", rows.map((r) => r.id));
      const byMsg = new Map<string, AIAttachment[]>();
      for (const a of atts ?? []) {
        const arr = byMsg.get(a.message_id) ?? [];
        arr.push({ id: a.id, storage_path: a.storage_path, mime_type: a.mime_type });
        byMsg.set(a.message_id, arr);
      }
      // Sign URLs in parallel
      const allAtts = Array.from(byMsg.values()).flat();
      if (allAtts.length > 0) {
        const { data: signed } = await supabase.storage
          .from("ai-chat-uploads")
          .createSignedUrls(allAtts.map((a) => a.storage_path), 60 * 60);
        const pathToUrl = new Map<string, string>();
        for (const s of signed ?? []) if (s.path && s.signedUrl) pathToUrl.set(s.path, s.signedUrl);
        for (const a of allAtts) if (pathToUrl.get(a.storage_path)) a.signedUrl = pathToUrl.get(a.storage_path);
      }
      for (const r of rows) r.attachments = byMsg.get(r.id) ?? [];
    }
    setMessages(rows);
    setLoading(false);
  }, [conversationId, user]);

  useEffect(() => { void load(); }, [load]);

  return { messages, setMessages, loading, reload: load };
}

export async function createConversation(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("ai_conversations")
    .insert({ user_id: userId, title: "New Chat" })
    .select("id").single();
  return data?.id ?? null;
}

export async function renameConversation(id: string, title: string) {
  await supabase.from("ai_conversations").update({ title }).eq("id", id);
}

export async function archiveConversation(id: string, archived: boolean) {
  await supabase.from("ai_conversations").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", id);
}

export async function deleteConversation(id: string) {
  await supabase.from("ai_conversations").update({ deleted_at: new Date().toISOString() }).eq("id", id);
}

export async function searchConversations(userId: string, query: string): Promise<AIConversation[]> {
  const q = query.trim();
  if (!q) return [];
  // Title match
  const { data: byTitle } = await supabase
    .from("ai_conversations")
    .select("id,title,archived_at,deleted_at,last_message_at,created_at,updated_at")
    .eq("user_id", userId).is("deleted_at", null)
    .ilike("title", `%${q}%`)
    .order("last_message_at", { ascending: false })
    .limit(20);
  // Message match
  const { data: msgHits } = await supabase
    .from("ai_messages")
    .select("conversation_id")
    .eq("user_id", userId)
    .ilike("content", `%${q}%`)
    .limit(50);
  const convoIds = Array.from(new Set((msgHits ?? []).map((m) => m.conversation_id)));
  let byContent: AIConversation[] = [];
  if (convoIds.length > 0) {
    const { data } = await supabase
      .from("ai_conversations")
      .select("id,title,archived_at,deleted_at,last_message_at,created_at,updated_at")
      .in("id", convoIds)
      .is("deleted_at", null);
    byContent = (data as AIConversation[]) ?? [];
  }
  const seen = new Set<string>();
  const merged: AIConversation[] = [];
  for (const c of [...(byTitle ?? []), ...byContent]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    merged.push(c);
  }
  return merged.sort((a, b) => (b.last_message_at > a.last_message_at ? 1 : -1));
}