"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, Crown, User, Plus, X, Pencil, Check, DollarSign, Trash2 } from "lucide-react";
import {
  getHousehold,
  getHouseholdMembers,
  getUserByTelegramId,
  addMemberToHousehold,
  removeMemberFromHousehold,
  updateBudget,
  updateHouseholdName,
  createHousehold,
  setActiveHousehold,
  Household,
  Member,
} from "@/lib/queries";
import { useActiveHousehold, useAuth } from "@/lib/useAuth";
import { formatCurrency } from "@/lib/utils";

const CURRENCIES = [
  { code: "PEN", symbol: "S/", label: "Soles" },
  { code: "USD", symbol: "$", label: "Dólares" },
  { code: "EUR", symbol: "€", label: "Euros" },
];

export default function SpacesPage() {
  const { user } = useAuth();
  const { householdId, loading: authLoading } = useActiveHousehold();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Budget
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  // Currency
  const [currency, setCurrency] = useState("PEN");

  // Add member
  const [telegramIdInput, setTelegramIdInput] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberStatus, setAddMemberStatus] = useState<string | null>(null);

  // Remove member
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  // Create space modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceBudget, setNewSpaceBudget] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleSaveName = async () => {
    if (!householdId || !nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateHouseholdName(householdId, nameInput.trim());
      setHousehold((prev) => prev ? { ...prev, name: nameInput.trim() } : prev);
      setEditingName(false);
    } catch {
      // silenced
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!householdId) return;
    const num = budget === "" ? null : Number(budget);
    if (budget !== "" && isNaN(num!)) return;
    setSaving(true);
    try {
      await updateBudget(householdId, num);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      // silenced
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!householdId || !telegramIdInput) return;
    const telegramId = parseInt(telegramIdInput, 10);
    if (isNaN(telegramId)) {
      setAddMemberStatus("ID de Telegram invalido");
      setTimeout(() => setAddMemberStatus(null), 3000);
      return;
    }

    setAddingMember(true);
    setAddMemberStatus(null);

    try {
      const foundUser = await getUserByTelegramId(telegramId);
      if (!foundUser) {
        setAddMemberStatus("Usuario no encontrado. Debe iniciar sesion primero.");
        setTimeout(() => setAddMemberStatus(null), 4000);
        return;
      }

      await addMemberToHousehold(householdId, foundUser.id);
      const updatedMembers = await getHouseholdMembers(householdId);
      setMembers(updatedMembers);
      setAddMemberStatus(`${foundUser.name} agregado correctamente`);
      setTelegramIdInput("");
      setTimeout(() => setAddMemberStatus(null), 3000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al agregar miembro";
      setAddMemberStatus(msg);
      setTimeout(() => setAddMemberStatus(null), 4000);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!householdId) return;
    setRemovingUserId(userId);
    try {
      await removeMemberFromHousehold(householdId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar miembro";
      setAddMemberStatus(msg);
      setTimeout(() => setAddMemberStatus(null), 4000);
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleCreateSpace = async () => {
    if (!user || !newSpaceName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const bud = newSpaceBudget === "" ? null : Number(newSpaceBudget);
      const newHH = await createHousehold(user.id, newSpaceName.trim(), bud);
      await setActiveHousehold(user.id, newHH.id);
      window.location.reload();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error al crear el espacio");
      setCreating(false);
    }
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    if (typeof window !== "undefined") {
      localStorage.setItem(`currency_${householdId}`, code);
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
        setNameInput(hh?.name ?? "");
        if (hh?.monthly_budget != null) {
          setBudget(String(hh.monthly_budget));
        }
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(`currency_${householdId}`);
          if (saved) setCurrency(saved);
        }
        setLoading(false);
      });
    }
  }, [authLoading, householdId]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-gray-900">Espacios</h1>
        <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
      </div>
    );
  }

  const currInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Espacios</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-[#22C55E] text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-[#16A34A] transition-colors"
        >
          <Plus size={15} />
          Nuevo
        </button>
      </div>

      {/* Space info card */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
            <Users size={20} className="text-[#22C55E]" />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !nameInput.trim()}
                  className="w-7 h-7 bg-[#22C55E] rounded-full flex items-center justify-center text-white disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(household?.name ?? ""); }}
                  className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-gray-900">{household?.name ?? "Mi hogar"}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <Pencil size={11} className="text-gray-400" />
                </button>
              </div>
            )}
            <span className="text-xs bg-[#22C55E]/10 text-[#22C55E] font-semibold px-2 py-0.5 rounded-full">
              Hogar · {members.length} miembro{members.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Presupuesto mensual ({currInfo.symbol})</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Sin limite"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className="bg-[#22C55E] text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-50 hover:bg-[#16A34A] transition-colors whitespace-nowrap"
            >
              {saving ? "..." : saveStatus === "saved" ? "Guardado ✓" : "Guardar"}
            </button>
          </div>
          {household?.monthly_budget != null && (
            <p className="text-xs text-gray-400 mt-1">
              Presupuesto actual: {formatCurrency(household.monthly_budget)}
            </p>
          )}
        </div>

        {/* Currency selector */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400 font-medium">Divisa</p>
          </div>
          <div className="flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${currency === c.code
                    ? "bg-[#22C55E] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members list */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Miembros</h2>
        <div className="bg-white rounded-[24px] shadow-sm p-5">
          <ul className="space-y-3">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] text-sm font-bold">
                    {m.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">
                      {m.role === "owner" ? "Propietario" : "Miembro"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${m.role === "owner"
                        ? "bg-[#22C55E]/10 text-[#22C55E]"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {m.role === "owner" ? <Crown size={11} /> : <User size={11} />}
                    {m.role === "owner" ? "Owner" : "Miembro"}
                  </span>
                  {/* Remove button — only for non-owners */}
                  {m.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      disabled={removingUserId === m.user_id}
                      className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Eliminar miembro"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add member */}
      <div className="bg-white rounded-[24px] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={16} className="text-[#22C55E]" />
          <h2 className="text-sm font-bold text-gray-900">Agregar miembro</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Ingresa el Telegram ID del usuario. Debe haber iniciado sesion al menos una vez.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Telegram ID (ej: 123456789)"
            value={telegramIdInput}
            onChange={(e) => setTelegramIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
          <button
            onClick={handleAddMember}
            disabled={addingMember || !telegramIdInput}
            className="bg-[#22C55E] text-white text-sm font-semibold rounded-xl px-4 py-2 disabled:opacity-50 hover:bg-[#16A34A] transition-colors whitespace-nowrap"
          >
            {addingMember ? "..." : "Agregar"}
          </button>
        </div>
        {addMemberStatus && (
          <p
            className={`text-xs mt-2 ${addMemberStatus.includes("correctamente")
                ? "text-[#22C55E]"
                : "text-[#EC4899]"
              }`}
          >
            {addMemberStatus}
          </p>
        )}
      </div>

      {/* Create space modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Crear nuevo espacio</h2>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">
                  Nombre del espacio
                </label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Casa, Oficina, Viaje..."
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">
                  Presupuesto mensual (S/) — opcional
                </label>
                <input
                  type="number"
                  value={newSpaceBudget}
                  onChange={(e) => setNewSpaceBudget(e.target.value)}
                  placeholder="Sin limite"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
              {createError && (
                <p className="text-xs text-[#EC4899]">{createError}</p>
              )}
              <button
                onClick={handleCreateSpace}
                disabled={creating || !newSpaceName.trim()}
                className="w-full bg-[#22C55E] text-white font-bold rounded-2xl py-4 disabled:opacity-50 hover:bg-[#16A34A] transition-colors"
              >
                {creating ? "Creando..." : "Crear espacio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
