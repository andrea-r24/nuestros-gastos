"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import DonutChart from "@/components/charts/DonutChart";
import { formatCurrency } from "@/lib/utils";
import { getExpenses, Expense } from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";
import { MacroCategory, getMacro, getSubCategory, normalizeCategory } from "@/types/categories";
import { categoryHierarchy, getCategoryInfo, type MacroCategoryKey } from "@/lib/categories";

type Period = "current" | "last" | "last3";
const PERIOD_LABELS: { key: Period; label: string }[] = [
    { key: "current", label: "Este mes" },
    { key: "last", label: "Último mes" },
    { key: "last3", label: "Últimos 3 meses" },
];

/** Aggregate expenses by normalized sub-category, then group under macro. */
function buildMacroGroups(expenses: Expense[]) {
    const subMap = new Map<string, number>();
    for (const e of expenses) {
        const key = normalizeCategory(e.category);
        subMap.set(key, (subMap.get(key) ?? 0) + e.amount);
    }

    const total = Array.from(subMap.values()).reduce((s, v) => s + v, 0);

    const macroMap = new Map<string, { macro: MacroCategory; amount: number; subs: { id: string; label: string; amount: number; pct: number }[] }>();

    for (const [subId, amount] of subMap) {
        const macro = getMacro(subId);
        if (!macroMap.has(macro.id)) {
            macroMap.set(macro.id, { macro, amount: 0, subs: [] });
        }
        const entry = macroMap.get(macro.id)!;
        entry.amount += amount;
        const sub = getSubCategory(subId);
        entry.subs.push({ id: subId, label: sub.label, amount, pct: total > 0 ? (amount / total) * 100 : 0 });
    }

    return { groups: Array.from(macroMap.values()).sort((a, b) => b.amount - a.amount), total };
}

function MacroIcon({ macroId, size = 18 }: { macroId: string; size?: number }) {
    const macro = categoryHierarchy[macroId as MacroCategoryKey];
    if (!macro) return null;
    const Icon = macro.icon;
    return <Icon size={size} style={{ color: macro.color }} />;
}

function SubIcon({ subId, size = 14 }: { subId: string; size?: number }) {
    const info = getCategoryInfo(subId);
    const Icon = info.subIcon;
    return <Icon size={size} style={{ color: info.macroColor }} />;
}

function getMonthRange(offset: number) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - offset, 1);
}

export default function CategoriesPage() {
    const router = useRouter();
    const { householdId, loading: authLoading } = useActiveHousehold();
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("current");

    useEffect(() => {
        if (!authLoading && householdId) {
            // Fetch 3 months of data
            const months = [0, 1, 2].map((offset) => {
                const d = getMonthRange(offset);
                return getExpenses(householdId, d.getFullYear(), d.getMonth() + 1);
            });
            Promise.all(months).then((arrays) => {
                setAllExpenses(arrays.flat());
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

    // Filter by period
    const filtered = (() => {
        const now = new Date();
        const cur = new Date(now.getFullYear(), now.getMonth(), 1);
        switch (period) {
            case "current":
                return allExpenses.filter((e) => {
                    const d = new Date(e.expense_date + "T12:00:00");
                    return d >= cur;
                });
            case "last": {
                const prev = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
                return allExpenses.filter((e) => {
                    const d = new Date(e.expense_date + "T12:00:00");
                    return d >= prev && d < cur;
                });
            }
            case "last3":
                return allExpenses;
        }
    })();

    const { groups, total } = buildMacroGroups(filtered);

    const chartData = groups.map((g) => {
        const lib = categoryHierarchy[g.macro.id as MacroCategoryKey];
        return {
            name: g.macro.label,
            value: g.amount,
            fill: lib?.color ?? g.macro.color,
        };
    });

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

            <h1 className="text-xl font-bold text-gray-900">Categorías de gasto</h1>

            {/* Period tabs */}
            <div className="flex gap-2">
                {PERIOD_LABELS.map(({ key, label }) => (
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
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white rounded-[24px] shadow-sm p-5">
                    <p className="text-sm text-gray-400 text-center py-4">Sin gastos en este periodo</p>
                </div>
            ) : (
                <>
                    {/* Donut chart */}
                    <div className="bg-white rounded-[24px] shadow-sm p-5">
                        <DonutChart data={chartData} />
                    </div>

                    {/* Category list with progress bars */}
                    <div className="bg-white rounded-[24px] shadow-sm p-5">
                        <div className="space-y-5">
                            {groups.map((g) => {
                                const macroPct = total > 0 ? (g.amount / total) * 100 : 0;
                                const libMacro = categoryHierarchy[g.macro.id as MacroCategoryKey];
                                const macroColor = libMacro?.color ?? g.macro.color;
                                return (
                                    <div key={g.macro.id}>
                                        {/* Macro row */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: macroColor + "20" }}
                                                >
                                                    <MacroIcon macroId={g.macro.id} size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-gray-900">{g.macro.label}</span>
                                                    <span className="text-xs text-gray-400 ml-1.5">{macroPct.toFixed(0)}% del total</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-display font-bold text-gray-900">{formatCurrency(g.amount)}</span>
                                        </div>
                                        {/* Sub-categories */}
                                        {g.subs.sort((a, b) => b.amount - a.amount).map((s) => (
                                            <div key={s.id} className="mb-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-600">{s.label}</span>
                                                    </div>
                                                    <span className="text-xs font-display font-semibold text-gray-700">
                                                        {formatCurrency(s.amount)}
                                                    </span>
                                                </div>
                                                {/* Sub progress bar */}
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{ width: `${s.pct}%`, backgroundColor: macroColor }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
