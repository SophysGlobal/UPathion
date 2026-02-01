import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// College Scorecard API base URL
const SCORECARD_BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

interface ScorecardSchool {
  id: number;
  'school.name': string;
  'school.school_url': string;
  'school.city': string;
  'school.state': string;
  'school.carnegie_size_setting': number | null;
  'school.carnegie_basic': string | null;
  'school.religious_affiliation': string | null;
  'school.ownership': number;
  'school.locale': number | null;
  'latest.student.size': number | null;
  'latest.admissions.admission_rate.overall': number | null;
  'latest.student.grad_students': number | null;
  'latest.academics.program_available.assoc': number | null;
  'latest.academics.program_available.bachelors': number | null;
  'latest.academics.program_available.masters': number | null;
  'latest.academics.program_available.doctoral': number | null;
  'latest.student.demographics.student_faculty_ratio': number | null;
  'latest.cost.tuition.in_state': number | null;
  'latest.cost.tuition.out_of_state': number | null;
  'latest.completion.rate_suppressed.overall': number | null;
}

// Map ownership codes to readable strings
function getOwnershipType(code: number): string {
  const types: Record<number, string> = {
    1: 'Public',
    2: 'Private Nonprofit',
    3: 'Private For-Profit',
  };
  return types[code] || 'Unknown';
}

// Map locale codes to readable strings  
function getLocale(code: number | null): string | null {
  if (!code) return null;
  const locales: Record<number, string> = {
    11: 'City: Large',
    12: 'City: Midsize', 
    13: 'City: Small',
    21: 'Suburb: Large',
    22: 'Suburb: Midsize',
    23: 'Suburb: Small',
    31: 'Town: Fringe',
    32: 'Town: Distant',
    33: 'Town: Remote',
    41: 'Rural: Fringe',
    42: 'Rural: Distant',
    43: 'Rural: Remote',
  };
  return locales[code] || null;
}

// Generate department chips based on available programs
function generateChipsFromPrograms(scorecardData: ScorecardSchool): string[] {
  const chips: string[] = [];
  
  // Add based on program availability and carnegie classification
  const carnegieRaw = scorecardData['school.carnegie_basic'];
  // Ensure carnegie is a string (API may return number)
  const carnegie = carnegieRaw != null ? String(carnegieRaw) : null;
  
  if (carnegie) {
    if (carnegie.includes('Research')) chips.push('Research University');
    if (carnegie.includes('Doctoral')) chips.push('Doctoral Programs');
    if (carnegie.includes('Masters')) chips.push("Master's Programs");
    if (carnegie.includes('Arts')) chips.push('Liberal Arts');
    if (carnegie.includes('Engineering')) chips.push('Engineering');
    if (carnegie.includes('Health')) chips.push('Health Sciences');
    if (carnegie.includes('Business')) chips.push('Business');
  }
  
  // Add based on program counts
  if (scorecardData['latest.academics.program_available.doctoral']) {
    if (!chips.includes('Doctoral Programs')) chips.push('Doctoral Programs');
  }
  if (scorecardData['latest.academics.program_available.masters']) {
    if (!chips.includes("Master's Programs")) chips.push("Master's Programs");
  }
  if (scorecardData['latest.academics.program_available.bachelors']) {
    chips.push('Undergraduate Studies');
  }
  
  // Add ownership type
  const ownershipType = getOwnershipType(scorecardData['school.ownership']);
  if (ownershipType !== 'Unknown') chips.push(ownershipType);
  
  // Religious affiliation
  if (scorecardData['school.religious_affiliation']) {
    chips.push('Religious Affiliation');
  }
  
  // Default chips if none found
  if (chips.length === 0) {
    chips.push('Higher Education', 'Academic Programs');
  }
  
  return chips.slice(0, 8); // Limit to 8 chips
}

// Calculate total programs count
function calculateProgramsCount(scorecardData: ScorecardSchool): number | null {
  const assoc = scorecardData['latest.academics.program_available.assoc'] || 0;
  const bachelors = scorecardData['latest.academics.program_available.bachelors'] || 0;
  const masters = scorecardData['latest.academics.program_available.masters'] || 0;
  const doctoral = scorecardData['latest.academics.program_available.doctoral'] || 0;
  
  const total = assoc + bachelors + masters + doctoral;
  return total > 0 ? total : null;
}

