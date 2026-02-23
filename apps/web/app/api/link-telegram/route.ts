import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Link a Telegram account to the current authenticated user.
 *
 * POST { code: string }
 * Validates the link code, sets the user's telegram_id,
 * and merges data if the telegram_id already belongs to another user.
 */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    // Get the authenticated user from the session
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch { /* read-only context */ }
        },
      },
    });

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Use service_role for all DB operations
    const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Validate the link code
    const { data: linkCode, error: codeError } = await serviceClient
      .from("link_codes")
      .select("code, telegram_id, name, expires_at, used")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError || !linkCode) {
      return NextResponse.json({ error: "Codigo no encontrado" }, { status: 400 });
    }

    if (linkCode.used) {
      return NextResponse.json({ error: "Este codigo ya fue utilizado" }, { status: 400 });
    }

    if (new Date(linkCode.expires_at) < new Date()) {
      return NextResponse.json({ error: "El codigo expiro. Escribe /link en el bot para obtener uno nuevo" }, { status: 400 });
    }

    // Mark code as used
    await serviceClient
      .from("link_codes")
      .update({ used: true })
      .eq("code", code.toUpperCase());

    // Get the current user's internal record
    const { data: currentUser } = await serviceClient
      .from("users")
      .select("id, telegram_id")
      .eq("supabase_auth_id", authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (currentUser.telegram_id) {
      return NextResponse.json({ error: "Ya tienes un Telegram vinculado" }, { status: 400 });
    }

    // Check if the telegram_id already belongs to another user
    const { data: existingTgUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("telegram_id", linkCode.telegram_id)
      .single();

    if (existingTgUser && existingTgUser.id !== currentUser.id) {
      // Merge the old Telegram-only user into the current Google user
      await serviceClient.rpc("merge_users", {
        old_user_id: existingTgUser.id,
        new_user_id: currentUser.id,
      });
    }

    // Set telegram_id on the current user
    await serviceClient
      .from("users")
      .update({ telegram_id: linkCode.telegram_id })
      .eq("id", currentUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Link Telegram error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
