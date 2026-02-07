import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — reuse the same client across the app.
let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Base Supabase client (no RLS context set).
 * Use `getAuthenticatedClient()` instead for queries that need RLS.
 */
export function getSupabaseClient() {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
  }
  return client;
}

/**
 * Authenticated Supabase client with RLS context.
 * Sets `app.telegram_id` based on localStorage before returning the client.
 *
 * IMPORTANT: This must be called from client components (useEffect, event handlers)
 * where localStorage is available. For server components, use getSupabaseClient().
 */
export async function getAuthenticatedClient(): Promise<SupabaseClient<Database>> {
  const client = getSupabaseClient();

  // Get telegram_id from localStorage (set by Telegram Login Widget)
  const telegramId = localStorage.getItem("telegram_id");
  if (!telegramId) {
    throw new Error("Not authenticated: telegram_id not found in localStorage");
  }

  // Set PostgreSQL session variable for RLS policies
  await client.rpc("set_telegram_context", { telegram_id: parseInt(telegramId, 10) });

  return client;
}

/**
 * Get the current user's ID from their telegram_id.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<number | null> {
  const telegramId = localStorage.getItem("telegram_id");
  if (!telegramId) return null;

  const client = getSupabaseClient();
  const { data } = await client
    .from("users")
    .select("id, active_household_id")
    .eq("telegram_id", parseInt(telegramId, 10))
    .single();

  return data?.id ?? null;
}

/**
 * Get the current user's active household ID.
 * Returns null if not authenticated or no active household.
 */
export async function getActiveHouseholdId(): Promise<number | null> {
  const telegramId = localStorage.getItem("telegram_id");
  if (!telegramId) return null;

  const client = getSupabaseClient();
  const { data } = await client
    .from("users")
    .select("active_household_id")
    .eq("telegram_id", parseInt(telegramId, 10))
    .single();

  return data?.active_household_id ?? null;
}
