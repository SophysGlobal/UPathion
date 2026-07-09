import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type VerificationStatus = "unverified" | "pending" | "verified" | "failed";

export const useVerificationStatus = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["verification-status", user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("verification_status, verified_at, verified_email, school_type")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return {
        status: (data?.verification_status || "unverified") as VerificationStatus,
        verifiedAt: data?.verified_at as string | null,
        verifiedEmail: data?.verified_email as string | null,
        schoolType: data?.school_type as string | null,
      };
    },
  });

  return {
    status: query.data?.status ?? ("unverified" as VerificationStatus),
    verifiedAt: query.data?.verifiedAt ?? null,
    verifiedEmail: query.data?.verifiedEmail ?? null,
    schoolType: query.data?.schoolType ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
};