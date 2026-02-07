"use client";

import { formatCurrency, formatMonthYear } from "@/lib/utils";
import { Expense, Member } from "@/lib/queries";

interface Props {
  expenses: Expense[];
  members: Member[];
  budget: number | null;
}

export default function BalanceCard({ expenses, members, budget }: Props) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const paidByMap = new Map<number, number>();
  for (const e of expenses) {
    paidByMap.set(e.paid_by, (paidByMap.get(e.paid_by) ?? 0) + e.amount);
  }
  const perPerson = members.map((m) => ({
    name: m.name,
    paid: paidByMap.get(m.user_id) ?? 0,
  }));

  const effectiveBudget = budget ?? 0;
  const pct = effectiveBudget > 0 ? Math.min((totalSpent / effectiveBudget) * 100, 100) : 0;
  const overBudget = effectiveBudget > 0 && totalSpent > effectiveBudget;
  const remaining = effectiveBudget - totalSpent;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      {/* Header */}
      <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-1">
        Presupuesto {formatMonthYear(new Date(2026, 0))}
      </h2>

      {/* Total + budget */}
      <p className="text-3xl font-bold text-gray-900">
        {formatCurrency(totalSpent)}
        <span className="text-sm font-normal text-gray-400 ml-2">
          / {formatCurrency(effectiveBudget)}
        </span>
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
        <div
          className={`h-2.5 rounded-full transition-all ${
            overBudget ? "bg-[#FF6B6B]" : "bg-[#6C63FF]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={`text-xs mt-1 ${
          overBudget ? "text-[#FF6B6B]" : "text-gray-400"
        }`}
      >
        {overBudget
          ? "Presupuesto excedido"
          : `${formatCurrency(remaining)} restantes`}
      </p>

      {/* Per-person paid row */}
      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
        {perPerson.map((m) => (
          <div key={m.name} className="text-center">
            <p className="text-xs text-gray-400">{m.name} pagó</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatCurrency(m.paid)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
