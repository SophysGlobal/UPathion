-- Drop the overly permissive public SELECT policy
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Create a restricted policy: users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);