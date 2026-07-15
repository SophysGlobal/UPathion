import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface SuspensionRecord {
  id: string;
  reason: string;
  is_permanent: boolean;
  expires_at: string | null;
  lifted_at: string | null;
  created_at: string;
}

export const useSuspensionStatus = () => {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suspension-status', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<SuspensionRecord | null> => {
      const { data, error } = await (supabase as any)
        .from('user_suspensions')
        .select('id, reason, is_permanent, expires_at, lifted_at, created_at')
        .eq('user_id', user!.id)
        .is('lifted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('[useSuspensionStatus]', error);
        return null;
      }
      if (!data) return null;
      // Active if permanent OR expires_at in the future
      const active =
        data.is_permanent ||
        (data.expires_at && new Date(data.expires_at).getTime() > Date.now());
      return active ? (data as SuspensionRecord) : null;
    },
  });

  return {
    suspension: data ?? null,
    isSuspended: !!data,
    loading: isLoading,
    refetch,
  };
};