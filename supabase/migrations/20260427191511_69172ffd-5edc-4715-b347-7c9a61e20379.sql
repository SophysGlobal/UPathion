-- Add logo_url for school profiles (Clearbit / favicon / manually uploaded)
ALTER TABLE public.school_profiles
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Faster profile lookups by school
CREATE INDEX IF NOT EXISTS idx_school_profiles_school_id
  ON public.school_profiles (school_id);