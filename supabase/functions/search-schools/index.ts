import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery, schoolType, limit = 20 } = await req.json();

    if (!searchQuery || searchQuery.trim().length < 2) {
      return new Response(
        JSON.stringify({ schools: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const query = searchQuery.trim();
    let schools = [];

    if (schoolType === "university") {
      // --- Hipolabs: free, no key ---
      const res = await fetch(
        `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&country=United+States`
      );
      const data = await res.json();
      schools = data.slice(0, limit).map((u: any, i: number) => ({
        id: `uni-${i}-${u.name}`,
        name: u.name,
        country: "US",
        state: u["state-province"] ?? null,
        city: null,
        type: "university",
        is_notable: true,
      }));

    } else if (schoolType === "high_school") {
      // --- Urban Institute / NCES: free, no key ---
      const res = await fetch(
        `https://educationdata.urban.org/api/v1/schools/ccd/directory/2021/?school_name=${encodeURIComponent(query)}&level_of_school=3&per_page=${limit}`
      );
      const data = await res.json();
      schools = (data.results ?? []).map((s: any) => ({
        id: s.ncessch,
        name: s.school_name,
        country: "US",
        state: s.state_location ?? null,
        city: s.city_location ?? null,
        type: "high_school",
        is_notable: false,
      }));
    }

    console.log(`Found ${schools.length} schools for query "${query}" (type: ${schoolType})`);

    return new Response(
      JSON.stringify({ schools }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error searching schools:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
