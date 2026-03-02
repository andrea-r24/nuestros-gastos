import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Codigo requerido" }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Read-only context
          }
        },
      },
    });

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Use service_role for all DB operations
    const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get the internal user
    const { data: internalUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("supabase_auth_id", authUser.id)
      .single();

    if (!internalUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Validate the invite code
    const { data: invite } = await serviceClient
      .from("household_invites")
      .select("id, household_id, max_uses, use_count, expires_at, is_active")
      .eq("code", normalizedCode)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Codigo de invitacion invalido" }, { status: 404 });
    }

    if (!invite.is_active) {
      return NextResponse.json({ error: "Esta invitacion ya no esta activa" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Esta invitacion ha expirado" }, { status: 410 });
    }

    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return NextResponse.json({ error: "Esta invitacion ha alcanzado el limite de usos" }, { status: 410 });
    }

    // Check if user is already a member
    const { data: existingMember } = await serviceClient
      .from("household_members")
      .select("id")
      .eq("household_id", invite.household_id)
      .eq("user_id", internalUser.id)
      .single();

    if (existingMember) {
      // Already a member — just set active household and return success
      await serviceClient
        .from("users")
        .update({ active_household_id: invite.household_id })
        .eq("id", internalUser.id);

      const { data: household } = await serviceClient
        .from("households")
        .select("id, name")
        .eq("id", invite.household_id)
        .single();

      return NextResponse.json({
        success: true,
        household: household,
        message: "Ya eres miembro de este espacio",
      });
    }

    // Add user as member
    await serviceClient.from("household_members").insert({
      household_id: invite.household_id,
      user_id: internalUser.id,
      role: "member",
    });

    // Set as active household
    await serviceClient
      .from("users")
      .update({ active_household_id: invite.household_id })
      .eq("id", internalUser.id);

    // Increment use_count
    await serviceClient
      .from("household_invites")
      .update({ use_count: invite.use_count + 1 })
      .eq("id", invite.id);

    // Get household info to return
    const { data: household } = await serviceClient
      .from("households")
      .select("id, name")
      .eq("id", invite.household_id)
      .single();

    return NextResponse.json({
      success: true,
      household: household,
    });
  } catch (err) {
    console.error("Error joining household:", err);
    return NextResponse.json({ error: "Error al unirse al espacio" }, { status: 500 });
  }
}
