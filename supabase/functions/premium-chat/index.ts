import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid or expired token:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Verify premium subscription status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_premium, subscription_ends_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to verify subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.log('Profile not found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if premium and not expired
    const now = new Date();
    const isActive = profile.is_premium && 
      (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > now);

    if (!isActive) {
      console.log('User is not premium or subscription expired:', userId);
      return new Response(
        JSON.stringify({ error: 'Premium subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const { messages } = await req.json();
    
    // Validate message format - must be a non-empty array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit message history to prevent abuse (last 20 messages)
    const limitedMessages = messages.slice(-20);

    // Maximum allowed length for a single message content
    const MAX_MESSAGE_LENGTH = 10000;
    // Maximum total payload size across all messages
    const MAX_TOTAL_PAYLOAD = 50000;
    // Valid message roles
    const VALID_ROLES = ['user', 'assistant', 'system'];

    let totalPayloadSize = 0;

    // Validate each message structure and content
    for (const msg of limitedMessages) {
      // Check message has required fields
      if (!msg || typeof msg !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid message structure' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role field
      if (!msg.role || typeof msg.role !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Message must have a valid role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate role is one of expected values
      if (!VALID_ROLES.includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: 'Invalid message role. Must be user, assistant, or system' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate content field
      if (!msg.content || typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Message content must be a non-empty string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check individual message length
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed per message` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      totalPayloadSize += msg.content.length;
    }

    // Check total payload size
    if (totalPayloadSize > MAX_TOTAL_PAYLOAD) {
      return new Response(
        JSON.stringify({ error: `Total message payload too large. Maximum ${MAX_TOTAL_PAYLOAD} characters allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize messages to only include expected fields
    const sanitizedMessages = limitedMessages.map(msg => ({
      role: msg.role,
      content: msg.content.trim()
    }));
    
    console.log('Processing chat request for premium user:', userId, 'messages:', sanitizedMessages.length, 'total chars:', totalPayloadSize);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful, friendly AI assistant for Upathion premium users. Be concise and helpful.' 
          },
          ...sanitizedMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in premium-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
