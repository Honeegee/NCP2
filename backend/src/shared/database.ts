import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Singleton instance of Supabase client
let supabaseInstance: SupabaseClient | null = null;

export function createServerSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

// Export the singleton instance directly for convenience
export const supabase = createServerSupabase();
