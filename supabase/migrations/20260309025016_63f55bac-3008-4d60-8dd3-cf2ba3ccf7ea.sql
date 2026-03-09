
-- Fix 1: conversation_participants INSERT policy - self-referential join bug
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations they're in"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) OR (
    EXISTS (
      SELECT 1
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  )
);

-- Fix 2: Remove overly permissive profiles SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all profiles for app functionality" ON public.profiles;
