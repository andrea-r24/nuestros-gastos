"use client";

import { ArrowLeft, Bell, ShoppingCart, CreditCard, BarChart3, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
    id: number;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 1,
        icon: ShoppingCart,
        iconColor: "#22C55E",
        iconBg: "#22C55E18",
        title: "Nuevo gasto registrado",
        description: "Pamela agregó \"Wong quincena\" por S/ 189.90",
        time: "Hace 2 horas",
        unread: true,
    },
    {
        id: 2,
        icon: BarChart3,
        iconColor: "#F97316",
        iconBg: "#F9731618",
        title: "Alerta de presupuesto",
        description: "Has alcanzado el 80% del presupuesto mensual",
        time: "Hace 1 día",
        unread: true,
    },
    {
        id: 3,
        icon: CreditCard,
        iconColor: "#3B82F6",
        iconBg: "#3B82F618",
        title: "Gasto compartido",
        description: "Andrea dividió \"Alquiler\" contigo por S/ 450.00",
        time: "Hace 3 días",
        unread: false,
    },
    {
        id: 4,
        icon: Users,
        iconColor: "#A855F7",
        iconBg: "#A855F718",
        title: "Resumen semanal",
        description: "Esta semana gastaron S/ 520.40 entre los dos",
        time: "Hace 5 días",
        unread: false,
    },
];

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
                <span className="text-xs text-gray-400">
                    {MOCK_NOTIFICATIONS.filter((n) => n.unread).length} sin leer
                </span>
            </div>

            <div className="space-y-2.5">
                {MOCK_NOTIFICATIONS.map((n) => {
                    const Icon = n.icon;
                    return (
                        <div
                            key={n.id}
                            className={`bg-white rounded-[20px] shadow-sm px-4 py-3.5 flex items-start gap-3 transition-colors ${n.unread ? "border-l-[3px] border-[#22C55E]" : ""
                                }`}
                        >
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: n.iconBg }}
                            >
                                <Icon size={18} style={{ color: n.iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    {n.description}
                                </p>
                                <p className="text-[10px] text-gray-300 mt-1.5">{n.time}</p>
                            </div>
                            {n.unread && (
                                <div className="w-2 h-2 rounded-full bg-[#22C55E] mt-2 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
