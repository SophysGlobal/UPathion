import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return json({ error: "Invalid or expired token" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Premium check (with admin bypass)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, subscription_ends_at")
      .eq("id", userId)
      .single();
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    const isActive = profile?.is_premium &&
      (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > new Date());
    if (!isActive && !isAdmin) {
      return json({ error: "Premium subscription required" }, 403);
    }

    const { prompt } = await req.json().catch(() => ({ prompt: "" }));
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 1000) {
      return json({ error: "Prompt is required (1-1000 chars)" }, 400);
    }

    if (!lovableApiKey && !openAIApiKey) {
      return json({ error: "No AI provider configured" }, 500);
    }

    const messages = [
      {
        role: "system",
        content:
          "You write short, authentic student bios for the UPathion app. Output 2-3 sentences, under 280 characters, first-person, warm but not cheesy. No hashtags, no emojis, no quotes around the output. Just the bio text.",
      },
      {
        role: "user",
        content: `Write a bio based on these keywords/interests: ${prompt.trim()}`,
      },
    ];

    const callLovable = () =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Lovable-API-Key": lovableApiKey ?? "",
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
      });

    const callOpenAI = () =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-4o-mini", messages }),
      });

    let resp: Response | null = null;
    if (lovableApiKey) {
      resp = await callLovable();
      if (!resp.ok) {
        console.error("Lovable AI error:", resp.status, await resp.text());
        if (openAIApiKey) resp = await callOpenAI();
      }
    } else if (openAIApiKey) {
      resp = await callOpenAI();
    }

    if (!resp || !resp.ok) {
      const status = resp?.status ?? 500;
      const text = resp ? await resp.text() : "no response";
      console.error("AI provider error:", status, text);
      if (status === 429) return json({ error: "Rate limit exceeded, try again shortly." }, 429);
      if (status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "AI provider error" }, 500);
    }

    const data = await resp.json();
    const bio: string = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
    if (!bio) return json({ error: "AI returned an empty response" }, 502);

    return json({ bio });
  } catch (error) {
    console.error("generate-bio error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return json({ error: msg }, 500);
  }
});