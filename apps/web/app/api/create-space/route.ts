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
    const { name, budget } = await request.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    // Authenticate user via cookies
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

    // Use service_role for all DB operations (bypasses RLS)
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

    // 1. Create household
    const parsedBudget = budget != null && budget !== "" ? Number(budget) : null;
    const { data: hh, error: hhError } = await serviceClient
      .from("households")
      .insert({ name: name.trim(), monthly_budget: parsedBudget })
      .select()
      .single();

    if (hhError || !hh) {
      console.error("Error creating household:", hhError);
      return NextResponse.json({ error: "No se pudo crear el espacio" }, { status: 500 });
    }

    // 2. Add user as owner
    const { error: memberError } = await serviceClient
      .from("household_members")
      .insert({
        household_id: hh.id,
        user_id: internalUser.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json({ error: "No se pudo agregar como miembro" }, { status: 500 });
    }

    // 3. Set as active household
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ active_household_id: hh.id })
      .eq("id", internalUser.id);

    if (updateError) {
      console.error("Error setting active household:", updateError);
      return NextResponse.json({ error: "No se pudo activar el espacio" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      household: {
        id: hh.id,
        name: hh.name,
        monthly_budget: hh.monthly_budget != null ? Number(hh.monthly_budget) : null,
      },
    });
  } catch (err) {
    console.error("Error creating space:", err);
    return NextResponse.json({ error: "Error al crear el espacio" }, { status: 500 });
  }
}
