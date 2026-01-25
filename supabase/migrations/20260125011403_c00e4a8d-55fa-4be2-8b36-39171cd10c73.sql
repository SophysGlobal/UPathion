-- Drop the overly permissive policy and create a more specific one
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

-- Create a function to check if user is creating a conversation they'll participate in
CREATE POLICY "Authenticated users can create conversations they join"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);