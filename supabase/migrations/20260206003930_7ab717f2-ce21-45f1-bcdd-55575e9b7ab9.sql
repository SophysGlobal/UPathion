-- Add referral_source column to profiles table for marketing attribution
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add referral_source_other column for "Other" option details
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_source_other TEXT;

-- Update the public_profiles view to include the new fields (they're not sensitive)
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
FROM public.profiles;