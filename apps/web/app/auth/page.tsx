"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "error";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("Link inválido. Escribe /login en el bot para obtener uno nuevo.");
      setStatus("error");
      return;
    }

    async function authenticate() {
      try {
        const authRes = await fetch("/api/bot-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const authData = await authRes.json();

        if (!authData.valid) {
          setErrorMsg(authData.error ?? "Token inválido");
          setStatus("error");
          return;
        }

        const registerRes = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: authData.telegram_id,
            first_name: authData.name,
          }),
        });
        const registerData = await registerRes.json();

        if (!registerData.user) {
          setErrorMsg("No se pudo registrar el usuario. Intenta de nuevo.");
          setStatus("error");
          return;
        }

        localStorage.setItem("telegram_id", String(registerData.user.telegram_id));
        router.push(registerData.isNewUser ? "/onboarding" : "/dashboard");
      } catch {
        setErrorMsg("Error de conexión. Intenta de nuevo.");
        setStatus("error");
      }
    }

    authenticate();
  }, [router, searchParams]);

  return (
    <div className="bg-white rounded-[28px] shadow-lg p-8 max-w-sm w-full text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-[#22C55E] to-[#EC4899] rounded-2xl flex items-center justify-center mx-auto mb-6 text-white font-black text-2xl">
        N
      </div>

      {status === "loading" && (
        <>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Verificando acceso…</h1>
          <p className="text-sm text-gray-400">Un momento, estamos validando tu link.</p>
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
          <a
            href="/"
            className="inline-block w-full bg-[#22C55E] text-white font-bold py-3 rounded-2xl text-sm"
          >
            Volver al inicio
          </a>
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center px-6">
      <Suspense fallback={
        <div className="bg-white rounded-[28px] shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}
