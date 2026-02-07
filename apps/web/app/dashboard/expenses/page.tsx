"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import {
  formatCurrency,
  categoryHex,
  categoryType,
  formatShortDate,
  VALID_CATEGORIES,
} from "@/lib/utils";
import {
  getExpenses,
  getHouseholdMembers,
  buildMemberMap,
  Expense,
  Member,
} from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";

export default function ExpensesPage() {
  const { householdId, loading: authLoading } = useActiveHousehold();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  useEffect(() => {
    if (!authLoading && householdId) {
      const now = new Date();
      Promise.all([
        getExpenses(householdId, now.getFullYear(), now.getMonth() + 1),
        getHouseholdMembers(householdId),
      ]).then(([exp, mem]) => {
        setExpenses(exp);
        setMembers(mem);
        setLoading(false);
      });
    }
  }, [authLoading, householdId]);

  const memberMap = useMemo(() => buildMemberMap(members), [members]);

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchCat = category === "Todas" || e.category === category;
        const matchSearch = (e.description ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  }, [expenses, search, category]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Gastos</h1>
        <p className="text-center text-gray-400 text-sm py-8">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Gastos</h1>
        <span className="text-sm font-semibold text-[#6C63FF]">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Buscar gastos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
        />
      </div>

      {/* Category filter */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
      >
        <option value="Todas">Todas las categorías</option>
        {VALID_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Expense list */}
      <ul className="space-y-3">
        {filtered.map((exp) => {
          const type = categoryType(exp.category);
          return (
            <li
              key={exp.id}
              className="bg-white rounded-xl shadow-sm p-3 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex w-9 h-9 rounded-full items-center justify-center text-white text-xs font-bold flex-shrink-0"
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
                    {formatShortDate(exp.expense_date)} · {exp.payer_name} pagó ·{" "}
                    {exp.shared_with.map((id) => memberMap.get(id) ?? "?").join(", ")}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                {formatCurrency(exp.amount)}
              </p>
            </li>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No hay gastos que coincidan.
          </p>
        )}
      </ul>
    </div>
  );
}
