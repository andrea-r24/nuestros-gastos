"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { getExpenses, Expense } from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";
import { getCategoryInfo } from "@/lib/categories";

/** Group expenses by date, returns sorted descending */
function groupByDate(expenses: Expense[]): { date: string; items: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
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
        <p className="text-sm font-display font-semibold text-gray-900">{formatCurrency(exp.amount)}</p>
        <p className="text-xs text-gray-400">{info.subName}</p>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const router = useRouter();
  const { householdId, loading: authLoading } = useActiveHousehold();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && householdId) {
      const now = new Date();
      getExpenses(householdId, now.getFullYear(), now.getMonth() + 1).then((exp) => {
        setExpenses(exp);
        setLoading(false);
      });
    }
  }, [authLoading, householdId]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
      </div>
    );
  }

  const groups = groupByDate(expenses);

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <h1 className="text-xl font-bold text-gray-900">Gastos recientes</h1>

      <div className="bg-white rounded-[24px] shadow-sm p-5">
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin gastos registrados</p>
        ) : (
          <div className="space-y-5">
            {groups.map(({ date, items }) => (
              <div key={date}>
                <p className="text-xs text-gray-400 font-medium capitalize tracking-wide mb-1">
                  {formatShortDate(date)}
                </p>
                <div className="divide-y divide-gray-100">
                  {items.map((exp) => (
                    <ExpenseRow key={exp.id} exp={exp} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Solo se guardan los gastos del último mes. Al iniciar un nuevo mes, este historial se limpia automáticamente.
        </p>
      </div>
    </div>
  );
}
