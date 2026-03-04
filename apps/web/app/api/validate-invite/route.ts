import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Validate an invite code and return household info.
 * Public endpoint — no auth required (anyone with a link should see it).
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Codigo requerido" }, { status: 400 });
    }

    // Use service_role to bypass RLS (public invite page needs to read households)
    const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: invite } = await serviceClient
      .from("household_invites")
      .select("household_id, is_active, expires_at, max_uses, use_count")
      .eq("code", code)
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

    // Get household name
    const { data: household } = await serviceClient
      .from("households")
      .select("name")
      .eq("id", invite.household_id)
      .single();

    return NextResponse.json({
      valid: true,
      household_name: household?.name ?? "Espacio",
    });
  } catch (err) {
    console.error("Error validating invite:", err);
    return NextResponse.json({ error: "Error al validar la invitacion" }, { status: 500 });
  }
}
