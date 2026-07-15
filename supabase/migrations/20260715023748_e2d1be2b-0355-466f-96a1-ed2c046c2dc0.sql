
-- Add message expiration policy to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS expiration_seconds INTEGER;

-- Add read tracking, expiration, and status to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS messages_expires_at_idx
  ON public.messages (expires_at)
  WHERE expires_at IS NOT NULL;

-- Mark all unread inbound messages as read; compute expires_at if a policy is set
CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
  exp_secs INTEGER;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = caller
  ) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  SELECT expiration_seconds INTO exp_secs
  FROM public.conversations WHERE id = _conversation_id;

  UPDATE public.messages
  SET read_at = now(),
      status = 'read',
      expires_at = CASE
        WHEN exp_secs IS NULL THEN NULL
        ELSE now() + make_interval(secs => exp_secs)
      END
  WHERE conversation_id = _conversation_id
    AND sender_id <> caller
    AND read_at IS NULL;

  UPDATE public.conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = _conversation_id AND user_id = caller;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;

-- Update conversation expiration policy; optionally apply to existing read messages
CREATE OR REPLACE FUNCTION public.set_conversation_expiration(
  _conversation_id UUID,
  _expiration_seconds INTEGER,
  _apply_to_existing BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = caller
  ) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  IF _expiration_seconds IS NOT NULL AND (_expiration_seconds < 60 OR _expiration_seconds > 31536000) THEN
    RAISE EXCEPTION 'Expiration must be between 1 minute and 365 days';
  END IF;

  UPDATE public.conversations
  SET expiration_seconds = _expiration_seconds,
      updated_at = now()
  WHERE id = _conversation_id;

  IF _apply_to_existing THEN
    IF _expiration_seconds IS NULL THEN
      UPDATE public.messages
      SET expires_at = NULL
      WHERE conversation_id = _conversation_id;
    ELSE
      UPDATE public.messages
      SET expires_at = COALESCE(read_at, now()) + make_interval(secs => _expiration_seconds)
      WHERE conversation_id = _conversation_id
        AND read_at IS NOT NULL;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_conversation_expiration(UUID, INTEGER, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_conversation_expiration(UUID, INTEGER, BOOLEAN) TO authenticated;

-- Hard-delete expired messages (safe for anyone to call; only removes already-expired rows)
CREATE OR REPLACE FUNCTION public.purge_expired_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  WITH del AS (
    DELETE FROM public.messages
    WHERE expires_at IS NOT NULL AND expires_at <= now()
    RETURNING 1
  )
  SELECT count(*) INTO n FROM del;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_messages() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_messages() TO authenticated;

-- Enable realtime on messages so UPDATE events (read receipts) also propagate
ALTER TABLE public.messages REPLICA IDENTITY FULL;
