
DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.post_comments;
CREATE POLICY "Read comments when post visible"
ON public.post_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.feed_posts fp
    WHERE fp.id::text = post_comments.post_id
      AND NOT fp.is_deleted
      AND (
        fp.visibility = 'public'::post_visibility
        OR fp.visibility = 'school_only'::post_visibility
        OR fp.visibility = 'connections'::post_visibility
        OR fp.author_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Authenticated users can read likes" ON public.comment_likes;
CREATE POLICY "Read comment likes when post visible"
ON public.comment_likes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.post_comments pc
    JOIN public.feed_posts fp ON fp.id::text = pc.post_id
    WHERE pc.id = comment_likes.comment_id
      AND NOT fp.is_deleted
      AND (
        fp.visibility = 'public'::post_visibility
        OR fp.visibility = 'school_only'::post_visibility
        OR fp.visibility = 'connections'::post_visibility
        OR fp.author_id = auth.uid()
      )
  )
);

REVOKE EXECUTE ON FUNCTION public.purge_expired_messages() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_event_attendee_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_conversation_expiration(uuid, integer, boolean) FROM PUBLIC, anon;
