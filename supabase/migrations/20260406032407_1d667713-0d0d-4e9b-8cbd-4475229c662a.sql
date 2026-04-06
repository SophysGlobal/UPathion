
-- 1. Replace the overly permissive SELECT policy on profiles
-- Only allow users to see their OWN full profile row
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Restrict conversation_participants INSERT so users can only add THEMSELVES
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;

CREATE POLICY "Users can add themselves to conversations"
  ON public.conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );
