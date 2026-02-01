-- Add DELETE policy for profiles table to allow users to delete their own profiles
-- This addresses GDPR requirements for data deletion (Article 17 - Right to Erasure)

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);