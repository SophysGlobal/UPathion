
-- Trigger-only helpers: no direct client callers
REVOKE EXECUTE ON FUNCTION public.sync_comment_like_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_group_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_group_creator_as_owner() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Auth helpers used by RLS: only authenticated users need EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_user_suspended(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO authenticated;

-- Authenticated-only RPC
REVOKE EXECUTE ON FUNCTION public.create_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid) TO authenticated;

-- School search: callable by both anon (pre-auth onboarding) and authenticated
REVOKE EXECUTE ON FUNCTION public.search_schools(text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_schools(text, text, text, integer) TO anon, authenticated;
