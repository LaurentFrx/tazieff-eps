import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function createSupabaseClient(key: string): SupabaseClient | null {
  if (!SUPABASE_URL || !key) {
    return null;
  }

  return createClient(SUPABASE_URL, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServerClient(): SupabaseClient | null {
  return createSupabaseClient(SUPABASE_ANON_KEY);
}

export function getSupabaseServiceClient(): SupabaseClient {
  const client = createSupabaseClient(SUPABASE_SERVICE_ROLE_KEY);
  if (!client) {
    throw new Error("Supabase service role is not configured.");
  }
  return client;
}
