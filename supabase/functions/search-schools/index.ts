import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Use the database RPC function for ranked search
    const { data, error } = await supabase.rpc('search_schools', {
      search_query: query,
      school_type: schoolType || null,
      result_limit: limit,
    });

    if (error) throw error;

    const schools = (data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      country: s.country,
      state: s.state,
      city: s.city,
      type: s.type,
      is_notable: s.is_notable,
      match_rank: s.match_rank,
    }));

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