// Generate about text from real data
function generateAboutText(school: { name: string; city?: string; state?: string }, scorecardData: ScorecardSchool): string {
  const location = [school.city || scorecardData['school.city'], school.state || scorecardData['school.state']]
    .filter(Boolean)
    .join(', ');
  
  const enrollment = scorecardData['latest.student.size'];
  const acceptanceRate = scorecardData['latest.admissions.admission_rate.overall'];
  const ownershipType = getOwnershipType(scorecardData['school.ownership']);
  const carnegie = scorecardData['school.carnegie_basic'];
  const graduationRate = scorecardData['latest.completion.rate_suppressed.overall'];
  const studentFacultyRatio = scorecardData['latest.student.demographics.student_faculty_ratio'];
  
  const paragraphs: string[] = [];
  
  // First paragraph - basic info
  let intro = `${school.name} is a ${ownershipType.toLowerCase()} institution`;
  if (location) intro += ` located in ${location}`;
  intro += '.';
  
  if (carnegie) {
    intro += ` Classified as a ${carnegie}, the institution `;
    if (enrollment) {
      intro += `serves approximately ${enrollment.toLocaleString()} students.`;
    } else {
      intro += `offers a range of academic programs.`;
    }
  } else if (enrollment) {
    intro += ` The institution serves approximately ${enrollment.toLocaleString()} students.`;
  }
  paragraphs.push(intro);
  
  // Second paragraph - admissions and academics
  const academicDetails: string[] = [];
  if (acceptanceRate !== null) {
    academicDetails.push(`an acceptance rate of ${(acceptanceRate * 100).toFixed(1)}%`);
  }
  if (studentFacultyRatio) {
    academicDetails.push(`a student-to-faculty ratio of ${studentFacultyRatio}:1`);
  }
  if (graduationRate !== null) {
    academicDetails.push(`a graduation rate of ${(graduationRate * 100).toFixed(1)}%`);
  }
  
  if (academicDetails.length > 0) {
    let academicParagraph = `The university features ${academicDetails.join(', ')}.`;
    paragraphs.push(academicParagraph);
  }
  
  // Third paragraph - programs
  const programsCount = calculateProgramsCount(scorecardData);
  if (programsCount) {
    paragraphs.push(`Students can choose from ${programsCount} academic programs across various fields of study, preparing them for successful careers in their chosen disciplines.`);
  }
  
  return paragraphs.join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const scorecardApiKey = Deno.env.get('COLLEGE_SCORECARD_API_KEY');
    
    if (!scorecardApiKey) {
      console.error('COLLEGE_SCORECARD_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Enrichment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { schoolId, forceRefresh = false } = await req.json();

    if (!schoolId) {
      return new Response(
        JSON.stringify({ error: 'schoolId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enriching school: ${schoolId}, forceRefresh: ${forceRefresh}`);

    // Fetch school data
    const { data: school, error: schoolError } = await supabase
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

    // Check if we already have a recent profile (skip if forceRefresh)
    if (!forceRefresh) {
      const { data: existingProfile } = await supabase
        .from('school_profiles')
        .select('*')
        .eq('school_id', schoolId)
        .maybeSingle();

      if (existingProfile?.enrichment_status === 'enriched') {
        const lastEnrichment = existingProfile.source_retrieved_at 
          ? new Date(existingProfile.source_retrieved_at) 
          : null;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (lastEnrichment && lastEnrichment > thirtyDaysAgo) {
          console.log('Profile recently enriched, skipping');
          return new Response(
            JSON.stringify({ profile: existingProfile, school, skipped: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Update status to in_progress
    await supabase
      .from('school_profiles')
      .upsert({
        school_id: schoolId,
        enrichment_status: 'in_progress',
        last_enrichment_attempt: new Date().toISOString(),
      }, { onConflict: 'school_id' });

    // Only enrich US universities from College Scorecard
    if (school.type === 'university' && school.country === 'US') {
      try {
        // Search for school in College Scorecard
        const searchName = school.name.replace(/[^\w\s]/g, '').trim();
        const searchUrl = `${SCORECARD_BASE_URL}?api_key=${scorecardApiKey}&school.name=${encodeURIComponent(searchName)}&fields=id,school.name,school.school_url,school.city,school.state,school.carnegie_size_setting,school.carnegie_basic,school.religious_affiliation,school.ownership,school.locale,latest.student.size,latest.admissions.admission_rate.overall,latest.student.grad_students,latest.academics.program_available.assoc,latest.academics.program_available.bachelors,latest.academics.program_available.masters,latest.academics.program_available.doctoral,latest.student.demographics.student_faculty_ratio,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.completion.rate_suppressed.overall&per_page=5`;
        
        console.log(`Searching College Scorecard for: ${searchName}`);
        
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Scorecard API error: ${response.status}`);
        }
        
        const results = data.results as ScorecardSchool[];
        
        if (results && results.length > 0) {
          // Find best match (exact or closest name match)
          let bestMatch = results[0];
          for (const result of results) {
            if (result['school.name'].toLowerCase() === school.name.toLowerCase()) {
              bestMatch = result;
              break;
            }
          }
          
          console.log(`Found match: ${bestMatch['school.name']} (ID: ${bestMatch.id})`);
          
          // Extract data
          const enrollment = bestMatch['latest.student.size'];
          const acceptanceRate = bestMatch['latest.admissions.admission_rate.overall'];
          const studentFacultyRatio = bestMatch['latest.student.demographics.student_faculty_ratio'];
          const tuitionInState = bestMatch['latest.cost.tuition.in_state'];
          const tuitionOutOfState = bestMatch['latest.cost.tuition.out_of_state'];
          const graduationRate = bestMatch['latest.completion.rate_suppressed.overall'];
          const programsCount = calculateProgramsCount(bestMatch);
          const chips = generateChipsFromPrograms(bestMatch);
          const aboutText = generateAboutText(school, bestMatch);
          
          // Prepare website URL
          let websiteUrl = bestMatch['school.school_url'];
          if (websiteUrl && !websiteUrl.startsWith('http')) {
            websiteUrl = 'https://' + websiteUrl;
          }
          
          // Update profile with enriched data
          const enrichedProfile = {
            school_id: schoolId,
            enrollment,
            acceptance_rate: acceptanceRate !== null ? Math.round(acceptanceRate * 1000) / 10 : null, // Convert to percentage
            student_faculty_ratio: studentFacultyRatio ? `${studentFacultyRatio}:1` : null,
            tuition_in_state: tuitionInState,
            tuition_out_of_state: tuitionOutOfState,
            graduation_rate: graduationRate !== null ? Math.round(graduationRate * 1000) / 10 : null,
            programs_count: programsCount,
            chips,
            website_url: websiteUrl,
            about_text: aboutText,
            tagline: `Empowering students in ${school.city || 'their community'}`,
            carnegie_classification: bestMatch['school.carnegie_basic'],
            ownership_type: getOwnershipType(bestMatch['school.ownership']),
            locale: getLocale(bestMatch['school.locale']),
            religious_affiliation: bestMatch['school.religious_affiliation'],
            scorecard_id: bestMatch.id,
            source_name: 'College Scorecard',
            source_url: 'https://collegescorecard.ed.gov/',
            source_retrieved_at: new Date().toISOString(),
            data_source: 'college_scorecard',
            enrichment_status: 'enriched',
            enrichment_error: null,
            about_source: 'Generated from College Scorecard data',
            about_source_url: `https://collegescorecard.ed.gov/school/?${bestMatch.id}`,
            updated_at: new Date().toISOString(),
          };
          
          const { data: updatedProfile, error: updateError } = await supabase
            .from('school_profiles')
            .upsert(enrichedProfile, { onConflict: 'school_id' })
            .select()
            .single();
          
          if (updateError) {
            throw updateError;
          }
          
          console.log('Profile enriched successfully');
          
          return new Response(
            JSON.stringify({ profile: updatedProfile, school, enriched: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('No match found in College Scorecard');
          // No match found - generate basic profile
          throw new Error('No match found in College Scorecard');
        }
      } catch (enrichError) {
        console.error('Enrichment error:', enrichError);
        
        // Update with error status but provide generated fallback
        const fallbackProfile = {
          school_id: schoolId,
          enrichment_status: 'failed',
          enrichment_error: enrichError instanceof Error ? enrichError.message : 'Unknown error',
          last_enrichment_attempt: new Date().toISOString(),
          // Provide generated content as fallback
          tagline: `${school.type === 'university' ? 'Empowering minds' : 'Preparing students'} in ${school.city || 'their community'}`,
          about_text: `${school.name} is an educational institution located in ${[school.city, school.state].filter(Boolean).join(', ') || 'the United States'}. The institution is dedicated to providing quality education and preparing students for success in their chosen fields.`,
          chips: school.type === 'university' 
            ? ['Higher Education', 'Academic Programs', 'Student Life']
            : ['Academics', 'Athletics', 'Arts', 'Clubs'],
          data_source: 'generated',
          updated_at: new Date().toISOString(),
        };
        
        const { data: fallback } = await supabase
          .from('school_profiles')
          .upsert(fallbackProfile, { onConflict: 'school_id' })
          .select()
          .single();
        
        return new Response(
          JSON.stringify({ profile: fallback, school, enriched: false, error: 'Enrichment failed, using generated content' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For high schools or non-US schools, generate basic profile
      console.log('School type/country not supported for College Scorecard enrichment');
      
      const generatedProfile = {
        school_id: schoolId,
        tagline: school.type === 'high_school' 
          ? `Preparing students for success in ${school.city || 'their community'}`
          : `Excellence in education in ${school.city || 'their community'}`,
        about_text: school.type === 'high_school'
          ? `${school.name} is a high school located in ${[school.city, school.state].filter(Boolean).join(', ') || 'the United States'}. The school is committed to providing a comprehensive education that prepares students for college, career, and life success. Students have opportunities to participate in academics, athletics, arts, and various extracurricular activities.`
          : `${school.name} is an institution of higher education${school.city ? ` located in ${[school.city, school.state, school.country !== 'US' ? school.country : null].filter(Boolean).join(', ')}` : ''}. The institution offers academic programs designed to prepare students for successful careers in their chosen fields.`,
        chips: school.type === 'high_school'
          ? ['Academics', 'Athletics', 'Arts', 'College Prep', 'Clubs & Activities']
          : ['Academic Programs', 'Research', 'Student Life', 'Global Community'],
        data_source: 'generated',
        enrichment_status: 'generated',
        updated_at: new Date().toISOString(),
      };
      
      const { data: generatedResult } = await supabase
        .from('school_profiles')
        .upsert(generatedProfile, { onConflict: 'school_id' })
        .select()
        .single();
      
      return new Response(
        JSON.stringify({ profile: generatedResult, school, enriched: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
