import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { lookupNationalRank, computeSelectivityTier } from "../_shared/rankings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCORECARD_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";
const URBAN_HS_BASE =
  "https://educationdata.urban.org/api/v1/schools/ccd/directory";

// US state/territory → 2-digit FIPS code (Urban Institute API requires numeric fips)
const STATE_TO_FIPS: Record<string, number> = {
  AL: 1, AK: 2, AZ: 4, AR: 5, CA: 6, CO: 8, CT: 9, DE: 10, DC: 11, FL: 12,
  GA: 13, HI: 15, ID: 16, IL: 17, IN: 18, IA: 19, KS: 20, KY: 21, LA: 22,
  ME: 23, MD: 24, MA: 25, MI: 26, MN: 27, MS: 28, MO: 29, MT: 30, NE: 31,
  NV: 32, NH: 33, NJ: 34, NM: 35, NY: 36, NC: 37, ND: 38, OH: 39, OK: 40,
  OR: 41, PA: 42, RI: 44, SC: 45, SD: 46, TN: 47, TX: 48, UT: 49, VT: 50,
  VA: 51, WA: 53, WV: 54, WI: 55, WY: 56, AS: 60, GU: 66, MP: 69, PR: 72, VI: 78,
};

const SCHOOL_LEVEL_LABEL: Record<number, string> = {
  1: "Elementary",
  2: "Middle",
  3: "High",
  4: "Other",
  5: "Combined / K-12",
};
/* ─────────────────────── Logo helpers ─────────────────────── */

function deriveLogoFromWebsite(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl) return null;
  try {
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!host || !host.includes(".")) return null;
    return `https://img.logo.dev/${host}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=200&format=png&fallback=monogram`;
  } catch {
    return null;
  }
}

