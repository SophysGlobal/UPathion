import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ProfileData {
  id: string;
  display_name: string | null;
  username: string | null;
  school_name: string | null;
  school_type: string | null;
  grade_or_year: string | null;
  major: string | null;
  aspirational_school: string | null;
  is_high_school: boolean;
  onboarding_completed: boolean;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_premium: boolean;
  interests: string[] | null;
  extracurriculars: string[] | null;
}

export const useProfileCompletion = () => {
  const { user } = useAuth();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile-completion', user?.id],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as ProfileData | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const isProfileComplete = !!(
    profile?.display_name &&
    profile?.username &&
    profile?.school_name
  );

  const hasCompletedOnboarding = profile?.onboarding_completed ?? false;

  return {
    profile,
    isLoading,
    isProfileComplete,
    hasCompletedOnboarding,
    refetch,
  };
};
