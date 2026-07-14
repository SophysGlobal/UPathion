import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Returns the set of user IDs the current user has blocked, plus a helper
 * to check any candidate ID.
 */
export const useBlockedUsers = () => {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["user-blocks", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.blocked_id as string));
    },
  });

  const blocked = q.data ?? new Set<string>();
  return {
    blockedIds: blocked,
    isBlocked: (id?: string | null) => !!id && blocked.has(id),
    refetch: q.refetch,
    loading: q.isLoading,
  };
};

export const useMutedUsers = () => {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["user-mutes", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_mutes")
        .select("muted_id")
        .eq("muter_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.muted_id as string));
    },
  });

  const muted = q.data ?? new Set<string>();
  return {
    mutedIds: muted,
    isMuted: (id?: string | null) => !!id && muted.has(id),
    refetch: q.refetch,
  };
};