
-- ============================================================
-- 1. school_email_domains (allowlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.school_email_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  domain text NOT NULL,
  school_type text NOT NULL CHECK (school_type IN ('high_school','college')),
  domain_type text NOT NULL DEFAULT 'student' CHECK (domain_type IN ('student','general','staff','alumni','unknown')),
  verification_allowed boolean NOT NULL DEFAULT false,
  manual_review_required boolean NOT NULL DEFAULT true,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_school_email_domains_domain ON public.school_email_domains(domain);
GRANT SELECT ON public.school_email_domains TO authenticated;
GRANT ALL ON public.school_email_domains TO service_role;
ALTER TABLE public.school_email_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read allowed domains"
  ON public.school_email_domains FOR SELECT TO authenticated
  USING (verification_allowed = true);
CREATE POLICY "Admins can manage domains"
  ON public.school_email_domains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_school_email_domains_updated
  BEFORE UPDATE ON public.school_email_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. student_email_verifications (server-owned truth of record)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  verified_email text NOT NULL,
  verified_domain text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked','pending')),
  method text NOT NULL DEFAULT 'otp_resend',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sev_user_active ON public.student_email_verifications(user_id) WHERE status='active';
CREATE INDEX IF NOT EXISTS idx_sev_school ON public.student_email_verifications(school_id);
-- Only owner may see own row (no code hash lives here). Writes are service_role only.
GRANT SELECT ON public.student_email_verifications TO authenticated;
GRANT ALL ON public.student_email_verifications TO service_role;
ALTER TABLE public.student_email_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own verification"
  ON public.student_email_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies for authenticated => only service_role can write.
CREATE TRIGGER trg_sev_updated
  BEFORE UPDATE ON public.student_email_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Academic-year expiry function (Aug 1 cutoff, 60-day carry)
-- ============================================================
CREATE OR REPLACE FUNCTION public.academic_year_expiry(_verified_at timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  ts timestamptz := _verified_at;
  this_aug timestamptz;
  upcoming_aug timestamptz;
BEGIN
  this_aug := make_timestamptz(EXTRACT(YEAR FROM ts AT TIME ZONE 'UTC')::int, 8, 1, 0, 0, 0, 'UTC');
  IF ts < this_aug THEN
    upcoming_aug := this_aug;
  ELSE
    upcoming_aug := this_aug + INTERVAL '1 year';
  END IF;
  IF (upcoming_aug - ts) < INTERVAL '60 days' THEN
    RETURN upcoming_aug + INTERVAL '1 year';
  END IF;
  RETURN upcoming_aug;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.academic_year_expiry(timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academic_year_expiry(timestamptz) TO authenticated, service_role;

-- ============================================================
-- 4. is_active_verified_student + verified_school_id_of helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_active_verified_student(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.student_email_verifications
    WHERE user_id = _user_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_verified_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_verified_student(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.verified_school_id_of(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.student_email_verifications
  WHERE user_id = _user_id
    AND status = 'active'
    AND expires_at > now()
  ORDER BY verified_at DESC
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.verified_school_id_of(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verified_school_id_of(uuid) TO authenticated, service_role;

-- ============================================================
-- 5. security_events audit log (admin-only reads)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','critical')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sec_events_created ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_events_type ON public.security_events(event_type);
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 6. Lock down student_verification_codes
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.student_verification_codes;
DROP POLICY IF EXISTS "Users can insert their own verification codes" ON public.student_verification_codes;
DROP POLICY IF EXISTS "Users can update their own verification codes" ON public.student_verification_codes;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.student_verification_codes FROM authenticated, anon;
GRANT ALL ON public.student_verification_codes TO service_role;
-- Expire (consume) any live codes so nothing minted before this migration is usable.
UPDATE public.student_verification_codes
  SET consumed_at = now()
  WHERE consumed_at IS NULL;

-- ============================================================
-- 7. Backfill: mirror any already-verified profiles into the
--    new server-owned verification table, with academic-year expiry.
-- ============================================================
INSERT INTO public.student_email_verifications
  (user_id, school_id, verified_email, verified_domain, verified_at, expires_at, status, method)
SELECT
  p.id,
  p.verified_school_id,
  COALESCE(p.verified_email, ''),
  COALESCE(split_part(p.verified_email, '@', 2), ''),
  COALESCE(p.verified_at, now()),
  public.academic_year_expiry(COALESCE(p.verified_at, now())),
  'active',
  'otp_resend'
FROM public.profiles p
WHERE p.verification_status = 'verified'
  AND p.verified_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.student_email_verifications s
    WHERE s.user_id = p.id AND s.status = 'active'
  );

-- ============================================================
-- 8. Profile sensitive-field write protection (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service role / trigger contexts have no auth.uid() -> allow.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.verified_email IS DISTINCT FROM OLD.verified_email
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_school_id IS DISTINCT FROM OLD.verified_school_id
  THEN
    -- Log then reject.
    INSERT INTO public.security_events(event_type, user_id, severity, metadata)
    VALUES ('profile_sensitive_field_write_blocked', auth.uid(), 'warn',
            jsonb_build_object('table','profiles'));
    RAISE EXCEPTION 'This field is managed by the system and cannot be edited directly.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_sensitive_updates() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_prevent_sensitive_updates ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_sensitive_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_sensitive_updates();

-- ============================================================
-- 9. Tighten school-only visibility on feed / groups / events / places
-- ============================================================
-- feed_posts
DROP POLICY IF EXISTS "Read feed posts by visibility" ON public.feed_posts;
CREATE POLICY "Read feed posts by visibility"
  ON public.feed_posts FOR SELECT
  USING (
    (NOT is_deleted) AND (
      visibility = 'public'::post_visibility
      OR author_id = auth.uid()
      OR (
        auth.uid() IS NOT NULL
        AND visibility = 'school_only'::post_visibility
        AND public.is_active_verified_student(auth.uid())
        AND school_id IS NOT NULL
        AND school_id = public.verified_school_id_of(auth.uid())
      )
      OR (auth.uid() IS NOT NULL AND visibility = 'connections'::post_visibility)
    )
  );

-- groups
DROP POLICY IF EXISTS "Read groups by visibility" ON public.groups;
CREATE POLICY "Read groups by visibility"
  ON public.groups FOR SELECT
  USING (
    is_active AND (
      visibility = 'public'::group_visibility
      OR creator_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_members m
        WHERE m.group_id = groups.id AND m.user_id = auth.uid()
      )
      OR (
        auth.uid() IS NOT NULL
        AND visibility = 'school_only'::group_visibility
        AND public.is_active_verified_student(auth.uid())
        AND school_id IS NOT NULL
        AND school_id = public.verified_school_id_of(auth.uid())
      )
    )
  );

-- events
DROP POLICY IF EXISTS events_select_visible ON public.events;
CREATE POLICY events_select_visible
  ON public.events FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND moderation_status <> 'removed'::moderation_status
    AND (
      creator_id = auth.uid()
      OR visibility = 'public'::entity_visibility
      OR EXISTS (
        SELECT 1 FROM public.event_rsvps r
        WHERE r.event_id = events.id AND r.user_id = auth.uid()
      )
      OR (
        visibility = 'school_only'::entity_visibility
        AND public.is_active_verified_student(auth.uid())
        AND school_id IS NOT NULL
        AND school_id = public.verified_school_id_of(auth.uid())
      )
    )
  );

-- places
DROP POLICY IF EXISTS places_select_visible ON public.places;
CREATE POLICY places_select_visible
  ON public.places FOR SELECT TO authenticated
  USING (
    is_deleted = false
    AND moderation_status <> 'removed'::moderation_status
    AND (
      creator_id = auth.uid()
      OR visibility = 'public'::entity_visibility
      OR (
        visibility = 'school_only'::entity_visibility
        AND public.is_active_verified_student(auth.uid())
        AND school_id IS NOT NULL
        AND school_id = public.verified_school_id_of(auth.uid())
      )
    )
  );
