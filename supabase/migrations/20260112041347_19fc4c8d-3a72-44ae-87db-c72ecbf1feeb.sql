-- Block all anonymous access to profiles table for defense-in-depth
-- This explicitly denies anonymous users from any operations on profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Also add explicit deny policy for user_roles table for consistency
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);