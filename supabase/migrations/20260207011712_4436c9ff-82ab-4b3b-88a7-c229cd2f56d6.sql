
-- Add interests column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Update public_profiles view to include interests
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker=on) AS
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
