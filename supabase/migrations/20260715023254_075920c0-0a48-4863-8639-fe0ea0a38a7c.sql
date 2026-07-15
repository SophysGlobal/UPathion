
-- Enums
CREATE TYPE public.group_visibility AS ENUM ('public','school_only','invite_only');
CREATE TYPE public.group_category AS ENUM (
  'academic','career','social','sports','arts','volunteering',
  'research','gaming','entrepreneurship','other'
);
CREATE TYPE public.group_member_role AS ENUM ('owner','admin','member');
CREATE TYPE public.post_visibility AS ENUM ('public','school_only','connections');
CREATE TYPE public.post_category AS ENUM (
  'general','question','advice','event','opportunity','announcement'
);

-- Groups (no policies yet)
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description text CHECK (description IS NULL OR char_length(description) <= 1000),
  category group_category NOT NULL DEFAULT 'other',
  visibility group_visibility NOT NULL DEFAULT 'school_only',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name text,
  image_url text,
  member_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT ON public.groups TO anon;
GRANT ALL ON public.groups TO service_role;

-- Group members table (no policies yet)
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;

-- Now enable RLS + policies referencing both tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read groups by visibility" ON public.groups
  FOR SELECT USING (
    is_active AND (
      visibility = 'public'
      OR (auth.uid() IS NOT NULL AND visibility = 'school_only')
      OR creator_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.group_members m WHERE m.group_id = id AND m.user_id = auth.uid())
    )
  );

CREATE POLICY "Create groups when not suspended" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));

CREATE POLICY "Creators/admins update group" ON public.groups
  FOR UPDATE TO authenticated
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members m
      WHERE m.group_id = id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Creator deletes group" ON public.groups
  FOR DELETE TO authenticated
  USING (creator_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Members visible" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id
        AND (g.visibility <> 'invite_only'
             OR g.creator_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.group_members m2 WHERE m2.group_id = g.id AND m2.user_id = auth.uid()))
    )
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Join as self" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));

CREATE POLICY "Leave as self" ON public.group_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_groups_active ON public.groups(is_active, created_at DESC);
CREATE INDEX idx_groups_school ON public.groups(school_id) WHERE school_id IS NOT NULL;
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);

CREATE TRIGGER trg_groups_updated
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Member count sync
CREATE OR REPLACE FUNCTION public.sync_group_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_group_members_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_group_member_count();

-- Auto-add creator as owner (do not double-count member_count: default is already 1)
CREATE OR REPLACE FUNCTION public.add_group_creator_as_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Insert owner without triggering member_count sync duplication.
  -- Temporarily reset count to 0 so the AFTER-INSERT trigger brings it back to 1.
  UPDATE public.groups SET member_count = 0 WHERE id = NEW.id;
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_group_creator_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_creator_as_owner();

-- Feed posts
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text CHECK (title IS NULL OR char_length(title) <= 140),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  visibility post_visibility NOT NULL DEFAULT 'school_only',
  category post_category NOT NULL DEFAULT 'general',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_posts TO authenticated;
GRANT SELECT ON public.feed_posts TO anon;
GRANT ALL ON public.feed_posts TO service_role;

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read feed posts by visibility" ON public.feed_posts
  FOR SELECT USING (
    NOT is_deleted AND (
      visibility = 'public'
      OR (auth.uid() IS NOT NULL AND visibility = 'school_only')
      OR (auth.uid() IS NOT NULL AND visibility = 'connections')
      OR author_id = auth.uid()
    )
  );

CREATE POLICY "Create feed posts when not suspended" ON public.feed_posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND NOT public.is_user_suspended(auth.uid()));

CREATE POLICY "Author updates own post" ON public.feed_posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Author deletes own post" ON public.feed_posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_feed_posts_recent ON public.feed_posts(created_at DESC) WHERE NOT is_deleted;
CREATE INDEX idx_feed_posts_author ON public.feed_posts(author_id, created_at DESC);
CREATE INDEX idx_feed_posts_group ON public.feed_posts(group_id, created_at DESC) WHERE group_id IS NOT NULL;

CREATE TRIGGER trg_feed_posts_updated
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
