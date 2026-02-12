"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  getExpenses,
  getHouseholdMembers,
  getHousehold,
  Expense,
  Member,
} from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";
import {
  categoryHierarchy,
  getCategoryInfo,
  type MacroCategoryKey,
} from "@/lib/categories";
import {
  getMacro,
  normalizeCategory,
  type MacroCategory,
} from "@/types/categories";

// ── Period helpers ──────────────────────────────────────────────────────────

type Period = "current" | "last" | "last3";

function getMonthRanges(period: Period) {
  const now = new Date();
  const cur = { year: now.getFullYear(), month: now.getMonth() + 1 };

  if (period === "current") return [cur];
  if (period === "last") {
    const m = cur.month === 1 ? 12 : cur.month - 1;
    const y = cur.month === 1 ? cur.year - 1 : cur.year;
    return [{ year: y, month: m }];
  }
  // last3
  const months = [];
  for (let i = 0; i < 3; i++) {
    let m = cur.month - i;
    let y = cur.year;
    if (m <= 0) { m += 12; y -= 1; }
    months.push({ year: y, month: m });
  }
  return months;
}

function getPrevMonthRanges(period: Period) {
  const ranges = getMonthRanges(period);
  return ranges.map((r) => {
    const m = r.month === 1 ? 12 : r.month - 1;
    const y = r.month === 1 ? r.year - 1 : r.year;
    return { year: y, month: m };
  });
}

// ── Weekly aggregation for trend chart ──────────────────────────────────────

function weeklyTotals(expenses: Expense[]): number[] {
  const weeks = [0, 0, 0, 0];
  for (const e of expenses) {
    const day = parseInt(e.expense_date.slice(8, 10), 10);
    const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
    weeks[weekIdx] += e.amount;
  }
  return weeks;
}

// ── Category grouping ───────────────────────────────────────────────────────

function buildMacroGroups(expenses: Expense[]) {
  const subMap = new Map<string, number>();
  for (const e of expenses) {
    const key = normalizeCategory(e.category);
    subMap.set(key, (subMap.get(key) ?? 0) + e.amount);
  }
  const total = Array.from(subMap.values()).reduce((s, v) => s + v, 0);

  const macroMap = new Map<
    string,
    { macro: MacroCategory; amount: number }
  >();

  for (const [subId, amount] of subMap) {
    const macro = getMacro(subId);
    if (!macroMap.has(macro.id)) macroMap.set(macro.id, { macro, amount: 0 });
    macroMap.get(macro.id)!.amount += amount;
  }

  return {
    groups: Array.from(macroMap.values()).sort((a, b) => b.amount - a.amount),
    total,
  };
}

