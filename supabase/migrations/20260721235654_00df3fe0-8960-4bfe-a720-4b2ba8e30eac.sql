
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits(user_id, action, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.rate_limits(window_start);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No authenticated/anon policies: only service_role may read/write.

CREATE OR REPLACE FUNCTION public.rate_limit_check(
  _user_id uuid,
  _action text,
  _max integer,
  _window_sec integer
) RETURNS TABLE (allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  win_start timestamptz;
  cur integer;
BEGIN
  -- Bucket into fixed windows of _window_sec seconds.
  win_start := to_timestamp(floor(extract(epoch FROM now()) / _window_sec) * _window_sec);

  INSERT INTO public.rate_limits(user_id, action, window_start, count)
  VALUES (_user_id, _action, win_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO cur;

  RETURN QUERY SELECT
    (cur <= _max),
    GREATEST(_max - cur, 0),
    win_start + (_window_sec * interval '1 second');
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rate_limit_check(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(uuid, text, integer, integer) TO service_role;

-- Best-effort cleanup helper — service role only.
CREATE OR REPLACE FUNCTION public.purge_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  WITH del AS (
    DELETE FROM public.rate_limits
    WHERE window_start < now() - interval '24 hours'
    RETURNING 1
  )
  SELECT count(*) INTO n FROM del;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.purge_old_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_rate_limits() TO service_role;
