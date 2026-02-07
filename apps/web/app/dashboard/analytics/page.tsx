"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryHex, formatCurrency, formatMonthYear } from "@/lib/utils";
import { getExpenses, Expense } from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";

export default function AnalyticsPage() {
  const { householdId, loading: authLoading } = useActiveHousehold();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && householdId) {
      setExpenses([]);
      getExpenses(householdId, year, month).then((exp) => {
        setExpenses(exp);
        setLoading(false);
      });
    }
  }, [authLoading, householdId, year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <p className="text-center text-gray-400 text-sm py-8">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header + date badge */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1">
            {formatMonthYear(new Date(year, month - 1, 1))}
          </span>
          <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Bar chart card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Gasto por categoría
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={categoryData}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={65}
            />
            <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Total"]}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {categoryData.map((entry, i) => (
                <Cell key={i} fill={categoryHex(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Resumen
        </h2>
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-gray-400">Total gastado</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(categoryData.reduce((s, d) => s + d.value, 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Categorías</p>
            <p className="text-lg font-bold text-gray-900">
              {categoryData.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
