-- Add is_premium and subscription fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN subscription_ends_at timestamptz NULL;

-- Update RLS policy to allow users to view is_premium status of others
-- (The existing "Profiles are viewable by everyone" policy already covers this)