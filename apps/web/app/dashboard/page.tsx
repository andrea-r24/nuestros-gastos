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
import { useActiveHousehold } from "@/lib/useAuth";

export default function DashboardPage() {
  const { householdId, user, loading: authLoading } = useActiveHousehold();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!householdId) return;

    const now = new Date();
    const [exp, mem, hh] = await Promise.all([
      getExpenses(householdId, now.getFullYear(), now.getMonth() + 1),
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
      <FAB
        members={members}
        onRefresh={fetchData}
        currentUserId={user?.id ?? 0}
        householdId={householdId ?? 0}
      />
    </div>
  );
}
