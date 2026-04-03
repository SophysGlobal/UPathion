// import { useState, useCallback } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { useQuery } from "@tanstack/react-query";
// import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// export interface School {
//   id: string;
//   name: string;
//   country: string;
//   state: string | null;
//   city: string | null;
//   type: "high_school" | "university";
//   is_notable: boolean;
//   match_rank?: number;
// }

// interface UseSchoolSearchOptions {
//   schoolType?: "high_school" | "university";
//   country?: string;
//   limit?: number;
//   enabled?: boolean;
// }

// export function useSchoolSearch(options: UseSchoolSearchOptions = {}) {
//   const { schoolType, country, limit = 50, enabled = true } = options;
//   const [searchQuery, setSearchQuery] = useState("");
//   const debouncedQuery = useDebouncedValue(searchQuery, 300);

//   const { data: schools = [], isLoading, error } = useQuery({
//     queryKey: ["schools", debouncedQuery, schoolType, country, limit],
//     queryFn: async (): Promise<School[]> => {
//       // Use RPC for both empty and non-empty queries
//       // Empty query returns notable/default schools
//       const { data, error } = await supabase.functions.invoke("search-schools", {
//         body: {
//           searchQuery: debouncedQuery || "",
//           schoolType,
//           country,
//           limit: debouncedQuery ? limit : 20, // fewer defaults when empty
//         },
//       });

//       if (error) throw error;
//       return data?.schools || [];
//     },
//     enabled,
//     staleTime: 60000,
//   });

//   const clearSearch = useCallback(() => {
//     setSearchQuery("");
//   }, []);

//   return {
//     searchQuery,
//     setSearchQuery,
//     schools,
//     isLoading,
//     error,
//     clearSearch,
//   };
// }

import { useState } from "react";
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
}

interface UseSchoolSearchOptions {
  schoolType?: "high_school" | "university";
  limit?: number;
  enabled?: boolean;
}

async function fetchUniversities(query: string, limit: number): Promise<School[]> {
  const res = await fetch(
    `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&country=United+States`
  );
  const data = await res.json();
  return data.slice(0, limit).map((u: any, i: number) => ({
    id: `uni-${i}-${u.name}`,
    name: u.name,
    country: "US",
    state: u["state-province"] ?? null,
    city: null,
    type: "university" as const,
    is_notable: true,
  }));
}

async function fetchHighSchools(query: string, limit: number): Promise<School[]> {
  const res = await fetch(
    `https://educationdata.urban.org/api/v1/schools/ccd/directory/2021/?school_name=${encodeURIComponent(query)}&level_of_school=3&per_page=${limit}`
  );
  const data = await res.json();
  return (data.results ?? []).map((s: any) => ({
    id: s.ncessch,
    name: s.school_name,
    country: "US",
    state: s.state_location ?? null,
    city: s.city_location ?? null,
    type: "high_school" as const,
    is_notable: false,
  }));
}

export function useSchoolSearch(options: UseSchoolSearchOptions = {}) {
  const { schoolType, limit = 20, enabled = true } = options;
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const { data: schools = [], isLoading, error } = useQuery({
    queryKey: ["schools", debouncedQuery, schoolType, limit],
    queryFn: async (): Promise<School[]> => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) return [];
      if (schoolType === "university") return fetchUniversities(debouncedQuery, limit);
      if (schoolType === "high_school") return fetchHighSchools(debouncedQuery, limit);
      return [];
    },
    enabled,
    staleTime: 60000,
  });

  return {
    searchQuery,
    setSearchQuery,
    schools,
    isLoading,
    error,
    clearSearch: () => setSearchQuery(""),
  };
}


