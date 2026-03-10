"use client";

import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-4">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors self-start"
            >
                <ArrowLeft size={16} />
                Volver
            </button>

            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Notificaciones</h1>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Bell size={28} className="text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">
                    No tienes notificaciones
                </p>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                    Aqui apareceran las alertas de gastos, presupuesto y actividad de tu espacio.
                </p>
            </div>
        </div>
    );
}
