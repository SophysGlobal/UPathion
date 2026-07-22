
-- Revoke EXECUTE on internal trigger/utility SECURITY DEFINER functions.
-- These are called by triggers or by service_role only; authenticated users
-- should not be able to invoke them via PostgREST.

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.sync_comment_like_count()',
    'public.update_updated_at_column()',
    'public.handle_new_user()',
    'public.update_conversation_on_message()',
    'public.sync_group_member_count()',
    'public.add_group_creator_as_owner()',
    'public.bump_ai_conversation_on_message()',
    'public.sync_event_attendee_count()',
    'public.prevent_profile_sensitive_updates()',
    'public.enforce_block_rules()',
    'public.enforce_mute_rules()',
    'public.enforce_report_rules()',
    'public.purge_expired_messages()',
    'public.purge_old_rate_limits()',
    'public.enforce_user_rate_limit(uuid, text, integer, integer)',
    'public.rate_limit_check(uuid, text, integer, integer)',
    'public.academic_year_expiry(timestamptz)',
    'public.search_schools(text, text, text, integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skipping missing function: %', fn;
    END;
  END LOOP;
END $$;

-- Keep these callable by authenticated users (RPC endpoints + RLS helpers):
--   has_role, is_user_suspended, is_active_verified_student, verified_school_id_of
--   create_direct_conversation, mark_conversation_read, set_conversation_expiration
-- but ensure anon cannot call them.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.has_role(uuid, app_role)',
    'public.is_user_suspended(uuid)',
    'public.is_active_verified_student(uuid)',
    'public.verified_school_id_of(uuid)',
    'public.create_direct_conversation(uuid)',
    'public.mark_conversation_read(uuid)',
    'public.set_conversation_expiration(uuid, integer, boolean)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skipping missing function: %', fn;
    END;
  END LOOP;
END $$;
