-- Add per-year description caching + NCES fields for high schools
ALTER TABLE public.school_profiles
  ADD COLUMN IF NOT EXISTS description_year integer,
  ADD COLUMN IF NOT EXISTS national_ranking integer,
  ADD COLUMN IF NOT EXISTS state_ranking integer,
  ADD COLUMN IF NOT EXISTS selectivity_tier text,
  ADD COLUMN IF NOT EXISTS demographics jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS school_subtype text;

-- Reset existing 5 generic profiles so they regenerate with the new system
UPDATE public.school_profiles
SET enrichment_status = 'pending',
    about_text = NULL,
    description_year = NULL
WHERE enrichment_status IN ('pending', 'generated', 'failed')
   OR description_year IS NULL;
