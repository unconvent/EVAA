import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let warnedMissingEnv = false;

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (!warnedMissingEnv && typeof window !== "undefined") {
      console.warn(
        "Supabase env vars not set; authentication features are disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are provided."
      );
      warnedMissingEnv = true;
    }
    return null;
  }

  return createBrowserClient(url, anon);
}
