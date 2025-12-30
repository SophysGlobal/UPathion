import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    display_name: null,
    avatar_url: null,
    is_premium: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile({
          display_name: null,
          avatar_url: null,
          is_premium: false,
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, is_premium")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setProfile(data);
        } else {
          setProfile({
            display_name: null,
            avatar_url: null,
            is_premium: false,
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfile({
          display_name: null,
          avatar_url: null,
          is_premium: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};
