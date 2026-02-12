"use client";

import { formatCurrency } from "@/lib/utils";
import { Expense } from "@/lib/queries";

interface Props {
  expenses: Expense[];
  budget: number | null;
  monthLabel?: string;
}

export default function BalanceCard({ expenses, budget, monthLabel }: Props) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const effectiveBudget = budget ?? 0;
  const overBudget = effectiveBudget > 0 && totalSpent > effectiveBudget;
  const remaining = effectiveBudget - totalSpent;

  return (
    <div className="bg-white rounded-[24px] shadow-sm px-6 py-7">
      {/* Title — normal case, month in bold */}
      <p className="text-sm text-gray-400">
        Total de gastos {monthLabel && <span className="font-bold text-gray-500">{monthLabel}</span>}
      </p>

      {/* Hero metric */}
      <p className="text-4xl font-display font-bold text-gray-900 leading-none mt-2">
        {formatCurrency(totalSpent)}
      </p>

      {/* Budget row: remaining in gray + status capsule */}
      {effectiveBudget > 0 && (
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-gray-400">
            {formatCurrency(Math.abs(remaining))} {overBudget ? "excedido" : "restante"}
          </span>
          <span
            className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${overBudget
              ? "bg-[#EC4899]/10 text-[#EC4899]"
              : "bg-[#22C55E]/10 text-[#22C55E]"
              }`}
          >
            {overBudget ? "Fuera del presupuesto" : "Dentro del presupuesto"}
          </span>
        </div>
      )}
    </div>
  );
}
