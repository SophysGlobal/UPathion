CREATE OR REPLACE FUNCTION public.search_schools(search_query text, school_type text DEFAULT NULL::text, country_filter text DEFAULT NULL::text, result_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, name text, country text, state text, city text, type text, is_notable boolean, match_rank integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        WHEN LOWER(s.name) = LOWER(search_query) THEN 1
        WHEN LOWER(s.name) LIKE LOWER(search_query) || '%' THEN 2
        WHEN LOWER(s.name) LIKE '% ' || LOWER(search_query) || '%' THEN 3
        WHEN LOWER(s.name) LIKE '%' || LOWER(search_query) || '%' THEN 4
        ELSE 5
      END AS match_rank,
      CASE WHEN s.is_notable THEN 0 ELSE 1 END AS notable_boost
    FROM public.schools s
    WHERE 
      (school_type IS NULL OR s.type = school_type)
      AND (country_filter IS NULL OR s.country = country_filter)
      AND s.name ILIKE '%' || search_query || '%'
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
$function$;