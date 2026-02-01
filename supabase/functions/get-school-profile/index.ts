import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a deterministic tagline based on school type and name
function generateTagline(school: { name: string; type: string; city?: string; state?: string; country: string }): string {
  const isUniversity = school.type === 'university';
  const location = [school.city, school.state, school.country !== 'US' ? school.country : null]
    .filter(Boolean)
    .join(', ');

  const universityTaglines = [
    `Empowering minds, shaping futures`,
    `Where knowledge meets opportunity`,
    `Excellence in education and research`,
    `Building tomorrow's leaders today`,
    `A tradition of academic excellence`,
  ];

  const highSchoolTaglines = [
    `Preparing students for success`,
    `Where every student can thrive`,
    `Building strong foundations for the future`,
    `Excellence in education`,
    `Inspiring the next generation`,
  ];

  // Use school name hash to pick consistent tagline
  const hash = school.name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const taglines = isUniversity ? universityTaglines : highSchoolTaglines;
  return taglines[Math.abs(hash) % taglines.length];
}

// Generate about text based on school info
function generateAboutText(school: { name: string; type: string; city?: string; state?: string; country: string; is_notable: boolean }): string {
  const isUniversity = school.type === 'university';
  const location = [school.city, school.state].filter(Boolean).join(', ');
  const countryText = school.country !== 'US' ? ` in ${school.country}` : '';
  const locationFull = location ? `${location}${countryText}` : (school.country !== 'US' ? school.country : 'the United States');

  if (isUniversity) {
    if (school.is_notable) {
      return `${school.name} is a prestigious institution of higher education located in ${locationFull}. Known for its rigorous academic programs and distinguished faculty, the university attracts students from around the world who seek excellence in their chosen fields of study.

The university offers a comprehensive range of undergraduate, graduate, and professional programs across various disciplines. Students benefit from state-of-the-art facilities, cutting-edge research opportunities, and a vibrant campus community.

With a commitment to fostering intellectual curiosity and preparing graduates for leadership roles in their respective fields, ${school.name} continues to uphold its reputation as a leading center for education and innovation.`;
    } else {
      return `${school.name} is an institution of higher education located in ${locationFull}. The university is dedicated to providing quality education and preparing students for successful careers in their chosen fields.

The institution offers a variety of academic programs designed to meet the diverse needs and interests of its student body. Students have access to supportive faculty, modern facilities, and numerous opportunities for personal and professional growth.

${school.name} is committed to creating an inclusive learning environment where students can develop the knowledge and skills needed to make meaningful contributions to society.`;
    }
  } else {
    return `${school.name} is a high school located in ${locationFull}. The school is committed to providing a comprehensive education that prepares students for college, career, and life success.

The school offers a diverse curriculum that includes core academic subjects, advanced placement courses, and various elective programs. Students have opportunities to participate in athletics, arts, clubs, and community service activities.

With a focus on academic excellence and character development, ${school.name} strives to create a supportive environment where every student can discover their potential and achieve their goals.`;
  }
}

// Generate default chips based on school type
function generateDefaultChips(school: { type: string; is_notable: boolean }): string[] {
  if (school.type === 'university') {
    if (school.is_notable) {
      return [
        'Arts & Sciences',
        'Engineering',
        'Business',
        'Medicine',
        'Law',
        'Graduate Studies',
        'Research',
        'Professional Programs',
      ];
    }
    return [
      'Arts & Sciences',
      'Business',
      'Education',
      'Health Sciences',
      'Technology',
      'Graduate Programs',
    ];
  } else {
    return [
      'Academics',
      'Athletics',
      'Arts & Music',
      'Clubs & Activities',
      'College Prep',
      'Student Services',
    ];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use service role for writing, anon for reading
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    const { schoolId } = await req.json();

    if (!schoolId) {
      return new Response(
        JSON.stringify({ error: 'schoolId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting/generating profile for school: ${schoolId}`);

    // Fetch school data first
    const { data: school, error: schoolError } = await supabaseAnon
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      console.error('School not found:', schoolError);
      return new Response(
        JSON.stringify({ error: 'School not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAnon
      .from('school_profiles')
      .select('*')
      .eq('school_id', schoolId)
      .maybeSingle();

    // If enriched profile exists and is recent, return it
    if (existingProfile?.enrichment_status === 'enriched') {
      console.log('Found enriched profile');
      return new Response(
        JSON.stringify({ profile: existingProfile, school }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If profile exists but needs enrichment, trigger async enrichment
    if (existingProfile && existingProfile.enrichment_status !== 'in_progress') {
      console.log('Profile exists but needs enrichment, triggering async enrichment');
      
      // Trigger enrichment asynchronously (don't await)
      const enrichmentUrl = `${supabaseUrl}/functions/v1/enrich-school-profile`;
      fetch(enrichmentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ schoolId }),
      }).catch(err => console.error('Async enrichment trigger failed:', err));
      
      return new Response(
        JSON.stringify({ profile: existingProfile, school, enrichmentPending: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No profile exists - create a basic one and trigger enrichment
    console.log('No profile exists, creating basic and triggering enrichment');

    // Generate basic profile data
    const tagline = generateTagline(school);
    const aboutText = generateAboutText(school);
    const chips = generateDefaultChips(school);

    const newProfile = {
      school_id: schoolId,
      tagline,
      about_text: aboutText,
      website_url: null,
      stats: {},
      chips,
      founded_year: null,
      enrollment: null,
      data_source: 'generated',
      enrichment_status: 'pending',
    };

    const { data: insertedProfile, error: insertError } = await supabaseService
      .from('school_profiles')
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert profile:', insertError);
      // If insert failed due to race condition, try to fetch again
      const { data: raceProfile } = await supabaseAnon
        .from('school_profiles')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (raceProfile) {
        return new Response(
          JSON.stringify({ profile: raceProfile, school }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }

    // Trigger enrichment asynchronously
    const enrichmentUrl = `${supabaseUrl}/functions/v1/enrich-school-profile`;
    fetch(enrichmentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ schoolId }),
    }).catch(err => console.error('Async enrichment trigger failed:', err));

    console.log('Profile created, enrichment triggered');

    return new Response(
      JSON.stringify({ profile: insertedProfile, school, enrichmentPending: true }),
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
