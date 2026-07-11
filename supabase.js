import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Helps you catch a missing .env immediately instead of getting cryptic errors
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env and fill it in.");
}

export const supabase = createClient(url, anonKey);
