-- Add enrichment columns to school_profiles table for real data
ALTER TABLE public.school_profiles
ADD COLUMN IF NOT EXISTS acceptance_rate numeric,
ADD COLUMN IF NOT EXISTS ranking text,
ADD COLUMN IF NOT EXISTS ranking_source text,
ADD COLUMN IF NOT EXISTS programs_count integer,
ADD COLUMN IF NOT EXISTS student_faculty_ratio text,
ADD COLUMN IF NOT EXISTS graduation_rate numeric,
ADD COLUMN IF NOT EXISTS tuition_in_state integer,
ADD COLUMN IF NOT EXISTS tuition_out_of_state integer,
ADD COLUMN IF NOT EXISTS locale text,
ADD COLUMN IF NOT EXISTS carnegie_classification text,
ADD COLUMN IF NOT EXISTS religious_affiliation text,
ADD COLUMN IF NOT EXISTS ownership_type text,
ADD COLUMN IF NOT EXISTS ipeds_id text,
ADD COLUMN IF NOT EXISTS scorecard_id integer,
ADD COLUMN IF NOT EXISTS nces_id text,
-- Source tracking for data provenance
ADD COLUMN IF NOT EXISTS source_name text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS source_retrieved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS about_source text,
ADD COLUMN IF NOT EXISTS about_source_url text,
-- Enrichment status tracking
ADD COLUMN IF NOT EXISTS enrichment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enrichment_error text,
ADD COLUMN IF NOT EXISTS last_enrichment_attempt timestamp with time zone;

-- Add index for enrichment processing
CREATE INDEX IF NOT EXISTS idx_school_profiles_enrichment_status 
ON public.school_profiles(enrichment_status);

-- Add index for finding stale profiles  
CREATE INDEX IF NOT EXISTS idx_school_profiles_source_retrieved_at 
ON public.school_profiles(source_retrieved_at);

-- Add comment explaining enrichment_status values
COMMENT ON COLUMN public.school_profiles.enrichment_status IS 'Values: pending, enriched, failed, stale';