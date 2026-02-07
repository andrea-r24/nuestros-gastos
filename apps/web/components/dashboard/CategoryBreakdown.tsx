"use client";

import DonutChart from "@/components/charts/DonutChart";
import { formatCurrency, categoryHex, categoryType } from "@/lib/utils";
import { Expense } from "@/lib/queries";

interface Props {
  expenses: Expense[];
}

export default function CategoryBreakdown({ expenses }: Props) {
  // Derivar totales por categoría desde los gastos
  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + e.amount);
  }
  const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
    name,
    amount,
  }));

  const TOTAL = categories.reduce((s, c) => s + c.amount, 0);

  const chartData = categories.map((c) => ({
    name: c.name,
    value: c.amount,
    fill: categoryHex(c.name),
  }));

  const sorted = [...categories].sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
        Por categoría
      </h2>

      <DonutChart data={chartData} />

      <ul className="mt-4 space-y-2.5">
        {sorted.map((c) => {
          const pct = (c.amount / TOTAL) * 100;
          const type = categoryType(c.name);
          return (
            <li key={c.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryHex(c.name) }}
                />
                <span className="text-sm text-gray-700">{c.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    type === "fixed"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-[#6C63FF]/10 text-[#6C63FF]"
                  }`}
                >
                  {type}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(c.amount)}{" "}
                <span className="text-gray-400 font-normal">
                  ({pct.toFixed(0)}%)
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
