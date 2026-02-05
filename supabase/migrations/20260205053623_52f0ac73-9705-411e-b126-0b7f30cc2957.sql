-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles SELECT policy to own profile only
-- The application already uses public_profiles view for viewing other users

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles for app functionality" ON profiles;

-- Create a new policy that only allows users to view their own full profile
-- (including sensitive fields like email, is_premium, subscription_ends_at)
CREATE POLICY "Users can view own full profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);