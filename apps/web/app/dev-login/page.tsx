"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Set telegram_id in localStorage
        localStorage.setItem("telegram_id", String(registerData.user.telegram_id));

        // Redirect to dashboard
        router.push("/dashboard");
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dev Login</h1>
        <p className="text-sm text-gray-500 mb-6">
          Solo para desarrollo. Ingresa manualmente tu Telegram ID.
        </p>

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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
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
            className="w-full bg-[#6C63FF] text-white font-semibold rounded-lg py-3 hover:bg-[#5A52D5] transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar al Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
