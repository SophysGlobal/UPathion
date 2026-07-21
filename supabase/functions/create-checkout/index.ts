import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { authenticateUser, requireNotSuspended, rateLimit, logSecurityEvent } from "../_shared/auth.ts";
import { corsHeaders, jsonError, jsonOk, newRequestId, logEvent } from "../_shared/http.ts";

// Server-side allowlist of accepted Stripe price IDs. Prevents authenticated
// users from passing arbitrary price IDs (test prices, other tiers, promos)
// to subscribe at unintended amounts.
const ALLOWED_PRICE_IDS = new Set<string>([
  "price_1T8nR6QaZOki2KO0sb3eSsvK", // monthly
  "price_1T8nR6QaZOki2KO0ujPE1DA0", // yearly
]);

const ALLOWED_ORIGINS = new Set<string>([
  "https://id-preview--0e7f78ff-83fb-4088-a02e-6ebaceea8103.lovable.app",
  "https://upathion.com",
  "https://www.upathion.com",
  "http://localhost:8080",
  "http://localhost:5173",
]);

serve(async (req) => {
  const reqId = newRequestId();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return jsonError(405, "Method not allowed");

  try {
    const authResult = await authenticateUser(req);
    if (!authResult.ok) return authResult.response;
    const { userId, email, supabaseAsUser } = authResult.ctx;
    if (!email) return jsonError(400, "Account email is missing");

    const suspended = await requireNotSuspended(userId);
    if (suspended) return suspended;

    // 5 checkout starts per 10 minutes per user.
    const limited = await rateLimit({ userId, action: "create_checkout", max: 5, windowSec: 600 });
    if (limited) return limited;

    const body = await req.json().catch(() => null) as { priceId?: unknown } | null;
    const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      await logSecurityEvent("checkout_invalid_price", userId, "warn", { reqId, priceId });
      return jsonError(400, "Invalid price");
    }
    const origin = req.headers.get("origin") ?? "";
    if (!ALLOWED_ORIGINS.has(origin)) {
      await logSecurityEvent("checkout_invalid_origin", userId, "warn", { reqId, origin });
      return jsonError(400, "Invalid request origin");
    }

    // Silence unused-import lint for supabaseAsUser.
    void supabaseAsUser;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/subscription`,
      client_reference_id: userId,
      metadata: { user_id: userId },
    });

    logEvent("create-checkout", reqId, "session_created", { userId, priceId });
    return jsonOk({ url: session.url });
  } catch (error) {
    logEvent("create-checkout", reqId, "error", { message: error instanceof Error ? error.message : String(error) });
    return jsonError(500, "Unable to start checkout");
  }
});
