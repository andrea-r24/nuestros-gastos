"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Expense } from "@/lib/queries";
import { getCategoryInfo } from "@/lib/categories";

interface Props {
  expenses: Expense[];
}

function ExpenseRow({ exp }: { exp: Expense }) {
  const info = getCategoryInfo(exp.category);
  const Icon = info.subIcon;
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: info.macroColor + "20" }}
      >
        <Icon size={18} style={{ color: info.macroColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {exp.description || info.subName}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Añadido por {exp.payer_name}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-display font-bold text-gray-900">{formatCurrency(exp.amount)}</p>
        <p className="text-xs text-gray-400">{info.subName}</p>
      </div>
    </div>
  );
}

export default function RecentExpenses({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Gastos recientes</h2>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm p-5">
          <p className="text-sm text-gray-400 text-center py-4">Sin gastos registrados</p>
        </div>
      </div>
    );
  }

  const recent = expenses.slice(0, 3);

  return (
    <div>
      {/* Section title OUTSIDE the card */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Gastos recientes</h2>
        {expenses.length > 3 && (
          <Link
            href="/dashboard/expenses"
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-wide transition-colors"
          >
            VER MÁS
          </Link>
        )}
      </div>

      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <div className="divide-y divide-gray-100">
          {recent.map((exp) => (
            <ExpenseRow key={exp.id} exp={exp} />
          ))}
        </div>
      </div>
    </div>
  );
}
