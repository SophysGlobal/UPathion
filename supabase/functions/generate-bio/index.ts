import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requirePremiumUser, aiRateLimit } from "../_shared/ai-auth.ts";

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
    const auth = await requirePremiumUser(req);
    if (!auth.ok) return auth.response;
    const { userId } = auth;

    // 10 bio generations per hour per user.
    const limited = await aiRateLimit(userId, "generate_bio", 10, 3600);
    if (limited) return limited;

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