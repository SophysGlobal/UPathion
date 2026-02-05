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

// Sample data - This would typically come from a comprehensive dataset
// In production, you'd import from a complete US schools database

// Notable Universities (US and International)
const NOTABLE_UNIVERSITIES = [
  // Ivy League
  { name: "Harvard University", state: "MA", city: "Cambridge", country: "US", is_notable: true },
  { name: "Yale University", state: "CT", city: "New Haven", country: "US", is_notable: true },
  { name: "Princeton University", state: "NJ", city: "Princeton", country: "US", is_notable: true },
  { name: "Columbia University", state: "NY", city: "New York", country: "US", is_notable: true },
  { name: "University of Pennsylvania", state: "PA", city: "Philadelphia", country: "US", is_notable: true },
  { name: "Brown University", state: "RI", city: "Providence", country: "US", is_notable: true },
  { name: "Dartmouth College", state: "NH", city: "Hanover", country: "US", is_notable: true },
  { name: "Cornell University", state: "NY", city: "Ithaca", country: "US", is_notable: true },
  
  // Top Private Universities
  { name: "Stanford University", state: "CA", city: "Stanford", country: "US", is_notable: true },
  { name: "Massachusetts Institute of Technology", state: "MA", city: "Cambridge", country: "US", is_notable: true },
  { name: "California Institute of Technology", state: "CA", city: "Pasadena", country: "US", is_notable: true },
  { name: "Duke University", state: "NC", city: "Durham", country: "US", is_notable: true },
  { name: "Northwestern University", state: "IL", city: "Evanston", country: "US", is_notable: true },
  { name: "University of Chicago", state: "IL", city: "Chicago", country: "US", is_notable: true },
  { name: "Johns Hopkins University", state: "MD", city: "Baltimore", country: "US", is_notable: true },
  { name: "Rice University", state: "TX", city: "Houston", country: "US", is_notable: true },
  { name: "Vanderbilt University", state: "TN", city: "Nashville", country: "US", is_notable: true },
  { name: "Washington University in St. Louis", state: "MO", city: "St. Louis", country: "US", is_notable: true },
  { name: "Emory University", state: "GA", city: "Atlanta", country: "US", is_notable: true },
  { name: "Georgetown University", state: "DC", city: "Washington", country: "US", is_notable: true },
  { name: "University of Notre Dame", state: "IN", city: "Notre Dame", country: "US", is_notable: true },
  { name: "Carnegie Mellon University", state: "PA", city: "Pittsburgh", country: "US", is_notable: true },
  { name: "New York University", state: "NY", city: "New York", country: "US", is_notable: true },
  { name: "Boston University", state: "MA", city: "Boston", country: "US", is_notable: true },
  { name: "Boston College", state: "MA", city: "Chestnut Hill", country: "US", is_notable: true },
  { name: "University of Southern California", state: "CA", city: "Los Angeles", country: "US", is_notable: true },
  { name: "Tufts University", state: "MA", city: "Medford", country: "US", is_notable: true },
  { name: "Wake Forest University", state: "NC", city: "Winston-Salem", country: "US", is_notable: true },
  { name: "Tulane University", state: "LA", city: "New Orleans", country: "US", is_notable: true },
  { name: "University of Miami", state: "FL", city: "Coral Gables", country: "US", is_notable: true },
  { name: "Northeastern University", state: "MA", city: "Boston", country: "US", is_notable: true },
  
  // Top Public Universities
  { name: "University of California, Berkeley", state: "CA", city: "Berkeley", country: "US", is_notable: true },
  { name: "University of California, Los Angeles", state: "CA", city: "Los Angeles", country: "US", is_notable: true },
  { name: "University of Michigan", state: "MI", city: "Ann Arbor", country: "US", is_notable: true },
  { name: "University of Virginia", state: "VA", city: "Charlottesville", country: "US", is_notable: true },
  { name: "University of North Carolina at Chapel Hill", state: "NC", city: "Chapel Hill", country: "US", is_notable: true },
  { name: "Georgia Institute of Technology", state: "GA", city: "Atlanta", country: "US", is_notable: true },
  { name: "University of Texas at Austin", state: "TX", city: "Austin", country: "US", is_notable: true },
  { name: "University of Florida", state: "FL", city: "Gainesville", country: "US", is_notable: true },
  { name: "University of Wisconsin-Madison", state: "WI", city: "Madison", country: "US", is_notable: true },
  { name: "Ohio State University", state: "OH", city: "Columbus", country: "US", is_notable: true },
  { name: "Penn State University", state: "PA", city: "University Park", country: "US", is_notable: true },
  { name: "Purdue University", state: "IN", city: "West Lafayette", country: "US", is_notable: true },
  { name: "University of Illinois Urbana-Champaign", state: "IL", city: "Champaign", country: "US", is_notable: true },
  { name: "University of Washington", state: "WA", city: "Seattle", country: "US", is_notable: true },
  { name: "University of Minnesota", state: "MN", city: "Minneapolis", country: "US", is_notable: true },
  { name: "Indiana University Bloomington", state: "IN", city: "Bloomington", country: "US", is_notable: true },
  { name: "University of Maryland", state: "MD", city: "College Park", country: "US", is_notable: true },
  { name: "Rutgers University", state: "NJ", city: "New Brunswick", country: "US", is_notable: true },
  { name: "Texas A&M University", state: "TX", city: "College Station", country: "US", is_notable: true },
  { name: "University of Massachusetts Amherst", state: "MA", city: "Amherst", country: "US", is_notable: true },
  { name: "University of Colorado Boulder", state: "CO", city: "Boulder", country: "US", is_notable: true },
  { name: "University of Arizona", state: "AZ", city: "Tucson", country: "US", is_notable: true },
  { name: "Arizona State University", state: "AZ", city: "Tempe", country: "US", is_notable: true },
  { name: "Florida State University", state: "FL", city: "Tallahassee", country: "US", is_notable: true },
  { name: "University of Georgia", state: "GA", city: "Athens", country: "US", is_notable: true },
  { name: "Michigan State University", state: "MI", city: "East Lansing", country: "US", is_notable: true },
  { name: "Syracuse University", state: "NY", city: "Syracuse", country: "US", is_notable: false },
  
  // UC System
  { name: "University of California, San Diego", state: "CA", city: "La Jolla", country: "US", is_notable: true },
  { name: "University of California, Davis", state: "CA", city: "Davis", country: "US", is_notable: true },
  { name: "University of California, Irvine", state: "CA", city: "Irvine", country: "US", is_notable: true },
  { name: "University of California, Santa Barbara", state: "CA", city: "Santa Barbara", country: "US", is_notable: true },
  { name: "University of California, Santa Cruz", state: "CA", city: "Santa Cruz", country: "US", is_notable: false },
  { name: "University of California, Riverside", state: "CA", city: "Riverside", country: "US", is_notable: false },
  { name: "University of California, Merced", state: "CA", city: "Merced", country: "US", is_notable: false },
  
  // CSU System (Sample)
  { name: "California State University, Long Beach", state: "CA", city: "Long Beach", country: "US", is_notable: false },
  { name: "San Diego State University", state: "CA", city: "San Diego", country: "US", is_notable: false },
  { name: "California State University, Fullerton", state: "CA", city: "Fullerton", country: "US", is_notable: false },
  { name: "San Jose State University", state: "CA", city: "San Jose", country: "US", is_notable: false },
  
  // SUNY System (Sample)
  { name: "Stony Brook University", state: "NY", city: "Stony Brook", country: "US", is_notable: false },
  { name: "University at Buffalo", state: "NY", city: "Buffalo", country: "US", is_notable: false },
  { name: "Binghamton University", state: "NY", city: "Binghamton", country: "US", is_notable: false },
  { name: "University at Albany", state: "NY", city: "Albany", country: "US", is_notable: false },
  
  // International Notable Universities
  { name: "University of Oxford", state: null, city: "Oxford", country: "UK", is_notable: true },
  { name: "University of Cambridge", state: null, city: "Cambridge", country: "UK", is_notable: true },
  { name: "Imperial College London", state: null, city: "London", country: "UK", is_notable: true },
  { name: "London School of Economics", state: null, city: "London", country: "UK", is_notable: true },
  { name: "University College London", state: null, city: "London", country: "UK", is_notable: true },
  { name: "University of Edinburgh", state: null, city: "Edinburgh", country: "UK", is_notable: true },
  { name: "University of Toronto", state: null, city: "Toronto", country: "CA", is_notable: true },
  { name: "McGill University", state: null, city: "Montreal", country: "CA", is_notable: true },
  { name: "University of British Columbia", state: null, city: "Vancouver", country: "CA", is_notable: true },
  { name: "ETH Zurich", state: null, city: "Zurich", country: "CH", is_notable: true },
  { name: "National University of Singapore", state: null, city: "Singapore", country: "SG", is_notable: true },
  { name: "University of Tokyo", state: null, city: "Tokyo", country: "JP", is_notable: true },
  { name: "Peking University", state: null, city: "Beijing", country: "CN", is_notable: true },
  { name: "Tsinghua University", state: null, city: "Beijing", country: "CN", is_notable: true },
  { name: "University of Melbourne", state: null, city: "Melbourne", country: "AU", is_notable: true },
  { name: "University of Sydney", state: null, city: "Sydney", country: "AU", is_notable: true },
  { name: "Sorbonne University", state: null, city: "Paris", country: "FR", is_notable: true },
  { name: "Technical University of Munich", state: null, city: "Munich", country: "DE", is_notable: true },
  { name: "University of Hong Kong", state: null, city: "Hong Kong", country: "HK", is_notable: true },
  { name: "Seoul National University", state: null, city: "Seoul", country: "KR", is_notable: true },
];

