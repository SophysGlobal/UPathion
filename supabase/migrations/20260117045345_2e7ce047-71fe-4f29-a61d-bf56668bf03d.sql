-- Enable the pg_trgm extension for fuzzy text search FIRST
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create schools table for searchable school data
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  state TEXT,
  city TEXT,
  type TEXT NOT NULL CHECK (type IN ('high_school', 'university')),
  is_notable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast search (pg_trgm is now available)
CREATE INDEX idx_schools_name_trgm ON public.schools USING gin (name gin_trgm_ops);
CREATE INDEX idx_schools_type ON public.schools (type);
CREATE INDEX idx_schools_country ON public.schools (country);
CREATE INDEX idx_schools_state ON public.schools (state);
CREATE INDEX idx_schools_notable ON public.schools (is_notable) WHERE is_notable = true;

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read schools
CREATE POLICY "Anyone can read schools"
ON public.schools
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to read schools too (for sign-up flow)
CREATE POLICY "Anonymous can read schools"
ON public.schools
FOR SELECT
TO anon
USING (true);

-- Create function for ranked school search
CREATE OR REPLACE FUNCTION public.search_schools(
  search_query TEXT,
  school_type TEXT DEFAULT NULL,
  country_filter TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  type TEXT,
  is_notable BOOLEAN,
  match_rank INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_schools AS (
    SELECT 
      s.id,
      s.name,
      s.country,
      s.state,
      s.city,
      s.type,
      s.is_notable,
      CASE
        -- Exact match (highest priority)
        WHEN LOWER(s.name) = LOWER(search_query) THEN 1
        -- Starts with search query (high priority)
        WHEN LOWER(s.name) LIKE LOWER(search_query) || '%' THEN 2
        -- Word starts with search query
        WHEN LOWER(s.name) LIKE '% ' || LOWER(search_query) || '%' THEN 3
        -- Contains search query
        WHEN LOWER(s.name) LIKE '%' || LOWER(search_query) || '%' THEN 4
        -- Fuzzy match
        ELSE 5
      END AS match_rank,
      -- Boost notable schools within same rank
      CASE WHEN s.is_notable THEN 0 ELSE 1 END AS notable_boost
    FROM public.schools s
    WHERE 
      (school_type IS NULL OR s.type = school_type)
      AND (country_filter IS NULL OR s.country = country_filter)
      AND (
        search_query IS NULL 
        OR search_query = '' 
        OR s.name ILIKE '%' || search_query || '%'
        OR similarity(s.name, search_query) > 0.1
      )
  )
  SELECT 
    rs.id,
    rs.name,
    rs.country,
    rs.state,
    rs.city,
    rs.type,
    rs.is_notable,
    rs.match_rank
  FROM ranked_schools rs
  ORDER BY rs.match_rank, rs.notable_boost, rs.name
  LIMIT result_limit;
END;
$$;