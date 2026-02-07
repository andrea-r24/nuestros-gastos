"use client";

import { formatCurrency, categoryHex, categoryType, formatShortDate } from "@/lib/utils";
import { Expense } from "@/lib/queries";

interface Props {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: Props) {
  const recent = expenses.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
        Últimos gastos
      </h2>

      <ul className="space-y-3">
        {recent.map((exp) => {
          const type = categoryType(exp.category);
          return (
            <li key={exp.id} className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Category icon circle */}
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: categoryHex(exp.category) }}
                >
                  {exp.category[0]}
                </span>

                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      {exp.description}
                    </p>
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
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatShortDate(exp.expense_date)} · {exp.payer_name} pagó
                  </p>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {formatCurrency(exp.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
