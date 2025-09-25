import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let warned = false;

export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    if (!warned) {
      console.warn(
        "Supabase service key missing; webhook handlers will skip database sync until configured."
      );
      warned = true;
    }
    return null;
  }
  return createClient(url, service);
}
