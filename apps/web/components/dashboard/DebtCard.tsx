"use client";

import { formatCurrency } from "@/lib/utils";
import { Expense, Member } from "@/lib/queries";

interface Props {
  expenses: Expense[];
  members: Member[];
}

// Hardcoded por ahora — usuario actual. Se reemplaza con auth.
const CURRENT_USER_ID = 1;

export default function DebtCard({ expenses, members }: Props) {
  // Net balance: positivo = le deben, negativo = debe
  const netBalances = new Map<number, number>();
  for (const e of expenses) {
    const sharePerPerson = e.amount / e.shared_with.length;
    netBalances.set(e.paid_by, (netBalances.get(e.paid_by) ?? 0) + e.amount);
    for (const userId of e.shared_with) {
      netBalances.set(userId, (netBalances.get(userId) ?? 0) - sharePerPerson);
    }
  }

  const myNet = netBalances.get(CURRENT_USER_ID) ?? 0;
  const other = members.find((m) => m.user_id !== CURRENT_USER_ID);
  const otherName = other?.name ?? "Otro";
  const isPositive = myNet >= 0;

  return (
    <div
      className={`rounded-2xl shadow-sm p-4 ${
        isPositive ? "bg-[#4ECDC4]" : "bg-[#FF6B6B]"
      }`}
    >
      <p className="text-sm text-white/80">Tu balance</p>
      <p className="text-2xl font-bold text-white">
        {isPositive ? "Te deben " : "Debes "}
        {formatCurrency(Math.abs(myNet))}
      </p>
      <p className="text-xs text-white/70 mt-1">
        {isPositive
          ? `${otherName} te debe esta cantidad`
          : `Le debes a ${otherName} esta cantidad`}
      </p>
    </div>
  );
}
