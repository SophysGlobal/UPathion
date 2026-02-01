-- Drop the index first since it depends on pg_trgm
DROP INDEX IF EXISTS public.idx_schools_name_trgm;

-- Move pg_trgm extension to extensions schema (best practice)
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the index using the extensions schema
CREATE INDEX idx_schools_name_trgm ON public.schools USING gin (name extensions.gin_trgm_ops);

-- Update search function to use extensions schema
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
SET search_path = public, extensions
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
        OR extensions.similarity(s.name, search_query) > 0.1
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