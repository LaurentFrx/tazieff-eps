"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

async function initClient(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const { createClient } = await import("@supabase/supabase-js");
  client = createClient(url, anonKey);
  return client;
}

/** Synchronous access — returns the cached client or null if not yet initialized. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  return client;
}

/** Async access — initializes the client on first call via dynamic import. */
export async function getSupabaseBrowserClientAsync(): Promise<SupabaseClient | null> {
  if (client) return client;
  if (!initPromise) initPromise = initClient();
  return initPromise;
}
