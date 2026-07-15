
CREATE TYPE public.moderation_action_type AS ENUM (
  'dismiss','warn','suspend','ban','unban','unsuspend','escalate','note'
);

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  moderator_id uuid NOT NULL,
  target_user_id uuid,
  action moderation_action_type NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.moderation_actions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit log" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND moderator_id = auth.uid());
CREATE POLICY "No one updates audit" ON public.moderation_actions
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No one deletes audit" ON public.moderation_actions
  FOR DELETE TO authenticated USING (false);

CREATE INDEX idx_mod_actions_target ON public.moderation_actions(target_user_id, created_at DESC);
CREATE INDEX idx_mod_actions_report ON public.moderation_actions(report_id);

CREATE TABLE public.user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  moderator_id uuid NOT NULL,
  reason text NOT NULL,
  is_permanent boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  lifted_at timestamptz,
  lifted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_suspensions TO authenticated;
GRANT ALL ON public.user_suspensions TO service_role;

ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own suspensions" ON public.user_suspensions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert suspensions" ON public.user_suspensions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update suspensions" ON public.user_suspensions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_suspensions_user_active ON public.user_suspensions(user_id) WHERE lifted_at IS NULL;

CREATE TRIGGER trg_suspensions_updated
  BEFORE UPDATE ON public.user_suspensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_user_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_suspensions
    WHERE user_id = _user_id
      AND lifted_at IS NULL
      AND (is_permanent = true OR (expires_at IS NOT NULL AND expires_at > now()))
  );
$$;
