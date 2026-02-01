-- Create school_profiles table for enriched profile data
CREATE TABLE public.school_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  tagline TEXT,
  about_text TEXT,
  website_url TEXT,
  stats JSONB DEFAULT '{}',
  chips TEXT[] DEFAULT '{}',
  founded_year INTEGER,
  enrollment INTEGER,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT school_profiles_school_id_unique UNIQUE (school_id)
);

-- Create indexes
CREATE INDEX idx_school_profiles_school_id ON public.school_profiles(school_id);

-- Enable RLS
ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read school profiles
CREATE POLICY "Anyone can read school profiles"
ON public.school_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anonymous can read school profiles"
ON public.school_profiles
FOR SELECT
TO anon
USING (true);

-- Service role can insert/update profiles (for edge function)
CREATE POLICY "Service can manage profiles"
ON public.school_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_school_profiles_updated_at
BEFORE UPDATE ON public.school_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();