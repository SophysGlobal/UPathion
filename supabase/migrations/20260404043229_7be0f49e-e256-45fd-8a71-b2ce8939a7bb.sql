ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_name_country_unique;
ALTER TABLE public.schools ADD CONSTRAINT schools_name_location_unique UNIQUE (name, city, state, country, type);