import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConfirmationRequest {
  email: string;
  confirmationUrl: string;
  type: "signup" | "resend";
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidConfirmationUrl(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsedUrl = new URL(url);
    return allowedOrigins.some(origin => parsedUrl.origin === origin);
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl, type }: ConfirmationRequest = await req.json();

    if (!email || !confirmationUrl) {
      throw new Error("Missing required fields: email and confirmationUrl");
    }

    // SECURITY: Require authentication and verify email matches the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (user.email !== email) {
      return new Response(
        JSON.stringify({ error: "Forbidden: email does not match authenticated user" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const allowedOrigins = [
      'https://id-preview--0e7f78ff-83fb-4088-a02e-6ebaceea8103.lovable.app',
      'http://localhost:8080',
      'http://localhost:5173',
    ];

    if (!isValidConfirmationUrl(confirmationUrl, allowedOrigins)) {
      console.error(`Invalid confirmation URL origin: ${confirmationUrl}`);
      return new Response(
        JSON.stringify({ error: "Invalid confirmation URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending ${type} confirmation email to ${email}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Campfire <noreply@campfire.app>",
        to: [email],
        subject: type === "signup" ? "Confirm your Campfire account" : "Confirm your email address",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #111827; font-size: 24px; margin: 0 0 24px 0; text-align: center;">
                🔥 Welcome to Campfire
              </h1>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${type === "signup" 
                  ? "Thanks for signing up! Please confirm your email address to get started."
                  : "Click the button below to confirm your email address."}
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Confirm Email
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This link will expire in 24 hours.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Confirmation email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
