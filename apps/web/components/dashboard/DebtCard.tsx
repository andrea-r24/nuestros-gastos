"use client";

import { formatCurrency } from "@/lib/utils";
import { Expense, Member } from "@/lib/queries";
import { useAuth } from "@/lib/useAuth";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Props {
  expenses: Expense[];
  members: Member[];
}

export default function DebtCard({ expenses, members }: Props) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const netBalances = new Map<number, number>();
  for (const e of expenses) {
    const sharePerPerson = e.amount / e.shared_with.length;
    netBalances.set(e.paid_by, (netBalances.get(e.paid_by) ?? 0) + e.amount);
    for (const userId of e.shared_with) {
      netBalances.set(userId, (netBalances.get(userId) ?? 0) - sharePerPerson);
    }
  }

  const myNet = currentUserId ? (netBalances.get(currentUserId) ?? 0) : 0;
  const other = members.find((m) => m.user_id !== currentUserId);
  const otherName = other?.name?.split(" ")[0] ?? "Otro";
  const isPositive = myNet >= 0;

  if (Math.abs(myNet) < 0.01) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-lg">
          🎉
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Estás al día</p>
          <p className="text-xs text-gray-400">Sin deudas pendientes</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[24px] shadow-sm p-5 ${
        isPositive
          ? "bg-gradient-to-br from-[#22C55E] to-[#16A34A]"
          : "bg-gradient-to-br from-[#EC4899] to-[#BE185D]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          {isPositive ? (
            <ArrowDownLeft size={13} className="text-white" />
          ) : (
            <ArrowUpRight size={13} className="text-white" />
          )}
        </div>
        <p className="text-xs text-white/70 font-medium">Tu balance</p>
      </div>
      <p className="text-2xl font-black text-white mt-1">
        {formatCurrency(Math.abs(myNet))}
      </p>
      <p className="text-xs text-white/70 mt-1">
        {isPositive
          ? `${otherName} te debe esta cantidad`
          : `Le debes ${formatCurrency(Math.abs(myNet))} a ${otherName}`}
      </p>
    </div>
  );
}
