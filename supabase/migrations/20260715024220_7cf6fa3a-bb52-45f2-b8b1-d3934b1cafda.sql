
ALTER TYPE public.report_target_type ADD VALUE IF NOT EXISTS 'event';
ALTER TYPE public.report_target_type ADD VALUE IF NOT EXISTS 'place';

DO $$ BEGIN
  CREATE TYPE public.entity_visibility AS ENUM ('public','school_only','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM ('pending','approved','flagged','removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.event_location_type AS ENUM ('physical','virtual','hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.rsvp_status AS ENUM ('going','cancelled','waitlist');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 140),
  description TEXT,
  event_type TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  all_day BOOLEAN NOT NULL DEFAULT false,
  location_type public.event_location_type NOT NULL DEFAULT 'physical',
  location_name TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  virtual_link TEXT,
  maps_url TEXT,
  image_url TEXT,
  visibility public.entity_visibility NOT NULL DEFAULT 'public',
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  attendee_count INTEGER NOT NULL DEFAULT 0,
  moderation_status public.moderation_status NOT NULL DEFAULT 'approved',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS events_starts_at_idx ON public.events (starts_at);
CREATE INDEX IF NOT EXISTS events_creator_idx ON public.events (creator_id);
CREATE INDEX IF NOT EXISTS events_visibility_idx ON public.events (visibility, moderation_status, is_deleted);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS event_rsvps_user_idx ON public.event_rsvps (user_id, status);
CREATE INDEX IF NOT EXISTS event_rsvps_event_idx ON public.event_rsvps (event_id, status);

-- Policies (event_rsvps exists now)
CREATE POLICY "events_select_visible" ON public.events FOR SELECT TO authenticated
USING (
  is_deleted = false
  AND moderation_status <> 'removed'
  AND (
    creator_id = auth.uid()
    OR visibility = 'public'
    OR visibility = 'school_only'
    OR EXISTS (SELECT 1 FROM public.event_rsvps r WHERE r.event_id = events.id AND r.user_id = auth.uid())
  )
);
CREATE POLICY "events_insert_own" ON public.events FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));
CREATE POLICY "events_update_own" ON public.events FOR UPDATE TO authenticated
USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "events_delete_own" ON public.events FOR DELETE TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "rsvps_select_self_or_creator" ON public.event_rsvps FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid())
);
CREATE POLICY "rsvps_insert_self" ON public.event_rsvps FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));
CREATE POLICY "rsvps_update_self" ON public.event_rsvps FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "rsvps_delete_self_or_creator" ON public.event_rsvps FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.creator_id = auth.uid())
);

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER rsvps_set_updated_at BEFORE UPDATE ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_event_attendee_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cap INTEGER; current_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'going' THEN
    SELECT capacity, attendee_count INTO cap, current_count FROM public.events WHERE id = NEW.event_id FOR UPDATE;
    IF cap IS NOT NULL AND current_count >= cap THEN RAISE EXCEPTION 'Event is at capacity'; END IF;
    UPDATE public.events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'going' AND NEW.status <> 'going' THEN
      UPDATE public.events SET attendee_count = GREATEST(attendee_count - 1, 0) WHERE id = NEW.event_id;
    ELSIF OLD.status <> 'going' AND NEW.status = 'going' THEN
      SELECT capacity, attendee_count INTO cap, current_count FROM public.events WHERE id = NEW.event_id FOR UPDATE;
      IF cap IS NOT NULL AND current_count >= cap THEN RAISE EXCEPTION 'Event is at capacity'; END IF;
      UPDATE public.events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'going' THEN
    UPDATE public.events SET attendee_count = GREATEST(attendee_count - 1, 0) WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER event_rsvps_sync_count
AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
FOR EACH ROW EXECUTE FUNCTION public.sync_event_attendee_count();

CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  description TEXT,
  category TEXT,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)),
  address TEXT,
  google_maps_url TEXT,
  image_url TEXT,
  visibility public.entity_visibility NOT NULL DEFAULT 'public',
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name TEXT,
  moderation_status public.moderation_status NOT NULL DEFAULT 'approved',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (google_maps_url IS NOT NULL OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS places_visibility_idx ON public.places (visibility, moderation_status, is_deleted);
CREATE INDEX IF NOT EXISTS places_creator_idx ON public.places (creator_id);

CREATE POLICY "places_select_visible" ON public.places FOR SELECT TO authenticated
USING (
  is_deleted = false AND moderation_status <> 'removed'
  AND (creator_id = auth.uid() OR visibility IN ('public','school_only'))
);
CREATE POLICY "places_insert_own" ON public.places FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));
CREATE POLICY "places_update_own" ON public.places FOR UPDATE TO authenticated
USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "places_delete_own" ON public.places FOR DELETE TO authenticated
USING (creator_id = auth.uid());

CREATE TRIGGER places_set_updated_at BEFORE UPDATE ON public.places
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
