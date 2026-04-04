-- Recreate public_profiles view with security_invoker and restricted columns
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = on)
AS
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
  interests,
  created_at,
  updated_at
FROM public.profiles;

-- Grant select to authenticated users (view respects underlying RLS)
GRANT SELECT ON public.public_profiles TO authenticated;
REVOKE ALL ON public.public_profiles FROM anon;

-- Add a broader SELECT policy so authenticated users can see other users' public profiles via the view
-- (The view uses security_invoker so it runs as the querying user)
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old owner-only policy since the new one is broader
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;