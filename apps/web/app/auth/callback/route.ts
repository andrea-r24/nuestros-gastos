import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth code exchange error:", error);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  // Get the authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.redirect(`${origin}/?error=no_user`);
  }

  // Use service_role to check/create the internal user record
  const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: existingUser } = await serviceClient
    .from("users")
    .select("id, active_household_id")
    .eq("supabase_auth_id", authUser.id)
    .single();

  if (existingUser) {
    // Existing user — redirect to dashboard or onboarding
    const redirectTo = existingUser.active_household_id ? next : "/onboarding";
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // New user — create internal user record only (no household yet)
  // The user will create or join a household during onboarding
  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "Usuario";

  const { error: userError } = await serviceClient
    .from("users")
    .insert({
      supabase_auth_id: authUser.id,
      name,
      telegram_id: null,
      active_household_id: null,
    });

  if (userError) {
    console.error("Error creating user:", userError);
    return NextResponse.redirect(`${origin}/?error=setup_failed`);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
