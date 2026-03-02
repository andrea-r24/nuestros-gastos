"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase-browser";
import { isMockMode, MOCK_USER } from "./mock-data";

export interface AuthUser {
  id: number;
  supabase_auth_id: string;
  telegram_id: number | null;
  name: string;
  active_household_id: number | null;
}

/**
 * Hook to ensure user is authenticated via Supabase Auth.
 * Redirects to "/" if no active session.
 * Returns internal user data once loaded.
 *
 * In demo mode (localStorage.dev_mock = "1"), returns MOCK_USER immediately.
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode()) {
      setUser(MOCK_USER as AuthUser);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/");
        return;
      }

      // Fetch internal user record by supabase_auth_id
      const { data, error } = await supabase
        .from("users")
        .select("id, supabase_auth_id, telegram_id, name, active_household_id")
        .eq("supabase_auth_id", authUser.id)
        .single();

      if (error || !data) {
        // Auth session exists but no internal user — sign out
        await supabase.auth.signOut();
        router.push("/");
        return;
      }

      setUser(data as AuthUser);
      setLoading(false);
    };

    fetchUser();

    // Listen for auth state changes (e.g. sign out from another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return { user, loading };
}

/**
 * Hook to get the active household ID.
 * Requires user to be authenticated and have an active household.
 * Redirects to onboarding if no active household set.
 */
export function useActiveHousehold() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // No longer redirect to onboarding — let the dashboard handle the empty state
  // Users without a household will see a CTA to create or join one

  return {
    householdId: user?.active_household_id ?? null,
    user,
    loading,
  };
}