// Sample High Schools (would need comprehensive dataset in production)
const SAMPLE_HIGH_SCHOOLS = [
  // California
  { name: "Lowell High School", state: "CA", city: "San Francisco", country: "US" },
  { name: "Palo Alto High School", state: "CA", city: "Palo Alto", country: "US" },
  { name: "Gunn High School", state: "CA", city: "Palo Alto", country: "US" },
  { name: "Mission San Jose High School", state: "CA", city: "Fremont", country: "US" },
  { name: "Lynbrook High School", state: "CA", city: "San Jose", country: "US" },
  { name: "Monta Vista High School", state: "CA", city: "Cupertino", country: "US" },
  { name: "Beverly Hills High School", state: "CA", city: "Beverly Hills", country: "US" },
  { name: "Santa Monica High School", state: "CA", city: "Santa Monica", country: "US" },
  { name: "Los Angeles High School", state: "CA", city: "Los Angeles", country: "US" },
  { name: "San Francisco University High School", state: "CA", city: "San Francisco", country: "US" },
  { name: "The Harker School", state: "CA", city: "San Jose", country: "US" },
  { name: "Menlo School", state: "CA", city: "Atherton", country: "US" },
  { name: "Crystal Springs Uplands School", state: "CA", city: "Hillsborough", country: "US" },
  
  // New York
  { name: "Stuyvesant High School", state: "NY", city: "New York", country: "US" },
  { name: "Bronx High School of Science", state: "NY", city: "Bronx", country: "US" },
  { name: "Brooklyn Technical High School", state: "NY", city: "Brooklyn", country: "US" },
  { name: "Townsend Harris High School", state: "NY", city: "Flushing", country: "US" },
  { name: "High School for American Studies", state: "NY", city: "Bronx", country: "US" },
  { name: "Horace Mann School", state: "NY", city: "Bronx", country: "US" },
  { name: "Trinity School", state: "NY", city: "New York", country: "US" },
  { name: "Dalton School", state: "NY", city: "New York", country: "US" },
  { name: "Collegiate School", state: "NY", city: "New York", country: "US" },
  { name: "Regis High School", state: "NY", city: "New York", country: "US" },
  
  // Texas
  { name: "Highland Park High School", state: "TX", city: "Dallas", country: "US" },
  { name: "Westlake High School", state: "TX", city: "Austin", country: "US" },
  { name: "Plano Senior High School", state: "TX", city: "Plano", country: "US" },
  { name: "The Kinkaid School", state: "TX", city: "Houston", country: "US" },
  { name: "St. Mark's School of Texas", state: "TX", city: "Dallas", country: "US" },
  { name: "Carnegie Vanguard High School", state: "TX", city: "Houston", country: "US" },
  { name: "Liberal Arts and Science Academy", state: "TX", city: "Austin", country: "US" },
  
  // Massachusetts
  { name: "Boston Latin School", state: "MA", city: "Boston", country: "US" },
  { name: "Lexington High School", state: "MA", city: "Lexington", country: "US" },
  { name: "Newton North High School", state: "MA", city: "Newton", country: "US" },
  { name: "Phillips Academy Andover", state: "MA", city: "Andover", country: "US" },
  { name: "Roxbury Latin School", state: "MA", city: "West Roxbury", country: "US" },
  { name: "Belmont Hill School", state: "MA", city: "Belmont", country: "US" },
  { name: "Milton Academy", state: "MA", city: "Milton", country: "US" },
  
  // New Jersey
  { name: "High Technology High School", state: "NJ", city: "Lincroft", country: "US" },
  { name: "Bergen County Academies", state: "NJ", city: "Hackensack", country: "US" },
  { name: "Princeton High School", state: "NJ", city: "Princeton", country: "US" },
  { name: "Millburn High School", state: "NJ", city: "Millburn", country: "US" },
  { name: "West Windsor-Plainsboro High School North", state: "NJ", city: "Plainsboro", country: "US" },
  { name: "Lawrenceville School", state: "NJ", city: "Lawrenceville", country: "US" },
  { name: "Blair Academy", state: "NJ", city: "Blairstown", country: "US" },
  
  // Illinois
  { name: "New Trier High School", state: "IL", city: "Winnetka", country: "US" },
  { name: "Northside College Preparatory High School", state: "IL", city: "Chicago", country: "US" },
  { name: "Walter Payton College Preparatory", state: "IL", city: "Chicago", country: "US" },
  { name: "Whitney M. Young Magnet High School", state: "IL", city: "Chicago", country: "US" },
  { name: "Glenbrook North High School", state: "IL", city: "Northbrook", country: "US" },
  { name: "Lake Forest High School", state: "IL", city: "Lake Forest", country: "US" },
  { name: "Latin School of Chicago", state: "IL", city: "Chicago", country: "US" },
  
  // Connecticut
  { name: "Greenwich High School", state: "CT", city: "Greenwich", country: "US" },
  { name: "Darien High School", state: "CT", city: "Darien", country: "US" },
  { name: "Staples High School", state: "CT", city: "Westport", country: "US" },
  { name: "Hopkins School", state: "CT", city: "New Haven", country: "US" },
  { name: "Choate Rosemary Hall", state: "CT", city: "Wallingford", country: "US" },
  { name: "Hotchkiss School", state: "CT", city: "Lakeville", country: "US" },
  
  // Pennsylvania
  { name: "Central High School", state: "PA", city: "Philadelphia", country: "US" },
  { name: "Masterman High School", state: "PA", city: "Philadelphia", country: "US" },
  { name: "Upper St. Clair High School", state: "PA", city: "Pittsburgh", country: "US" },
  { name: "North Allegheny Senior High School", state: "PA", city: "Pittsburgh", country: "US" },
  { name: "Germantown Friends School", state: "PA", city: "Philadelphia", country: "US" },
  { name: "The Haverford School", state: "PA", city: "Haverford", country: "US" },
  
  // Virginia
  { name: "Thomas Jefferson High School for Science and Technology", state: "VA", city: "Alexandria", country: "US" },
  { name: "Maggie L. Walker Governor's School", state: "VA", city: "Richmond", country: "US" },
  { name: "McLean High School", state: "VA", city: "McLean", country: "US" },
  { name: "Langley High School", state: "VA", city: "McLean", country: "US" },
  
  // Maryland
  { name: "Montgomery Blair High School", state: "MD", city: "Silver Spring", country: "US" },
  { name: "Walt Whitman High School", state: "MD", city: "Bethesda", country: "US" },
  { name: "Poolesville High School", state: "MD", city: "Poolesville", country: "US" },
  { name: "Richard Montgomery High School", state: "MD", city: "Rockville", country: "US" },
  
  // Florida
  { name: "Pine View School", state: "FL", city: "Osprey", country: "US" },
  { name: "Stanton College Preparatory School", state: "FL", city: "Jacksonville", country: "US" },
  { name: "Miami Palmetto Senior High School", state: "FL", city: "Pinecrest", country: "US" },
  { name: "International Baccalaureate School at Bartow", state: "FL", city: "Bartow", country: "US" },
  
  // Georgia
  { name: "Gwinnett School of Mathematics, Science, and Technology", state: "GA", city: "Lawrenceville", country: "US" },
  { name: "Walton High School", state: "GA", city: "Marietta", country: "US" },
  { name: "Northview High School", state: "GA", city: "Johns Creek", country: "US" },
  { name: "Westminster Schools", state: "GA", city: "Atlanta", country: "US" },
  
  // Ohio
  { name: "Walnut Hills High School", state: "OH", city: "Cincinnati", country: "US" },
  { name: "Shaker Heights High School", state: "OH", city: "Shaker Heights", country: "US" },
  { name: "Upper Arlington High School", state: "OH", city: "Columbus", country: "US" },
  { name: "Solon High School", state: "OH", city: "Solon", country: "US" },
  
  // Michigan
  { name: "International Academy", state: "MI", city: "Bloomfield Hills", country: "US" },
  { name: "Detroit Country Day School", state: "MI", city: "Beverly Hills", country: "US" },
  { name: "Cranbrook Schools", state: "MI", city: "Bloomfield Hills", country: "US" },
  { name: "Pioneer High School", state: "MI", city: "Ann Arbor", country: "US" },
  
  // Washington
  { name: "Lakeside School", state: "WA", city: "Seattle", country: "US" },
  { name: "Tesla STEM High School", state: "WA", city: "Redmond", country: "US" },
  { name: "Interlake High School", state: "WA", city: "Bellevue", country: "US" },
  { name: "Newport High School", state: "WA", city: "Bellevue", country: "US" },
  
  // More states with sample schools
  { name: "Naperville North High School", state: "IL", city: "Naperville", country: "US" },
  { name: "Adlai E. Stevenson High School", state: "IL", city: "Lincolnshire", country: "US" },
  { name: "Cherry Creek High School", state: "CO", city: "Greenwood Village", country: "US" },
  { name: "Fairview High School", state: "CO", city: "Boulder", country: "US" },
  { name: "Basis Scottsdale", state: "AZ", city: "Scottsdale", country: "US" },
  { name: "Hamilton High School", state: "AZ", city: "Chandler", country: "US" },
  { name: "Mercer Island High School", state: "WA", city: "Mercer Island", country: "US" },
  { name: "Edina High School", state: "MN", city: "Edina", country: "US" },
  { name: "Wayzata High School", state: "MN", city: "Plymouth", country: "US" },
  { name: "Deerfield High School", state: "IL", city: "Deerfield", country: "US" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Require authentication - check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user's token
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.log('Invalid or expired token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check if user has admin role using the has_role RPC
    const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Error checking admin role:', roleError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.log('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin access confirmed for user:', user.id);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting school data seeding...');

    // Clear existing data (optional, based on request)
    const { searchParams } = new URL(req.url);
    const clearFirst = searchParams.get('clear') === 'true';
    
    if (clearFirst) {
      console.log('Clearing existing schools...');
      await supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Insert universities
    const universityRecords = NOTABLE_UNIVERSITIES.map(u => ({
      name: u.name,
      country: u.country,
      state: u.state,
      city: u.city,
      type: 'university' as const,
      is_notable: u.is_notable,
    }));

    console.log(`Inserting ${universityRecords.length} universities...`);
    const { error: uniError } = await supabase
      .from('schools')
      .upsert(universityRecords, { onConflict: 'name,country' });
    
    if (uniError) {
      console.error('University insert error:', uniError);
    }

    // Insert high schools
    const highSchoolRecords = SAMPLE_HIGH_SCHOOLS.map(h => ({
      name: h.name,
      country: h.country,
      state: h.state,
      city: h.city,
      type: 'high_school' as const,
      is_notable: false,
    }));

    console.log(`Inserting ${highSchoolRecords.length} high schools...`);
    const { error: hsError } = await supabase
      .from('schools')
      .upsert(highSchoolRecords, { onConflict: 'name,country' });
    
    if (hsError) {
      console.error('High school insert error:', hsError);
    }

    // Get counts
    const { count: uniCount } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'university');

    const { count: hsCount } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'high_school');

    console.log(`Seeding complete. Universities: ${uniCount}, High Schools: ${hsCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schools seeded successfully',
        counts: {
          universities: uniCount,
          highSchools: hsCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Seeding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
