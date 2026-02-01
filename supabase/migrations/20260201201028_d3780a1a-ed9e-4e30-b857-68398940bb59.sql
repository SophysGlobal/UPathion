-- Fix: Allow authenticated users to view other users' public profile data
-- Currently users can only view their own profile, which breaks viewing other users

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a policy that allows authenticated users to view any profile
-- This is needed for social features like viewing other users' profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);