"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Link2, ArrowRight } from "lucide-react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import ContributionSection from "@/components/dashboard/ContributionSection";
import {
  getExpenses,
  getHouseholdMembers,
  getHousehold,
  Expense,
  Member,
} from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function EmptyDashboard() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch("/api/join-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Error al unirse");
        return;
      }
      window.location.reload();
    } catch {
      setJoinError("Error de conexion");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
            <Home size={28} className="text-[#22C55E]" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Aun no tienes un espacio
          </h2>
          <p className="text-sm text-gray-400">
            Crea uno nuevo o unete a uno existente para empezar a registrar gastos.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => router.push("/onboarding")}
            className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base hover:bg-[#16A34A] transition-colors"
          >
            <Home size={18} />
            Crear espacio
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-[#EC4899]" />
            <h3 className="text-sm font-bold text-gray-900">Unirme con codigo</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABCD1234"
              maxLength={8}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-[#EC4899]"
            />
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joining}
              className="bg-[#EC4899] text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-50 hover:bg-[#DB2777] transition-colors whitespace-nowrap"
            >
              {joining ? "..." : "Unirme"}
            </button>
          </div>
          {joinError && (
            <p className="text-xs text-[#EC4899] mt-2">{joinError}</p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Si te enviaron un enlace de invitacion, abrelo directamente en tu navegador.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { householdId, user, loading: authLoading } = useActiveHousehold();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const fetchData = async () => {
    if (!householdId) return;
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const [exp, mem, hh] = await Promise.all([
      getExpenses(householdId, y, m),
      getHouseholdMembers(householdId),
      getHousehold(householdId),
    ]);
    setExpenses(exp);
    setMembers(mem);
    setBudget(hh?.monthly_budget ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && householdId) {
      fetchData();
    } else if (!authLoading && !householdId) {
      setLoading(false);
    }
  }, [authLoading, householdId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
      </div>
    );
  }

  // No household — show empty state
  if (!householdId) {
    return <EmptyDashboard />;
  }

  return (
    <div className="flex flex-col gap-6">
      <BalanceCard expenses={expenses} budget={budget} monthLabel={currentMonthLabel} />
      <CategoryBreakdown expenses={expenses} />
      <RecentExpenses expenses={expenses} />
      <ContributionSection expenses={expenses} members={members} />
    </div>
  );
}
