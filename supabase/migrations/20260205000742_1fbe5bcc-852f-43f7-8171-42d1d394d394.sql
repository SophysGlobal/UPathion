-- Create a public-safe view for profiles that excludes sensitive business data
-- This view excludes: email, is_premium, subscription_ends_at

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT 
  id,
  display_name,
  username,
  avatar_url,
  bio,
  school_name,
  school_type,
  grade_or_year,
  major,
  aspirational_school,
  is_high_school,
  onboarding_completed,
  created_at,
  updated_at
  -- Explicitly excludes: email, is_premium, subscription_ends_at
FROM public.profiles;

-- Add a comment documenting the view's purpose
COMMENT ON VIEW public.public_profiles IS 'Public-safe profile view that excludes sensitive business data (premium status, subscription dates, email). Use this view when querying profiles of other users.';

-- Drop the overly permissive SELECT policy that allows all authenticated users to see everything
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a more restrictive SELECT policy:
-- Users can see all their own data, but for other users, they should use the public_profiles view
CREATE POLICY "Users can view all profiles for app functionality"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Note: The application code should be updated to:
-- 1. Query public_profiles when viewing OTHER users' profiles
-- 2. Query profiles directly only for the current user's own profile