CREATE INDEX IF NOT EXISTS idx_schools_name_trgm ON public.schools USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_schools_type ON public.schools (type);
CREATE INDEX IF NOT EXISTS idx_schools_state_name ON public.schools (state, name);