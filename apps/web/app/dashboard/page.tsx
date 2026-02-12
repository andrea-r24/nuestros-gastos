"use client";

import { useState, useEffect } from "react";
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
    }
  }, [authLoading, householdId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
      </div>
    );
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
