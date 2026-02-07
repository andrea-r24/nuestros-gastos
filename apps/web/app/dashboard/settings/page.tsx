"use client";

import { useState, useEffect } from "react";
import { getHousehold, getHouseholdMembers, updateBudget, Household, Member } from "@/lib/queries";
import { useActiveHousehold } from "@/lib/useAuth";

export default function SettingsPage() {
  const { householdId, loading: authLoading } = useActiveHousehold();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const handleSave = async () => {
    if (!householdId) return;
    const num = budget === "" ? null : Number(budget);
    if (budget !== "" && isNaN(num!)) return;
    setSaving(true);
    try {
      await updateBudget(householdId, num);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      // error silenciado por ahora
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!authLoading && householdId) {
      Promise.all([
        getHousehold(householdId),
        getHouseholdMembers(householdId),
      ]).then(([hh, mem]) => {
        setHousehold(hh);
        setMembers(mem);
        if (hh?.monthly_budget != null) {
          setBudget(String(hh.monthly_budget));
        }
        setLoading(false);
      });
    }
  }, [authLoading, householdId]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-center text-gray-400 text-sm py-8">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      {/* Household info card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Hogar
        </h2>
        <p className="text-base font-semibold text-gray-900">
          {household?.name}
        </p>

        {/* Budget input */}
        <div className="mt-4">
          <label className="text-xs text-gray-400 block mb-1">
            Presupuesto mensual (S/)
          </label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-2 w-full bg-[#6C63FF] text-white text-sm font-semibold rounded-lg py-2 disabled:opacity-50 hover:bg-[#5A52D5] transition-colors"
          >
            {saving ? "Guardando…" : saveStatus === "saved" ? "Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Members card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Miembros
        </h2>
        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF] text-sm font-bold">
                  {m.name[0]}
                </div>
                <span className="text-sm text-gray-900">{m.name}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  m.role === "owner"
                    ? "bg-[#6C63FF]/10 text-[#6C63FF]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Danger zone placeholder */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Zona peligrosa
        </h2>
        <p className="text-xs text-gray-400">
          Opciones de eliminación y exportación próximamente…
        </p>
      </div>
    </div>
  );
}
