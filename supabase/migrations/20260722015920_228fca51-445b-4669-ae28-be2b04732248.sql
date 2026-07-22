
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX IF NOT EXISTS schools_name_trgm_idx
  ON public.schools USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS schools_name_lower_idx
  ON public.schools (lower(name));

CREATE OR REPLACE FUNCTION public.search_schools(
  search_query text,
  school_type text DEFAULT NULL,
  country_filter text DEFAULT NULL,
  result_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  name text,
  country text,
  state text,
  city text,
  type text,
  is_notable boolean,
  match_rank integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  q text := lower(unaccent(trim(coalesce(search_query, ''))));
  tokens text[];
BEGIN
  IF length(q) < 2 THEN
    RETURN;
  END IF;

  tokens := regexp_split_to_array(q, '\s+');

  RETURN QUERY
  WITH base AS (
    SELECT
      s.id, s.name, s.country, s.state, s.city, s.type, s.is_notable,
      lower(unaccent(s.name)) AS lname
    FROM public.schools s
    WHERE (school_type IS NULL OR s.type = school_type)
      AND (country_filter IS NULL OR s.country = country_filter)
  ),
  scored AS (
    SELECT
      b.*,
      -- similarity for fuzzy fallback
      similarity(b.lname, q) AS sim,
      -- exact/prefix/substring booleans
      (b.lname = q) AS is_exact,
      (b.lname LIKE q || '%') AS is_prefix,
      (b.lname LIKE '%' || q || '%') AS is_substring,
      -- all tokens present (in any order, partial words allowed)
      (
        SELECT bool_and(b.lname LIKE '%' || tok || '%')
        FROM unnest(tokens) AS tok
        WHERE length(tok) > 0
      ) AS all_tokens_match
    FROM base b
    WHERE
      b.lname LIKE '%' || q || '%'
      OR b.lname % q
      OR (
        SELECT bool_and(b.lname LIKE '%' || tok || '%')
        FROM unnest(tokens) AS tok
        WHERE length(tok) > 0
      )
  )
  SELECT
    s.id, s.name, s.country, s.state, s.city, s.type, s.is_notable,
    CASE
      WHEN s.is_exact THEN 1
      WHEN s.is_prefix THEN 2
      WHEN s.all_tokens_match THEN 3
      WHEN s.is_substring THEN 4
      ELSE 5
    END AS match_rank
  FROM scored s
  ORDER BY
    CASE
      WHEN s.is_exact THEN 1
      WHEN s.is_prefix THEN 2
      WHEN s.all_tokens_match THEN 3
      WHEN s.is_substring THEN 4
      ELSE 5
    END,
    (NOT s.is_notable),
    s.sim DESC,
    length(s.name),
    s.name
  LIMIT result_limit;
END;
$function$;
