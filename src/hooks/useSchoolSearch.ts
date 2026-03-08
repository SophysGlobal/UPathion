import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export interface School {
  id: string;
  name: string;
  country: string;
  state: string | null;
  city: string | null;
  type: "high_school" | "university";
  is_notable: boolean;
  match_rank?: number;
}

interface UseSchoolSearchOptions {
  schoolType?: "high_school" | "university";
  country?: string;
  limit?: number;
  enabled?: boolean;
}

export function useSchoolSearch(options: UseSchoolSearchOptions = {}) {
  const { schoolType, country, limit = 50, enabled = true } = options;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: schools = [], isLoading, error } = useQuery({
    queryKey: ["schools", debouncedQuery, schoolType, country, limit],
    queryFn: async (): Promise<School[]> => {
      // Use RPC for both empty and non-empty queries
      // Empty query returns notable/default schools
      const { data, error } = await supabase.functions.invoke("search-schools", {
        body: {
          searchQuery: debouncedQuery || "",
          schoolType,
          country,
          limit: debouncedQuery ? limit : 20, // fewer defaults when empty
        },
      });

      if (error) throw error;
      return data?.schools || [];
    },
    enabled,
    staleTime: 60000,
  });

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    schools,
    isLoading,
    error,
    clearSearch,
  };
}
