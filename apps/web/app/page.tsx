"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Se configura en .env → NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Home() {
  const router = useRouter();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BOT_USERNAME || !widgetRef.current) return;
    const container = widgetRef.current;

    // Callback global que el widget de Telegram invoca tras autenticación exitosa.
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        // 1. Verify Telegram auth hash
        const verifyRes = await fetch("/api/verify-telegram-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          alert("Error de autenticación: " + (verifyData.error || "hash inválido"));
          return;
        }

        // 2. Auto-register or get existing user
        const registerRes = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
          }),
        });
        const registerData = await registerRes.json();

        if (registerData.user) {
          localStorage.setItem("telegram_id", String(registerData.user.telegram_id));
          router.push("/dashboard");
        } else {
          alert("Error al registrar usuario");
        }
      } catch (error) {
        console.error("Auth error:", error);
        alert("Error al verificar la autenticación");
      }
    };

    const script = document.createElement("script");
    script.src = "https://core.telegram.org/js/telegram-widget.js?4";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth");
    script.setAttribute("data-request-write-access", "");
    script.async = true;
    container.appendChild(script);

    return () => {
      delete (window as any).onTelegramAuth;
      container.removeChild(script);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-[#6C63FF] flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-md">
        N
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        NuestrosGastos
      </h1>
      <p className="text-gray-500 mb-10">
        Gastos compartidos, sin estrés.
      </p>

      {BOT_USERNAME ? (
        /* Telegram Login Widget — renderiza su propio botón */
        <div ref={widgetRef} className="flex justify-center" />
      ) : (
        /* Fallback: sin bot configurado, acceso directo al dashboard */
        <Link
          href="/dashboard"
          className="bg-[#6C63FF] text-white px-8 py-3 rounded-full text-lg font-semibold shadow-md hover:bg-[#5A52D5] transition-colors w-full max-w-xs text-center"
        >
          Entrar al Dashboard
        </Link>
      )}
    </div>
  );
}
