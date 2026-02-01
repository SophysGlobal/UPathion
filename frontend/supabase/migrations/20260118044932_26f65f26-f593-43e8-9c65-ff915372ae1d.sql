-- Add unique constraint for upsert operations
ALTER TABLE public.schools ADD CONSTRAINT schools_name_country_unique UNIQUE (name, country);