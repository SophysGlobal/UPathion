-- Enforce case-insensitive uniqueness for usernames at the DB level.
-- This guarantees no duplicates can be created even if the client-side
-- availability check is bypassed or races with another signup.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;