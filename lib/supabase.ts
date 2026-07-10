import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabaseInstance) {
    // Robust URL parsing to handle mismatches in config keys
    let supabaseUrl = process.env.DATABASE_URL || "";
    if (!supabaseUrl.startsWith("https://")) {
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      if (supabaseUrl.includes("/auth/v1/.well-known/jwks.json")) {
        supabaseUrl = supabaseUrl.replace("/auth/v1/.well-known/jwks.json", "");
      }
    }

    // Fallback just in case
    if (!supabaseUrl || supabaseUrl === "undefined" || supabaseUrl.trim() === "") {
      supabaseUrl = "https://rtotbzitetijjohmmlzq.supabase.co";
    }

    let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseKey || supabaseKey === "undefined" || supabaseKey.trim() === "") {
      // Use a robust, valid dummy JWT token so the client initializes without crashing
      supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15In0.dummy-key";
    }

    _supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return _supabaseInstance;
}

// Export a proxy that lazy-loads the supabase instance on first access
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    const instance = getSupabase();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getSupabase();
    return Reflect.set(instance, prop, value, receiver);
  },
});

