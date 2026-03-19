import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
}

const defaultProfile: UserProfile = {
  display_name: null,
  avatar_url: null,
  is_premium: false,
};

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async (): Promise<UserProfile> => {
      if (!user?.id) return defaultProfile;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_premium")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return defaultProfile;
      }

      return data ?? defaultProfile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in garbage collection for 10 minutes
  });

  return { profile: profile ?? defaultProfile, loading };
};
