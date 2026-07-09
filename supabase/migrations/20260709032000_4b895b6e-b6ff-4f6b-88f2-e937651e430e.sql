
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles WITH (security_invoker=on) AS
SELECT
  id, display_name, username, avatar_url, bio,
  school_name, school_type, grade_or_year, major, aspirational_school,
  interests, is_high_school, onboarding_completed,
  degree, graduation_year, student_level,
  verification_status, verified_at,
  created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
