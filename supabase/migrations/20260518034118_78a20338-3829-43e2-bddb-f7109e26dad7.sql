
-- 1. Tighten conversation_participants INSERT policy: caller must already be a participant
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants;

CREATE POLICY "Existing participants can add members"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- 2. SECURITY DEFINER RPC to create a direct conversation between two users
CREATE OR REPLACE FUNCTION public.create_direct_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF other_user_id IS NULL OR other_user_id = caller THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  -- Look for an existing 2-person conversation containing both users
  SELECT c.id INTO existing_id
  FROM public.conversations c
  WHERE EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = caller)
    AND EXISTS (SELECT 1 FROM public.conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = other_user_id)
    AND (SELECT count(*) FROM public.conversation_participants p WHERE p.conversation_id = c.id) = 2
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO new_id;
  INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (new_id, caller), (new_id, other_user_id);
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid) TO authenticated;

-- 3. Revoke direct EXECUTE on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_schools(text, text, text, integer) FROM PUBLIC, anon, authenticated;

-- has_role is required by RLS policies; keep EXECUTE for authenticated only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
