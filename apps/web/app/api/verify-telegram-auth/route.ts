import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

/**
 * Verifica la autenticidad del hash enviado por el Telegram Login Widget.
 * Algoritmo: https://core.telegram.org/widgets/login#checking-authorization
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hash, ...data } = body;

    if (!hash) {
      return NextResponse.json({ valid: false, error: "Missing hash" }, { status: 400 });
    }

    // 1. Crear data-check-string: clave=valor\n en orden alfabético
    const dataCheckString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join("\n");

    // 2. Clave secreta: SHA256(bot_token)
    const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();

    // 3. HMAC-SHA256 del data-check-string con la clave secreta
    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // 4. Comparar
    if (computedHash !== hash) {
      return NextResponse.json({ valid: false, error: "Invalid hash" }, { status: 403 });
    }

    // 5. Validar que la autenticación no sea antigua (ej: 24h máx)
    const authDate = parseInt(data.auth_date, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return NextResponse.json({ valid: false, error: "Auth expired" }, { status: 403 });
    }

    return NextResponse.json({ valid: true, telegram_id: data.id });
  } catch (error) {
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
