"use client";

import { useRouter } from "next/navigation";
import { LogOut, MessageCircle, Mail, Bell, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("telegram_id");
    localStorage.removeItem("dev_mock");
    router.push("/");
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
            <p className="text-xs text-gray-400 mt-0.5">
              Comparte tu ID para que te puedan agregar a un espacio
            </p>
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
          <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center">
                <MessageCircle size={18} className="text-[#0088cc]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Telegram</p>
                <p className="text-xs text-gray-400">Para registrar gastos por chat</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-full">
              Conectado
            </span>
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
