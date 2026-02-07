import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Auto-register API route.
 * Called after Telegram auth verification.
 * Creates user + personal household if user doesn't exist.
 */
export async function POST(req: NextRequest) {
  try {
    const { telegram_id, first_name, last_name, username } = await req.json();

    if (!telegram_id || !first_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use service_role key to bypass RLS for user creation
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, telegram_id, name, active_household_id")
      .eq("telegram_id", telegram_id)
      .single();

    if (existingUser) {
      // User exists, return their data
      return NextResponse.json({
        user: existingUser,
        isNewUser: false,
      });
    }

    // User doesn't exist — create user + personal household
    const displayName = `${first_name}${last_name ? " " + last_name : ""}`;

    // 1. Create personal household first
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: `Casa de ${first_name}`,
        type: "permanent",
        monthly_budget: null,
      })
      .select("id")
      .single();

    if (householdError || !household) {
      console.error("Error creating household:", householdError);
      return NextResponse.json(
        { error: "Failed to create household" },
        { status: 500 }
      );
    }

    // 2. Create user with active_household_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        telegram_id,
        name: displayName,
        active_household_id: household.id,
      })
      .select("id, telegram_id, name, active_household_id")
      .single();

    if (userError || !user) {
      console.error("Error creating user:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // 3. Update household.created_by
    await supabase
      .from("households")
      .update({ created_by: user.id })
      .eq("id", household.id);

    // 4. Add user as household owner
    await supabase.from("household_members").insert({
      household_id: household.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({
      user,
      isNewUser: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
