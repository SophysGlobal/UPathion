
-- Report target types
CREATE TYPE public.report_target_type AS ENUM (
  'post', 'thread', 'comment', 'message', 'group_message',
  'image', 'profile', 'group', 'conversation'
);

CREATE TYPE public.report_reason AS ENUM (
  'harassment', 'bullying', 'hate_speech', 'spam', 'impersonation',
  'threats', 'sexual_content', 'violence', 'illegal_activity',
  'self_harm', 'scam_fraud', 'misinformation', 'other'
);

CREATE TYPE public.report_status AS ENUM (
  'pending', 'under_review', 'action_taken', 'dismissed'
);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_id TEXT NOT NULL,
  target_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason public.report_reason NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'pending',
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status, created_at DESC);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON public.user_blocks(blocked_id);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create own blocks" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Mutes table
CREATE TABLE public.user_mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  muter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (muter_id, muted_id),
  CHECK (muter_id <> muted_id)
);

CREATE INDEX idx_user_mutes_muter ON public.user_mutes(muter_id);

GRANT SELECT, INSERT, DELETE ON public.user_mutes TO authenticated;
GRANT ALL ON public.user_mutes TO service_role;

ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mutes" ON public.user_mutes
  FOR SELECT TO authenticated
  USING (auth.uid() = muter_id);

CREATE POLICY "Users can create own mutes" ON public.user_mutes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = muter_id);

CREATE POLICY "Users can delete own mutes" ON public.user_mutes
  FOR DELETE TO authenticated
  USING (auth.uid() = muter_id);

-- Guidelines acceptance timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guidelines_accepted_at TIMESTAMPTZ;
