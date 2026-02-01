import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchQuery, schoolType, country, limit = 50 } = await req.json();
    
    console.log('Search request:', { searchQuery, schoolType, country, limit });

    // Validate input
    if (searchQuery && typeof searchQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid search query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (schoolType && !['high_school', 'university'].includes(schoolType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid school type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the database function for ranked search
    const { data, error } = await supabase.rpc('search_schools', {
      search_query: searchQuery?.trim() || '',
      school_type: schoolType || null,
      country_filter: country || null,
      result_limit: Math.min(limit, 100),
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} schools`);

    return new Response(
      JSON.stringify({ schools: data || [] }),
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
