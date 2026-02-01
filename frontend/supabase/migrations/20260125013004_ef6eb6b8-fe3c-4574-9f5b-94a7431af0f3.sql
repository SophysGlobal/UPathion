-- Add UPDATE policy to conversations table
-- This ensures only conversation participants can update conversation metadata

CREATE POLICY "Users can update conversations they participate in"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );