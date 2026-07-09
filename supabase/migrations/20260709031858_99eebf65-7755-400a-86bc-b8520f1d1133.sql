
-- =========================
-- 1. COMMENTS
-- =========================
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id text NOT NULL,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX post_comments_post_id_idx ON public.post_comments(post_id, created_at);
CREATE INDEX post_comments_parent_id_idx ON public.post_comments(parent_id);
CREATE INDEX post_comments_user_id_idx ON public.post_comments(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON public.post_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- Comment likes
CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

CREATE INDEX comment_likes_comment_id_idx ON public.comment_likes(comment_id);
CREATE INDEX comment_likes_user_id_idx ON public.comment_likes(user_id);

GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read likes"
  ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like as themselves"
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;

-- Maintain like_count via trigger
CREATE OR REPLACE FUNCTION public.sync_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comment_likes_ai
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_like_count();
CREATE TRIGGER trg_comment_likes_ad
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_like_count();

-- =========================
-- 2. PROFILE EDUCATION + VERIFICATION FIELDS
-- =========================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS degree text,
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS student_level text
    CHECK (student_level IN ('undergrad','grad','alumni')),
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','failed')),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_email text,
  ADD COLUMN IF NOT EXISTS verified_school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- =========================
-- 3. SCHOOL DOMAINS
-- =========================
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS domains text[] DEFAULT '{}'::text[];

-- =========================
-- 4. VERIFICATION CODES
-- =========================
CREATE TABLE public.student_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_verification_codes_user_id_idx ON public.student_verification_codes(user_id, created_at DESC);

GRANT SELECT ON public.student_verification_codes TO authenticated;
GRANT ALL ON public.student_verification_codes TO service_role;

ALTER TABLE public.student_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification codes"
  ON public.student_verification_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
