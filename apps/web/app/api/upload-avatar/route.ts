import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const BUCKET_NAME = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Upload a profile avatar image.
 *
 * POST FormData { file: File }
 * Uploads the file to Supabase Storage, updates the user's avatar_url.
 */
export async function POST(req: NextRequest) {
  try {
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

    // Parse the uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envio archivo" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo es muy grande (max 2MB)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imagenes" }, { status: 400 });
    }

    // Use service_role for storage and DB operations
    const serviceClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get internal user ID
    const { data: currentUser } = await serviceClient
      .from("users")
      .select("id, avatar_url")
      .eq("supabase_auth_id", authUser.id)
      .single();

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Create unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${currentUser.id}_${Date.now()}.${ext}`;

    // Delete old avatar if exists
    if (currentUser.avatar_url) {
      const oldPath = currentUser.avatar_url.split(`/${BUCKET_NAME}/`).pop();
      if (oldPath) {
        await serviceClient.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = serviceClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update user avatar_url
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", currentUser.id);

    if (updateError) {
      console.error("Update avatar_url error:", updateError);
      return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl });
  } catch (error) {
    console.error("Upload avatar error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
