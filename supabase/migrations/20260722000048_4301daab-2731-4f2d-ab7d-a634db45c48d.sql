
-- 1. Storage hardening: replace the ai-chat-uploads insert policy with one that
-- also enforces size and mime type at the row level.
DROP POLICY IF EXISTS "ai uploads insert own" ON storage.objects;
CREATE POLICY "ai uploads insert own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-chat-uploads'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760
    AND lower(COALESCE(metadata->>'mimetype', '')) IN (
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'
    )
  );

-- 2. Generic per-user rate-limit helper for triggers.
CREATE OR REPLACE FUNCTION public.enforce_user_rate_limit(
  _user_id uuid, _action text, _max integer, _window_sec integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  win_start timestamptz;
  cur integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN;
  END IF;
  win_start := to_timestamp(floor(extract(epoch FROM now()) / _window_sec) * _window_sec);
  INSERT INTO public.rate_limits(user_id, action, window_start, count)
  VALUES (_user_id, _action, win_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO cur;
  IF cur > _max THEN
    RAISE EXCEPTION 'Rate limit exceeded for %', _action
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_user_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_user_rate_limit(uuid, text, integer, integer) TO service_role;

-- 3. Trigger functions for reports / blocks / mutes.
CREATE OR REPLACE FUNCTION public.enforce_report_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reporter_id IS NULL THEN
    RAISE EXCEPTION 'reporter_id required';
  END IF;
  IF NEW.reported_user_id IS NOT NULL AND NEW.reported_user_id = NEW.reporter_id THEN
    RAISE EXCEPTION 'You cannot report yourself';
  END IF;
  PERFORM public.enforce_user_rate_limit(NEW.reporter_id, 'insert_report', 10, 3600);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_reports_abuse_limit ON public.reports;
CREATE TRIGGER trg_reports_abuse_limit
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_report_rules();

CREATE OR REPLACE FUNCTION public.enforce_block_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.blocker_id IS NULL OR NEW.blocked_id IS NULL THEN
    RAISE EXCEPTION 'blocker_id and blocked_id required';
  END IF;
  IF NEW.blocker_id = NEW.blocked_id THEN
    RAISE EXCEPTION 'You cannot block yourself';
  END IF;
  PERFORM public.enforce_user_rate_limit(NEW.blocker_id, 'insert_block', 30, 3600);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_blocks_abuse_limit ON public.user_blocks;
CREATE TRIGGER trg_blocks_abuse_limit
  BEFORE INSERT ON public.user_blocks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_block_rules();

CREATE OR REPLACE FUNCTION public.enforce_mute_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.muter_id IS NULL OR NEW.muted_id IS NULL THEN
    RAISE EXCEPTION 'muter_id and muted_id required';
  END IF;
  IF NEW.muter_id = NEW.muted_id THEN
    RAISE EXCEPTION 'You cannot mute yourself';
  END IF;
  PERFORM public.enforce_user_rate_limit(NEW.muter_id, 'insert_mute', 30, 3600);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_mutes_abuse_limit ON public.user_mutes;
CREATE TRIGGER trg_mutes_abuse_limit
  BEFORE INSERT ON public.user_mutes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_mute_rules();

-- 4. Audit surface: fast lookups for the admin dashboard.
CREATE INDEX IF NOT EXISTS idx_security_events_recent
  ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type
  ON public.security_events (event_type, created_at DESC);
