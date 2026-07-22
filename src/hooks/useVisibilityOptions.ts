import { useMemo } from 'react';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';

/**
 * Hides the "school_only" option from users who are not actively
 * verified as students at their school. The server-side RLS also
 * enforces this — this hook is UX polish so unverified users don't
 * see options that would be rejected.
 */
export function useCanUseSchoolOnly(): { canUseSchoolOnly: boolean; loading: boolean } {
  const { status, loading } = useVerificationStatus();
  return { canUseSchoolOnly: status === 'verified', loading };
}

export function useFilteredVisibility<
  T extends { value: string }
>(options: readonly T[]): T[] {
  const { canUseSchoolOnly } = useCanUseSchoolOnly();
  return useMemo(
    () => (canUseSchoolOnly ? [...options] : options.filter((o) => o.value !== 'school_only')),
    [canUseSchoolOnly, options],
  );
}