// Logo.dev supports school-name lookups too; this gives a reasonable monogram fallback
// when we have no website URL (common for high schools).
function deriveLogoFromName(name: string): string {
  const slug = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${slug}&background=random&color=fff&size=200&bold=true&format=png`;
}

/* ─────────────────────── Scorecard mapping ─────────────────────── */

function ownership(code: number): string {
  return ({ 1: "Public", 2: "Private Nonprofit", 3: "Private For-Profit" } as Record<
    number,
    string
  >)[code] || "Unknown";
}

function localeLabel(code: number | null): string | null {
  if (!code) return null;
  return ({
    11: "City: Large",
    12: "City: Midsize",
    13: "City: Small",
    21: "Suburb: Large",
    22: "Suburb: Midsize",
    23: "Suburb: Small",
    31: "Town: Fringe",
    32: "Town: Distant",
    33: "Town: Remote",
    41: "Rural: Fringe",
    42: "Rural: Distant",
    43: "Rural: Remote",
  } as Record<number, string>)[code] || null;
}

function chipsFromScorecard(d: Record<string, unknown>): string[] {
  const chips = new Set<string>();
  const carnegie = d["school.carnegie_basic"];
  const carnegieStr = carnegie != null ? String(carnegie) : "";
  if (carnegieStr.includes("Research")) chips.add("Research University");
  if (carnegieStr.includes("Doctoral")) chips.add("Doctoral Programs");
  if (carnegieStr.includes("Master")) chips.add("Master's Programs");
  if (carnegieStr.includes("Arts")) chips.add("Liberal Arts");
  if (d["latest.academics.program_available.doctoral"]) chips.add("Doctoral Programs");
  if (d["latest.academics.program_available.masters"]) chips.add("Master's Programs");
  if (d["latest.academics.program_available.bachelors"]) chips.add("Undergraduate Studies");
  const own = ownership(d["school.ownership"] as number);
  if (own !== "Unknown") chips.add(own);
  if (d["school.religious_affiliation"]) chips.add("Religious Affiliation");
  if (chips.size === 0) {
    chips.add("Higher Education");
    chips.add("Academic Programs");
  }
  return Array.from(chips).slice(0, 8);
}

function chipsFromNces(d: Record<string, unknown>): string[] {
  const chips: string[] = [];
  const levelInt = typeof d["school_level"] === "number" ? (d["school_level"] as number) : null;
  const levelLabel = levelInt != null ? SCHOOL_LEVEL_LABEL[levelInt] : null;
  if (levelLabel) chips.push(`${levelLabel} School`);
  if (d["charter"] === 1) chips.push("Charter School");
  if (d["magnet"] === 1) chips.push("Magnet School");
  if (d["title_i_eligible"] === 1) chips.push("Title I");
  if (d["virtual"] === 1) chips.push("Virtual");
  chips.push("Public School");
  chips.push("College Prep");
  chips.push("Athletics");
  chips.push("Clubs & Activities");
  return Array.from(new Set(chips)).slice(0, 8);
}

/* ─────────────────────── AI description (Lovable AI) ─────────────────────── */

async function generateAiDescription(
  apiKey: string,
  schoolName: string,
  type: "university" | "high_school",
  facts: Record<string, unknown>,
): Promise<string | null> {
  const factLines = Object.entries(facts)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const prompt = `Write a concise, professional 2-paragraph description of ${schoolName} (a ${type === "university" ? "U.S. university" : "U.S. high school"}).

ONLY use the facts below — do not fabricate rankings, history, or statistics that are not listed.
If a fact is missing, omit it rather than inventing one. Keep tone informative and student-friendly.
Each paragraph should be 2–3 sentences. No headers, no bullet points, no quotes, plain prose only.

Facts:
${factLines || "(no specific facts available — write a brief, accurate, generic description based only on the school name and type)"}`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a careful editor writing factual school profile descriptions. Never fabricate statistics, rankings, founding years, or historical claims. Use only the facts provided.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) {
      console.error("AI gateway error:", resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    return content?.trim() || null;
  } catch (e) {
    console.error("AI generation failed:", e);
    return null;
  }
}

/* ─────────────────────── Handler ─────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const scorecardKey = Deno.env.get("COLLEGE_SCORECARD_API_KEY");
    const lovableAiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { schoolId, forceRefresh = false } = await req.json();
    if (!schoolId) {
      return new Response(JSON.stringify({ error: "schoolId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: school, error: schoolErr } = await supabase
      .from("schools").select("*").eq("id", schoolId).single();
    if (schoolErr || !school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentYear = new Date().getFullYear();

    // Skip if recently enriched and description is from this year
    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from("school_profiles").select("*").eq("school_id", schoolId).maybeSingle();
      if (
        existing?.enrichment_status === "enriched" &&
        existing.description_year === currentYear
      ) {
        return new Response(
          JSON.stringify({ profile: existing, school, skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    await supabase.from("school_profiles").upsert(
      {
        school_id: schoolId,
        enrichment_status: "in_progress",
        last_enrichment_attempt: new Date().toISOString(),
      },
      { onConflict: "school_id" },
    );

    let enriched: Record<string, unknown> = {
      school_id: schoolId,
      updated_at: new Date().toISOString(),
      enrichment_status: "enriched",
      enrichment_error: null,
      description_year: currentYear,
    };
    let aiFacts: Record<string, unknown> = { location: [school.city, school.state].filter(Boolean).join(", ") };

    /* ── Universities (US): College Scorecard + curated rank ── */
    if (school.type === "university" && school.country === "US" && scorecardKey) {
      try {
        const searchName = school.name.replace(/[^\w\s&]/g, "").trim();
        const fields = [
          "id", "school.name", "school.school_url", "school.city", "school.state",
          "school.carnegie_basic", "school.religious_affiliation", "school.ownership",
          "school.locale", "latest.student.size",
          "latest.admissions.admission_rate.overall",
          "latest.academics.program_available.assoc",
          "latest.academics.program_available.bachelors",
          "latest.academics.program_available.masters",
          "latest.academics.program_available.doctoral",
          "latest.student.demographics.student_faculty_ratio",
          "latest.cost.tuition.in_state", "latest.cost.tuition.out_of_state",
          "latest.completion.rate_suppressed.overall",
        ].join(",");
        const url = `${SCORECARD_BASE}?api_key=${scorecardKey}&school.name=${encodeURIComponent(searchName)}&fields=${fields}&per_page=5`;
        const r = await fetch(url);
        const j = await r.json();
        const results: Array<Record<string, unknown>> = j.results || [];
        let match = results[0];
        for (const x of results) {
          if (String(x["school.name"]).toLowerCase() === school.name.toLowerCase()) {
            match = x;
            break;
          }
        }

        if (match) {
          const ar = match["latest.admissions.admission_rate.overall"] as number | null;
          const gr = match["latest.completion.rate_suppressed.overall"] as number | null;
          const sfr = match["latest.student.demographics.student_faculty_ratio"];
          const programs =
            ((match["latest.academics.program_available.assoc"] as number) || 0) +
            ((match["latest.academics.program_available.bachelors"] as number) || 0) +
            ((match["latest.academics.program_available.masters"] as number) || 0) +
            ((match["latest.academics.program_available.doctoral"] as number) || 0);
          let website = match["school.school_url"] as string | null;
          if (website && !website.startsWith("http")) website = "https://" + website;

          const nationalRank = lookupNationalRank(school.name);
          const tier = computeSelectivityTier(ar, gr);

          enriched = {
            ...enriched,
            enrollment: match["latest.student.size"],
            acceptance_rate: ar != null ? Math.round(ar * 1000) / 10 : null,
            graduation_rate: gr != null ? Math.round(gr * 1000) / 10 : null,
            student_faculty_ratio: sfr ? `${sfr}:1` : null,
            tuition_in_state: match["latest.cost.tuition.in_state"],
            tuition_out_of_state: match["latest.cost.tuition.out_of_state"],
            // Scorecard returns degree-level *availability* flags (0/1), not program counts.
            // Sum of flags is at most 4 — meaningless to display as "programs offered".
            programs_count: null,
            chips: chipsFromScorecard(match),
            website_url: website,
            logo_url: deriveLogoFromWebsite(website) || deriveLogoFromName(school.name),
            carnegie_classification:
              typeof match["school.carnegie_basic"] === "string"
                ? (match["school.carnegie_basic"] as string)
                : null,
            ownership_type: ownership(match["school.ownership"] as number),
            locale: localeLabel(match["school.locale"] as number | null),
            religious_affiliation: match["school.religious_affiliation"],
            scorecard_id: match.id,
            national_ranking: nationalRank,
            selectivity_tier: tier,
            ranking: nationalRank ? `#${nationalRank} National` : tier,
            ranking_source: nationalRank ? "US News (curated)" : tier ? "Computed from acceptance & graduation rate" : null,
            tagline: nationalRank ? `Ranked among the nation's top universities` : `A center for learning in ${school.city || "the community"}`,
            source_name: "College Scorecard",
            source_url: "https://collegescorecard.ed.gov/",
            source_retrieved_at: new Date().toISOString(),
            data_source: "college_scorecard",
            about_source: "Generated by AI from College Scorecard data",
            about_source_url: `https://collegescorecard.ed.gov/school/?${match.id}`,
          };

          aiFacts = {
            location: [school.city, school.state, "USA"].filter(Boolean).join(", "),
            ownership: enriched.ownership_type,
            // Only include Carnegie if it's a human-readable string
            carnegie_classification:
              typeof enriched.carnegie_classification === "string" &&
              isNaN(Number(enriched.carnegie_classification))
                ? enriched.carnegie_classification
                : null,
            enrollment: enriched.enrollment,
            acceptance_rate_percent: enriched.acceptance_rate,
            graduation_rate_percent: enriched.graduation_rate,
            student_faculty_ratio: enriched.student_faculty_ratio,
            national_ranking: nationalRank,
            selectivity: tier,
          };
        }
      } catch (e) {
        console.error("Scorecard error:", e);
      }
    }

    /* ── High Schools (US): Urban Institute / NCES CCD directory ── */
    if (school.type === "high_school" && school.country === "US") {
      try {
        const year = 2022; // Most recent year reliably available across all states
        const fips = school.state ? STATE_TO_FIPS[school.state] : null;
        const stateParam = fips ? `&fips=${fips}` : "";
        const url = `${URBAN_HS_BASE}/${year}/?school_name=${encodeURIComponent(school.name)}${stateParam}&page_size=25`;
        const r = await fetch(url);
        if (r.ok) {
          const j = await r.json();
          const results: Array<Record<string, unknown>> = j.results || [];
          // Filter to high schools only (school_level 3 = High, 5 = Combined K-12)
          const highSchools = results.filter(
            (x) => x.school_level === 3 || x.school_level === 5,
          );
          const candidates = highSchools.length > 0 ? highSchools : results;
          const lower = school.name.toLowerCase();
          const cityLower = (school.city || "").toLowerCase();
          // Prefer exact name match in same city
          const match =
            candidates.find(
              (x) =>
                String(x.school_name || "").toLowerCase() === lower &&
                String(x.city_location || "").toLowerCase() === cityLower,
            ) ||
            candidates.find(
              (x) => String(x.school_name || "").toLowerCase() === lower,
            ) ||
            candidates[0];

          if (match) {
            const enrollment = match.enrollment as number | null;
            const teachers = match.teachers_fte as number | null;
            const ratio =
              teachers && enrollment && teachers > 0
                ? `${Math.round(enrollment / teachers)}:1`
                : null;
            const levelInt = typeof match.school_level === "number"
              ? (match.school_level as number)
              : null;
            const demographics = {
              free_or_reduced_lunch: match.free_or_reduced_price_lunch ?? null,
              total_teachers: teachers,
              lowest_grade: match.lowest_grade_offered ?? null,
              highest_grade: match.highest_grade_offered ?? null,
            };

            enriched = {
              ...enriched,
              enrollment: enrollment && enrollment > 0 ? enrollment : null,
              student_faculty_ratio: ratio,
              chips: chipsFromNces(match),
              demographics,
              school_subtype: levelInt != null ? (SCHOOL_LEVEL_LABEL[levelInt] || null) : null,
              locale: localeLabel(match.urban_centric_locale as number | null) || null,
              nces_id: String(match.ncessch || ""),
              ownership_type:
                match.charter === 1
                  ? "Public Charter"
                  : match.magnet === 1
                    ? "Public Magnet"
                    : "Public",
              logo_url: deriveLogoFromName(school.name),
              source_name: "NCES Common Core of Data (via Urban Institute)",
              source_url: "https://educationdata.urban.org/",
              source_retrieved_at: new Date().toISOString(),
              data_source: "nces_ccd",
              about_source: "Generated by AI from NCES data",
              about_source_url: "https://nces.ed.gov/ccd/",
              tagline: `Serving students in ${school.city || school.state || "the community"}`,
            };

            aiFacts = {
              location: [school.city, school.state, "USA"].filter(Boolean).join(", "),
              type: "Public high school",
              subtype: enriched.school_subtype
                ? `${enriched.school_subtype} school`
                : null,
              ownership: enriched.ownership_type,
              enrollment: enriched.enrollment,
              student_teacher_ratio: enriched.student_faculty_ratio,
              locale: enriched.locale,
              grade_range:
                demographics.lowest_grade != null && demographics.highest_grade != null
                  ? `Grades ${demographics.lowest_grade}-${demographics.highest_grade}`
                  : null,
            };
          }
        } else {
          console.warn("NCES API non-OK:", r.status);
        }
      } catch (e) {
        console.error("NCES error:", e);
      }
    }

    // International / unmatched: minimal but still gets a logo + AI description
    if (!enriched.logo_url) {
      enriched.logo_url = deriveLogoFromName(school.name);
    }
    if (!enriched.chips) {
      enriched.chips =
        school.type === "university"
          ? ["Higher Education", "Academic Programs"]
          : ["Academics", "Athletics", "Clubs & Activities"];
    }
    if (!enriched.tagline) {
      enriched.tagline =
        school.type === "university"
          ? "An institution of higher learning"
          : "Building futures together";
    }

    // AI-polished description
    if (lovableAiKey) {
      const aiText = await generateAiDescription(
        lovableAiKey,
        school.name,
        school.type as "university" | "high_school",
        aiFacts,
      );
      if (aiText) enriched.about_text = aiText;
    }
    // Fallback if AI failed
    if (!enriched.about_text) {
      const loc = [school.city, school.state].filter(Boolean).join(", ");
      enriched.about_text =
        school.type === "university"
          ? `${school.name} is an institution of higher education${loc ? ` in ${loc}` : ""}. Detailed profile information is currently being compiled.`
          : `${school.name} is a school${loc ? ` in ${loc}` : ""}. Detailed profile information is currently being compiled.`;
    }

    const { data: saved, error: saveErr } = await supabase
      .from("school_profiles")
      .upsert(enriched, { onConflict: "school_id" })
      .select()
      .single();
    if (saveErr) throw saveErr;

    return new Response(
      JSON.stringify({ profile: saved, school, enriched: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("enrich error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});