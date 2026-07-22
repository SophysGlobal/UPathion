import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from './useDebouncedValue';

export type SearchHitType = 'person' | 'school' | 'post' | 'group' | 'event' | 'place' | 'hashtag';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string | null;
  meta?: Record<string, any>;
  score: number;
}

export interface SearchSuggestion {
  type: SearchHitType;
  id: string;
  label: string;
}

export interface GlobalSearchResult {
  hits: SearchHit[];
  grouped: Partial<Record<SearchHitType, SearchHit[]>>;
  suggestions: SearchSuggestion[];
}

export function useGlobalSearch(query: string, opts?: { userSchoolName?: string | null; enabled?: boolean }) {
  const debounced = useDebouncedValue(query.trim(), 250);
  const enabled = (opts?.enabled ?? true) && debounced.length >= 1;

  return useQuery({
    queryKey: ['global-search', debounced, opts?.userSchoolName ?? null],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<GlobalSearchResult> => {
      const { data, error } = await supabase.functions.invoke('global-search', {
        body: { q: debounced, userSchoolName: opts?.userSchoolName ?? null, limit: 6 },
      });
      if (error) throw error;
      return {
        hits: data?.hits ?? [],
        grouped: data?.grouped ?? {},
        suggestions: data?.suggestions ?? [],
      };
    },
  });
}