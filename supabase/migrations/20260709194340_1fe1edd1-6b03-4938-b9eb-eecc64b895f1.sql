
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS education_status text,
  ADD COLUMN IF NOT EXISTS undergraduate_degree_type text,
  ADD COLUMN IF NOT EXISTS college_major text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS associate_degree_major text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS high_school_pursuing_associates boolean,
  ADD COLUMN IF NOT EXISTS intended_major text[] DEFAULT '{}'::text[];

-- Constrain to allowed values (nullable OK)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_education_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_education_status_check
  CHECK (education_status IS NULL OR education_status IN ('high_school','college','graduate'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_undergrad_degree_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_undergrad_degree_type_check
  CHECK (undergraduate_degree_type IS NULL OR undergraduate_degree_type IN ('bachelors','associates','both'));

-- Backfill education_status from existing signals; do not overwrite
UPDATE public.profiles
SET education_status = CASE
  WHEN student_level = 'grad' THEN 'graduate'
  WHEN school_type = 'college' THEN 'college'
  WHEN school_type = 'high_school' THEN 'high_school'
  ELSE education_status
END
WHERE education_status IS NULL;

-- Default undergrad type = bachelors for existing college undergrads
UPDATE public.profiles
SET undergraduate_degree_type = 'bachelors'
WHERE undergraduate_degree_type IS NULL
  AND education_status = 'college';

-- Backfill college_major from comma-separated major string
UPDATE public.profiles
SET college_major = ARRAY(
  SELECT trim(x) FROM unnest(string_to_array(major, ',')) AS x WHERE trim(x) <> ''
)
WHERE education_status = 'college'
  AND (college_major IS NULL OR array_length(college_major,1) IS NULL)
  AND major IS NOT NULL
  AND btrim(major) <> '';

-- Backfill intended_major for high schoolers from existing interests
UPDATE public.profiles
SET intended_major = interests
WHERE education_status = 'high_school'
  AND (intended_major IS NULL OR array_length(intended_major,1) IS NULL)
  AND interests IS NOT NULL
  AND array_length(interests,1) IS NOT NULL;
