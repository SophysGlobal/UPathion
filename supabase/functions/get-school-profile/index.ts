import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { schoolId } = await req.json();
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
    const { data: existing } = await supabase
      .from("school_profiles").select("*").eq("school_id", schoolId).maybeSingle();

    const isFresh =
      existing?.enrichment_status === "enriched" &&
      existing.description_year === currentYear;

    if (isFresh) {
      return new Response(
        JSON.stringify({ profile: existing, school }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Need enrichment. Call enrich function and wait (with a soft timeout).
    // If it takes too long, return whatever we have and let it finish in the background.
    const enrichUrl = `${supabaseUrl}/functions/v1/enrich-school-profile`;
    const enrichPromise = fetch(enrichUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ schoolId }),
    }).then((r) => r.json()).catch((e) => {
      console.error("enrich call failed:", e);
      return null;
    });

    const timeout = new Promise<null>((res) => setTimeout(() => res(null), 12000));
    const result = await Promise.race([enrichPromise, timeout]);

    if (result && (result as { profile?: unknown }).profile) {
      const r = result as { profile: unknown };
      return new Response(
        JSON.stringify({ profile: r.profile, school }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Timeout — return existing (possibly minimal) profile and let enrichment finish async
    if (existing) {
      return new Response(
        JSON.stringify({ profile: existing, school, enrichmentPending: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // No existing row: insert a minimal placeholder so the UI has something to render
    const placeholder = {
      school_id: schoolId,
      tagline: school.type === "university" ? "Loading profile…" : "Loading profile…",
      about_text: `Profile for ${school.name} is being prepared. Refresh in a moment to see full details.`,
      chips: [],
      enrichment_status: "pending",
    };
    const { data: inserted } = await supabase
      .from("school_profiles").insert(placeholder).select().single();

    return new Response(
      JSON.stringify({ profile: inserted ?? placeholder, school, enrichmentPending: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("get-school-profile error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});