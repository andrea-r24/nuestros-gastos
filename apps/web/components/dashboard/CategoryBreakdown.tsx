"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Expense } from "@/lib/queries";
import { MacroCategory, getMacro, normalizeCategory } from "@/types/categories";
import { categoryHierarchy, type MacroCategoryKey } from "@/lib/categories";

interface Props {
  expenses: Expense[];
}

/** Aggregate expenses by macro category */
function buildMacroGroups(expenses: Expense[]) {
  const subMap = new Map<string, number>();
  for (const e of expenses) {
    const key = normalizeCategory(e.category);
    subMap.set(key, (subMap.get(key) ?? 0) + e.amount);
  }

  const total = Array.from(subMap.values()).reduce((s, v) => s + v, 0);

  const macroMap = new Map<string, { macro: MacroCategory; amount: number }>();

  for (const [subId, amount] of subMap) {
    const macro = getMacro(subId);
    if (!macroMap.has(macro.id)) {
      macroMap.set(macro.id, { macro, amount: 0 });
    }
    macroMap.get(macro.id)!.amount += amount;
  }

  return { groups: Array.from(macroMap.values()).sort((a, b) => b.amount - a.amount), total };
}

export default function CategoryBreakdown({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Categorías de gasto</h2>
        </div>
        <div className="bg-white rounded-[20px] shadow-sm p-5">
          <p className="text-sm text-gray-400 text-center py-4">Sin gastos este mes</p>
        </div>
      </div>
    );
  }

  const { groups, total } = buildMacroGroups(expenses);

  return (
    <div>
      {/* Section title OUTSIDE the card */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Categorías de gasto</h2>
        <Link
          href="/dashboard/categories"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-wide transition-colors"
        >
          VER MÁS
        </Link>
      </div>

      {/* Each category is a separate card */}
      <div className="space-y-2.5">
        {groups.map((g) => {
          const libMacro = categoryHierarchy[g.macro.id as MacroCategoryKey];
          const macroColor = libMacro?.color ?? g.macro.color;
          const MacroIcon = libMacro?.icon;
          const pct = total > 0 ? (g.amount / total) * 100 : 0;
          return (
            <div
              key={g.macro.id}
              className="bg-white rounded-[20px] shadow-sm px-4 py-3.5 flex items-center gap-3"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: macroColor + "18" }}
              >
                {MacroIcon && (
                  <MacroIcon size={18} style={{ color: macroColor }} />
                )}
              </div>

              {/* Name + pct */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {g.macro.label}
                </p>
                <p className="text-[10px] text-gray-400">
                  {pct.toFixed(0)}% del total
                </p>
              </div>

              {/* Amount + bar */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-sm font-display font-bold text-gray-900">
                  {formatCurrency(g.amount)}
                </span>
                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: macroColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
