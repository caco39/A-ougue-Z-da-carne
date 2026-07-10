import { createClient } from "@supabase/supabase-js";

// Robust URL parsing to handle mismatches in config keys
let supabaseUrl = process.env.DATABASE_URL || "";
if (!supabaseUrl.startsWith("https://")) {
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl.includes("/auth/v1/.well-known/jwks.json")) {
    supabaseUrl = supabaseUrl.replace("/auth/v1/.well-known/jwks.json", "");
  }
}

// Fallback just in case
if (!supabaseUrl) {
  supabaseUrl = "https://rtotbzitetijjohmmlzq.supabase.co";
}

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
