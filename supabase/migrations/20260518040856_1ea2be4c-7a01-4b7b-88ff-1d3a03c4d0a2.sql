DROP POLICY IF EXISTS "Existing participants can add members" ON public.conversation_participants;

CREATE POLICY "Members can add only themselves"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);