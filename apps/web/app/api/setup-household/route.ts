import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Updates household name + budget for a user during onboarding.
 * Uses service_role to bypass RLS.
 */
export async function POST(req: NextRequest) {
  try {
    const { telegram_id, household_name, monthly_budget } = await req.json();

    if (!telegram_id || !household_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user and their active household
    const { data: user } = await supabase
      .from("users")
      .select("id, active_household_id")
      .eq("telegram_id", telegram_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const householdId = user.active_household_id;

    if (!householdId) {
      return NextResponse.json({ error: "No active household" }, { status: 400 });
    }

    // Update household name and budget
    const { error } = await supabase
      .from("households")
      .update({
        name: household_name,
        monthly_budget: monthly_budget ?? null,
      })
      .eq("id", householdId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, household_id: householdId });
  } catch (error) {
    console.error("Setup household error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
