import { createClient } from '@supabase/supabase-js';

// Use hardcoded values since VITE_* env vars are not supported in Lovable
const SUPABASE_URL = "https://bnbzduurgsdyfylywyhr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYnpkdXVyZ3NkeWZ5bHl3eWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODA1NTksImV4cCI6MjA4MTg1NjU1OX0.cnZYlyE4gjOCnon4_H3ogfl1omI5gI0dvllwPMuLYk0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
