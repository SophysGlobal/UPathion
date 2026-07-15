
-- ============ AI CONVERSATIONS ============
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  summary TEXT,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_conversations_user_updated_idx ON public.ai_conversations(user_id, last_message_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ai_conversations_title_trgm ON public.ai_conversations USING gin (title gin_trgm_ops);

-- ============ AI MESSAGES ============
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.ai_messages FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_messages_conversation_idx ON public.ai_messages(conversation_id, created_at);
CREATE INDEX ai_messages_content_fts ON public.ai_messages USING gin (to_tsvector('english', content));

-- ============ AI ATTACHMENTS ============
CREATE TABLE public.ai_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_message_attachments TO authenticated;
GRANT ALL ON public.ai_message_attachments TO service_role;
ALTER TABLE public.ai_message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attachments" ON public.ai_message_attachments FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_attachments_message_idx ON public.ai_message_attachments(message_id);

-- ============ AI MEMORIES ============
CREATE TABLE public.ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  source_conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES public.ai_messages(id) ON DELETE SET NULL,
  importance INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.ai_memories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_memories_user_active_idx ON public.ai_memories(user_id) WHERE active = true;
CREATE INDEX ai_memories_content_trgm ON public.ai_memories USING gin (content gin_trgm_ops);

-- ============ TRIGGERS ============
CREATE TRIGGER ai_conversations_touch BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_memories_touch BEFORE UPDATE ON public.ai_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bump conversation last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION public.bump_ai_conversation_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.ai_conversations
    SET last_message_at = now(), updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER ai_messages_bump AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_ai_conversation_on_message();

-- Ensure trigram is available for ILIKE search perf
CREATE EXTENSION IF NOT EXISTS pg_trgm;
