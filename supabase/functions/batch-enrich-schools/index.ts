import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper to verify admin authorization
async function verifyAdminAuth(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Missing or invalid authorization header', status: 401 };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return { error: 'Unauthorized: Invalid token', status: 401 };
  }

  const userId = data.claims.sub as string;
  
  // Check if user has admin role
  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', { 
    _user_id: userId, 
    _role: 'admin' 
  });

  if (roleError || !isAdmin) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { userId };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authResult = await verifyAdminAuth(req);
    if ('error' in authResult) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: authResult.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${authResult.userId} triggered batch enrichment`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request options
    const { 
      batchSize = 10, 
      schoolType = 'university', 
      country = 'US',
      forceRefresh = false,
      onlyPending = true,
    } = await req.json().catch(() => ({}));

    console.log(`Starting batch enrichment: type=${schoolType}, country=${country}, batchSize=${batchSize}`);

    // Find schools that need enrichment
    let query = supabase
      .from('schools')
      .select('id, name, type, city, state, country')
      .eq('type', schoolType)
      .eq('country', country)
      .limit(batchSize);

    // Get the list of schools
    const { data: schools, error: schoolsError } = await query;

    if (schoolsError) {
      throw schoolsError;
    }

    if (!schools || schools.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No schools found matching criteria', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${schools.length} schools to process`);

    // If onlyPending, filter to schools without enriched profiles
    let schoolsToProcess = schools;
    
    if (onlyPending && !forceRefresh) {
      const schoolIds = schools.map(s => s.id);
      const { data: existingProfiles } = await supabase
        .from('school_profiles')
        .select('school_id, enrichment_status')
        .in('school_id', schoolIds)
        .eq('enrichment_status', 'enriched');
      
      const enrichedIds = new Set(existingProfiles?.map(p => p.school_id) || []);
      schoolsToProcess = schools.filter(s => !enrichedIds.has(s.id));
      
      console.log(`After filtering: ${schoolsToProcess.length} schools need enrichment`);
    }

    if (schoolsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All schools already enriched', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each school - call enrich-school-profile for each
    const enrichmentUrl = `${supabaseUrl}/functions/v1/enrich-school-profile`;
    const results: { schoolId: string; name: string; success: boolean; error?: string }[] = [];

    // Process in parallel with concurrency limit
    const concurrencyLimit = 3;
    for (let i = 0; i < schoolsToProcess.length; i += concurrencyLimit) {
      const batch = schoolsToProcess.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (school) => {
        try {
          console.log(`Enriching: ${school.name} (${school.id})`);
          
          const response = await fetch(enrichmentUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ 
              schoolId: school.id, 
              forceRefresh 
            }),
          });

          const data = await response.json();
          
          if (!response.ok || data.error) {
            console.error(`Failed to enrich ${school.name}:`, data.error);
            return { 
              schoolId: school.id, 
              name: school.name, 
              success: false, 
              error: data.error || 'Unknown error' 
            };
          }

          console.log(`Successfully enriched: ${school.name}`);
          return { 
            schoolId: school.id, 
            name: school.name, 
            success: true 
          };
        } catch (err) {
          console.error(`Error enriching ${school.name}:`, err);
          return { 
            schoolId: school.id, 
            name: school.name, 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches to avoid rate limiting
      if (i + concurrencyLimit < schoolsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Batch enrichment complete: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: 'Batch enrichment complete',
        processed: results.length,
        successful,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
