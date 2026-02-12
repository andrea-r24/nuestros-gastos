"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beaker } from "lucide-react";

export default function DevLoginPage() {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoMode = () => {
    localStorage.removeItem("telegram_id");
    localStorage.setItem("dev_mock", "1");
    router.push("/dashboard");
  };

  const handleLogin = async () => {
    if (!telegramId || !name) {
      setError("Por favor completa todos los campos");
      return;
    }

    const numTelegramId = parseInt(telegramId, 10);
    if (isNaN(numTelegramId)) {
      setError("Telegram ID debe ser un número");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the register-user API to create/get user
      const registerRes = await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: numTelegramId,
          first_name: name,
          last_name: "",
          username: "",
        }),
      });

      const registerData = await registerRes.json();

      if (registerData.user) {
        localStorage.setItem("telegram_id", String(registerData.user.telegram_id));
        router.push(registerData.isNewUser ? "/onboarding" : "/dashboard");
      } else {
        setError("Error al crear usuario: " + (registerData.error || "desconocido"));
      }
    } catch (err) {
      console.error("Dev login error:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F5F8] px-6">
      <div className="w-full max-w-md bg-white rounded-[24px] shadow-sm p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Dev Login</h1>
        <p className="text-sm text-gray-400 mb-6">
          Solo para desarrollo. Ingresa tu Telegram ID o usa el modo demo.
        </p>

        {/* Demo mode CTA */}
        <button
          onClick={handleDemoMode}
          className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-3.5 mb-6 hover:bg-[#16A34A] transition-colors"
        >
          <Beaker size={18} />
          Entrar en modo demo
        </button>

        <div className="relative flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">o con tu cuenta real</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram ID
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="123456789"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Usa @userinfobot en Telegram para obtener tu ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gray-900 text-white font-semibold rounded-xl py-3 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar al Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
