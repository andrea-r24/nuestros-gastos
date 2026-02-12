"use client";

import { formatCurrency } from "@/lib/utils";
import { Expense, Member } from "@/lib/queries";
import { CheckCircle2 } from "lucide-react";

interface Props {
    expenses: Expense[];
    members: Member[];
}

export default function ContributionSection({ expenses, members }: Props) {
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    if (totalSpent === 0 || members.length === 0) return null;

    const paidByMap = new Map<number, number>();
    for (const e of expenses) {
        paidByMap.set(e.paid_by, (paidByMap.get(e.paid_by) ?? 0) + e.amount);
    }

    const perPerson = members.map((m) => ({
        name: m.name.split(" ")[0],
        paid: paidByMap.get(m.user_id) ?? 0,
        initial: m.name[0],
    }));

    // Check if contributions are balanced (within 5% tolerance)
    const avgPaid = totalSpent / members.length;
    const isBalanced = perPerson.every((p) => Math.abs(p.paid - avgPaid) < avgPaid * 0.05);

    const colors = ["#22C55E", "#EC4899", "#F97316", "#A855F7"];

    return (
        <div>
            {/* Section title OUTSIDE the card */}
            <h2 className="text-lg font-bold text-gray-900 mb-3">Contribución</h2>

            <div className="bg-white rounded-[24px] shadow-sm p-5">
                <div className="space-y-4">
                    {perPerson.map((m, i) => {
                        const pct = totalSpent > 0 ? (m.paid / totalSpent) * 100 : 0;
                        const color = colors[i % colors.length];
                        return (
                            <div key={m.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            style={{ backgroundColor: color }}
                                        >
                                            {m.initial}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                                    </div>
                                    <span className="text-sm font-display font-bold text-gray-900">
                                        {formatCurrency(m.paid)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Balance indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-gray-100">
                    {isBalanced ? (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-500">EN BALANCE</span>
                        </>
                    ) : (
                        <span className="text-xs font-medium text-gray-400">
                            Diferencia de {formatCurrency(Math.abs(perPerson[0]?.paid - (perPerson[1]?.paid ?? 0)))}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
