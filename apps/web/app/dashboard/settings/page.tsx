"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, MessageCircle, Mail, Bell, Trash2, Link2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { createClient } from "@/lib/supabase-browser";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [linkCode, setLinkCode] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("dev_mock");
    router.push("/");
  };

  const handleLinkTelegram = async () => {
    if (!linkCode.trim()) return;
    setLinkLoading(true);
    setLinkError(null);

    try {
      const res = await fetch("/api/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: linkCode.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setLinkError(data.error || "Error al vincular");
        return;
      }

      setLinkSuccess(true);
      setLinkCode("");
      // Reload to refresh user data
      window.location.reload();
    } catch {
      setLinkError("Error de conexion");
    } finally {
      setLinkLoading(false);
    }
  };

  const name = user?.name ?? "...";
  const firstName = name.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>

      {/* Account card */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <h2 className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
          Mi cuenta
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-xl font-black">
            {firstName[0]}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{name}</p>
            {user?.telegram_id && (
              <p className="text-xs text-gray-400 mt-0.5">
                Telegram ID:{" "}
                <span className="font-mono text-gray-600">{user.telegram_id}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connections card */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <h2 className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
          Conexiones
        </h2>
        <ul className="space-y-3">
          {/* Telegram */}
          <li className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-[#0088cc]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Telegram</p>
                  <p className="text-xs text-gray-400">Para registrar gastos por chat</p>
                </div>
              </div>
              {user?.telegram_id ? (
                <span className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full">
                  Conectado
                </span>
              ) : (
                <button
                  onClick={() => setLinkError(null)}
                  className="text-xs font-semibold text-[#0088cc] bg-[#0088cc]/10 px-2.5 py-1 rounded-full"
                >
                  Vincular
                </button>
              )}
            </div>

            {/* Telegram linking form (shown when not connected) */}
            {!user?.telegram_id && !linkSuccess && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>1. Abre nuestro bot en Telegram{BOT_USERNAME ? `: @${BOT_USERNAME}` : ""}</p>
                  <p>2. Escribe <code className="bg-white px-1.5 py-0.5 rounded text-gray-700 font-mono">/link</code></p>
                  <p>3. El bot te dara un codigo de 6 caracteres</p>
                  <p>4. Ingresalo aqui:</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#0088cc]"
                  />
                  <button
                    onClick={handleLinkTelegram}
                    disabled={linkLoading || linkCode.length < 6}
                    className="px-4 py-2 bg-[#0088cc] text-white text-sm font-semibold rounded-xl disabled:opacity-40"
                  >
                    {linkLoading ? "..." : "Vincular"}
                  </button>
                </div>
                {linkError && (
                  <p className="text-xs text-red-500">{linkError}</p>
                )}
              </div>
            )}
          </li>

          {/* Gmail */}
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EA4335]/10 flex items-center justify-center">
                <Mail size={18} className="text-[#EA4335]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Gmail</p>
                <p className="text-xs text-gray-400">
                  Importar gastos de notificaciones bancarias
                </p>
              </div>
            </div>
            <button
              disabled
              className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full cursor-not-allowed"
            >
              Proximamente
            </button>
          </li>
        </ul>
      </div>

      {/* Notifications card */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <h2 className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
          Notificaciones
        </h2>
        <ul className="space-y-3">
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Bell size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Resumen semanal</p>
                <p className="text-xs text-gray-400">Recibe un resumen por Telegram</p>
              </div>
            </div>
            <span className="text-xs text-gray-300 bg-gray-100 px-2.5 py-1 rounded-full">
              Proximamente
            </span>
          </li>
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Bell size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Alertas de presupuesto</p>
                <p className="text-xs text-gray-400">Cuando alcances el 80% del limite</p>
              </div>
            </div>
            <span className="text-xs text-gray-300 bg-gray-100 px-2.5 py-1 rounded-full">
              Proximamente
            </span>
          </li>
        </ul>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <h2 className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
          Zona peligrosa
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesion
          </button>
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 bg-[#EC4899]/5 text-[#EC4899]/40 font-semibold rounded-xl py-3 text-sm cursor-not-allowed"
          >
            <Trash2 size={16} />
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
