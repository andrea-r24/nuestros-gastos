"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "./supabase";

export interface AuthUser {
  id: number;
  telegram_id: number;
  name: string;
  active_household_id: number | null;
}

/**
 * Hook to ensure user is authenticated.
 * Redirects to "/" if no telegram_id in localStorage.
 * Returns user data once loaded.
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const telegramId = localStorage.getItem("telegram_id");

    if (!telegramId) {
      // Not authenticated — redirect to landing
      router.push("/");
      return;
    }

    // Fetch user data
    const fetchUser = async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("users")
        .select("id, telegram_id, name, active_household_id")
        .eq("telegram_id", parseInt(telegramId, 10))
        .single();

      if (error || !data) {
        // User not found in database — invalid telegram_id
        localStorage.removeItem("telegram_id");
        router.push("/");
        return;
      }

      setUser(data);
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  return { user, loading };
}

/**
 * Hook to get the active household ID.
 * Requires user to be authenticated and have an active household.
 * Redirects to settings if no active household set.
 */
export function useActiveHousehold() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (!user.active_household_id) {
      // No active household — redirect to settings to choose one
      router.push("/dashboard/settings");
    }
  }, [user, loading, router]);

  return {
    householdId: user?.active_household_id ?? null,
    user,
    loading,
  };
}
