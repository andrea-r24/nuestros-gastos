import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/** Generate a random 8-character invite code (no confusing chars) */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const { household_id } = await request.json();

    if (!household_id) {
      return NextResponse.json({ error: "household_id requerido" }, { status: 400 });
    }

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

    const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get internal user
    const { data: internalUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("supabase_auth_id", authUser.id)
      .single();

    if (!internalUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verify user is a member of this household
    const { data: membership } = await serviceClient
      .from("household_members")
      .select("role")
      .eq("household_id", household_id)
      .eq("user_id", internalUser.id)
      .eq("is_active", true)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No eres miembro de este espacio" }, { status: 403 });
    }

    // Generate a unique code (retry if collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await serviceClient
        .from("household_invites")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Create the invite
    const { data: invite, error } = await serviceClient
      .from("household_invites")
      .insert({
        household_id,
        code,
        created_by: internalUser.id,
      })
      .select()
      .single();

    if (error || !invite) {
      console.error("Error creating invite:", error);
      return NextResponse.json({ error: "No se pudo crear la invitacion" }, { status: 500 });
    }

    // Build the invite link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "https://nuestros-gastos.vercel.app";
    const link = `${baseUrl}/invite/${code}`;

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        code: invite.code,
        link,
        expires_at: invite.expires_at,
      },
    });
  } catch (err) {
    console.error("Error creating invite:", err);
    return NextResponse.json({ error: "Error al crear invitacion" }, { status: 500 });
  }
}