// ── Custom tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-display font-bold" style={{ color: p.color }}>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Main component ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export default function InsightsPage() {
  const { householdId, loading: authLoading } = useActiveHousehold();
  const now = new Date();

  const [period, setPeriod] = useState<Period>("current");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && householdId) {
      setLoading(true);
      const ranges = getMonthRanges(period);
      const prevRanges = getPrevMonthRanges(period);

      const expPromises = ranges.map((r) =>
        getExpenses(householdId, r.year, r.month)
      );
      const prevPromises = prevRanges.map((r) =>
        getExpenses(householdId, r.year, r.month)
      );

      Promise.all([
        Promise.all(expPromises),
        Promise.all(prevPromises),
        getHouseholdMembers(householdId),
        getHousehold(householdId),
      ]).then(([expArrays, prevArrays, mem, hh]) => {
        setExpenses(expArrays.flat());
        setPrevExpenses(prevArrays.flat());
        setMembers(mem);
        setBudget(hh?.monthly_budget ?? null);
        setLoading(false);
      });
    }
  }, [authLoading, householdId, period]);

  // ── Derived data ────────────────────────────────────────────────────────

  const total = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const prevTotal = useMemo(
    () => prevExpenses.reduce((s, e) => s + e.amount, 0),
    [prevExpenses]
  );

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = period === "current" ? now.getDate() : daysInMonth;
  const daysRemaining = period === "current" ? daysInMonth - now.getDate() : 0;
  const avgPerDay = daysElapsed > 0 ? total / daysElapsed : 0;

  const diff = prevTotal - total;
  const isLess = diff >= 0;

  const { groups: catGroups, total: catTotal } = useMemo(
    () => buildMacroGroups(expenses),
    [expenses]
  );

  // ── Trend chart data ────────────────────────────────────────────────────

  const trendData = useMemo(() => {
    const curWeeks = weeklyTotals(expenses);
    const prevWeeks = weeklyTotals(prevExpenses);
    return curWeeks.map((val, i) => ({
      name: `SEMANA ${i + 1}`,
      actual: val,
      anterior: prevWeeks[i],
    }));
  }, [expenses, prevExpenses]);

  // ── Budget data ─────────────────────────────────────────────────────────

  const effectiveBudget = budget ?? 0;
  const budgetRemaining = effectiveBudget - total;
  const budgetPct =
    effectiveBudget > 0 ? Math.min((total / effectiveBudget) * 100, 100) : 0;

  // ── Loading ─────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-gray-400 text-sm py-8">Cargando…</p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── Render ────────────────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-5">
      {/* ── Period tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {(
          [
            ["current", "Este mes"],
            ["last", "Último mes"],
            ["last3", "Últimos 3 meses"],
          ] as [Period, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${period === key
              ? "bg-[#22C55E] text-white"
              : "bg-white text-gray-500 border border-gray-200"
              }`}
          >
            {label}
          </button>
        ))}
        {/* calendar button hidden until implemented */}
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[24px] shadow-sm p-5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">
            TOTAL COMPARTIDO
          </p>
          <p className="text-2xl font-display font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
          {prevTotal > 0 && (
            <p
              className={`text-[10px] font-semibold mt-1.5 flex items-center gap-1 ${isLess ? "text-[#22C55E]" : "text-[#EC4899]"
                }`}
            >
              <span className="inline-block">»</span>
              {isLess
                ? `S/ ${Math.round(diff).toLocaleString()} menos que el último mes`
                : `S/ ${Math.round(Math.abs(diff)).toLocaleString()} más que el último mes`}
            </p>
          )}
        </div>
        <div className="bg-white rounded-[24px] shadow-sm p-5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">
            PROMEDIO / DÍA
          </p>
          <p className="text-2xl font-display font-bold text-gray-900">
            {formatCurrency(avgPerDay)}
          </p>
          <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
            <span className="inline-block">⏱</span>
            {daysRemaining > 0
              ? `${daysRemaining} días restantes en el ciclo`
              : `en ${daysElapsed} días`}
          </p>
        </div>
      </div>

      {/* ── Tendencias de gasto ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Tendencias de gasto
          </h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-700">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              ACTUAL
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-300">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              ANTERIOR
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm p-4">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F3F4F6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#9CA3AF" }}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="anterior"
                stroke="#E5E7EB"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#22C55E"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#22C55E", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── En qué gastamos el dinero ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            En qué gastamos el dinero
          </h2>
          <Link
            href="/dashboard/categories"
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-wide transition-colors"
          >
            VER MÁS
          </Link>
        </div>

        <div className="space-y-2.5">
          {catGroups.length === 0 ? (
            <div className="bg-white rounded-[20px] shadow-sm p-5">
              <p className="text-sm text-gray-400 text-center">
                Sin gastos este período
              </p>
            </div>
          ) : (
            catGroups.map((g) => {
              const libMacro =
                categoryHierarchy[g.macro.id as MacroCategoryKey];
              const macroColor = libMacro?.color ?? g.macro.color;
              const MacroIcon = libMacro?.icon;
              const pct =
                catTotal > 0 ? (g.amount / catTotal) * 100 : 0;
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
                      {pct.toFixed(0)}% of total
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
            })
          )}
        </div>
      </div>

      {/* ── Presupuesto ──────────────────────────────────────────────────── */}
      {effectiveBudget > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Presupuesto</h2>

          <div className="bg-white rounded-[24px] shadow-sm p-5">
            {/* Header row */}
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-gray-500">Meta mensual</span>
              <div>
                <span className="text-lg font-display font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
                <span className="text-sm font-display font-normal text-gray-400">
                  {" "}
                  / {formatCurrency(effectiveBudget)}
                </span>
              </div>
            </div>

            {/* Multi-color progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
              {catGroups.map((g) => {
                const libMacro =
                  categoryHierarchy[g.macro.id as MacroCategoryKey];
                const macroColor = libMacro?.color ?? g.macro.color;
                const segPct =
                  effectiveBudget > 0
                    ? (g.amount / effectiveBudget) * 100
                    : 0;
                return (
                  <div
                    key={g.macro.id}
                    className="h-2.5 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${Math.min(segPct, 100)}%`,
                      backgroundColor: macroColor,
                    }}
                  />
                );
              })}
            </div>

            {/* Status text */}
            <p className="text-xs mt-3 flex items-center gap-1">
              {budgetRemaining >= 0 ? (
                <>
                  <CheckCircle2 size={13} className="text-[#22C55E]" />
                  <span className="text-[#22C55E] font-semibold">
                    Estamos {formatCurrency(budgetRemaining)} por debajo del
                    presupuesto
                  </span>
                </>
              ) : (
                <span className="text-[#EC4899] font-semibold">
                  Excedido por {formatCurrency(Math.abs(budgetRemaining))}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
