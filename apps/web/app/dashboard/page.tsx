"use client";

import { useState, useEffect } from "react";
import BalanceCard from "@/components/dashboard/BalanceCard";
import DebtCard from "@/components/dashboard/DebtCard";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import FAB from "@/components/dashboard/FAB";
import {
  getExpenses,
  getHouseholdMembers,
  getHousehold,
  Expense,
  Member,
} from "@/lib/queries";

// Hardcoded por ahora — se reemplaza con el hogar de la sesión cuando hay auth
const HOUSEHOLD_ID = 1;

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const now = new Date();
    const [exp, mem, hh] = await Promise.all([
      getExpenses(HOUSEHOLD_ID, now.getFullYear(), now.getMonth() + 1),
      getHouseholdMembers(HOUSEHOLD_ID),
      getHousehold(HOUSEHOLD_ID),
    ]);
    setExpenses(exp);
    setMembers(mem);
    setBudget(hh?.monthly_budget ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-gray-400 text-sm py-8">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <BalanceCard expenses={expenses} members={members} budget={budget} />
      <DebtCard expenses={expenses} members={members} />
      <CategoryBreakdown expenses={expenses} />
      <RecentExpenses expenses={expenses} />
      <FAB members={members} onRefresh={fetchData} />
    </div>
  );
}
