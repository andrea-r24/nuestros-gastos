"use client";

import { useState, createContext, useContext } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { categoryHierarchy, type MacroCategoryKey } from "@/lib/categories";
import { Member, insertExpense } from "@/lib/queries";

// Context for opening the FAB modal from BottomNav
const FABContext = createContext<{ open: () => void }>({ open: () => { } });
export const useFAB = () => useContext(FABContext);

interface Props {
  members: Member[];
  onRefresh: () => void;
  currentUserId: number;
  householdId: number;
  children: React.ReactNode;
}

const MACROS = Object.entries(categoryHierarchy) as [MacroCategoryKey, typeof categoryHierarchy[MacroCategoryKey]][];
const DEFAULT_MACRO_KEY: MacroCategoryKey = "alimentos";
const DEFAULT_SUB_ID = categoryHierarchy[DEFAULT_MACRO_KEY].subcategories[0].id;

export default function FABProvider({ members, onRefresh, currentUserId, householdId, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [amount, setAmount] = useState("");
  const [macroKey, setMacroKey] = useState<MacroCategoryKey>(DEFAULT_MACRO_KEY);
  const [subId, setSubId] = useState(DEFAULT_SUB_ID);
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [sharedWith, setSharedWith] = useState<number[]>(members.map((m) => m.user_id));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMacro = categoryHierarchy[macroKey];
  const activeSub = activeMacro.subcategories.find((s) => s.id === subId) ?? activeMacro.subcategories[0];
  const ActiveSubIcon = activeSub.icon;
  const ActiveMacroIcon = activeMacro.icon;

  const handleSelectMacro = (key: MacroCategoryKey) => {
    setMacroKey(key);
    setSubId(categoryHierarchy[key].subcategories[0].id);
  };

  const toggleMember = (userId: number) => {
    setSharedWith((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setAmount("");
    setMacroKey(DEFAULT_MACRO_KEY);
    setSubId(DEFAULT_SUB_ID);
    setDescription("");
    setPaidBy(currentUserId);
    setSharedWith(members.map((m) => m.user_id));
    setError(null);
    setShowDetails(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("El monto debe ser un número positivo.");
      return;
    }
    if (sharedWith.length === 0) {
      setError("Selecciona al menos una persona.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await insertExpense({
        householdId,
        paidBy,
        amount: numAmount,
        category: subId,
        description,
        sharedWith,
      });
      handleClose();
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el gasto.");
    } finally {
      setSubmitting(false);
    }
  };

  const sharedNames = members
    .filter((m) => sharedWith.includes(m.user_id))
    .map((m) => m.name.split(" ")[0])
    .join(" y ");

  return (
    <FABContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      {/* Bottom-sheet modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative bg-white w-full max-w-lg rounded-t-[40px] pt-3 pb-10 overflow-hidden">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            <button
              onClick={handleClose}
              className="absolute top-4 right-5 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>

            <div className="px-6">
              <p className="text-xs text-gray-400 font-medium text-center mb-1">Registrar gasto</p>

              {/* Amount */}
              <div className="flex items-center justify-center gap-2 my-4">
                <span className="text-3xl font-display font-semibold text-gray-300">S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="text-6xl font-display font-semibold text-gray-900 w-48 text-center bg-transparent focus:outline-none placeholder:text-gray-200"
                />
              </div>

              <p className="text-xs text-gray-400 text-center mb-4">
                Compartido con {sharedNames || "nadie"}
              </p>

              {/* Macro row */}
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x -mx-6 px-6 mb-3">
                {MACROS.map(([key, macro]) => {
                  const MacroIcon = macro.icon;
                  const active = macroKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectMacro(key)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl flex-shrink-0 snap-start transition-all ${active ? "shadow-sm" : "bg-gray-100"
                        }`}
                      style={active ? { backgroundColor: macro.color + "20" } : {}}
                    >
                      <MacroIcon
                        size={20}
                        style={{ color: active ? macro.color : "#9CA3AF" }}
                      />
                      <span
                        className="text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: active ? macro.color : "#9CA3AF" }}
                      >
                        {macro.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-category chips */}
              <div className="flex gap-2 flex-wrap mb-4">
                {activeMacro.subcategories.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = subId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubId(sub.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={
                        active
                          ? { backgroundColor: activeMacro.color, color: "#fff" }
                          : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                      }
                    >
                      <SubIcon size={12} />
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              {/* Selected summary */}
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                style={{ backgroundColor: activeMacro.color + "10" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activeMacro.color + "25" }}
                >
                  <ActiveSubIcon size={14} style={{ color: activeMacro.color }} />
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1">{activeSub.name}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: activeMacro.color + "25", color: activeMacro.color }}
                >
                  <ActiveMacroIcon size={10} />
                  {activeMacro.name}
                </span>
              </div>

              {/* More details toggle */}
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-4"
              >
                {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showDetails ? "Menos detalles" : "Más detalles"}
              </button>

              {showDetails && (
                <div className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Descripción (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div>
                    <p className="text-xs text-gray-400 mb-2">¿Quién pagó?</p>
                    <div className="flex gap-2 flex-wrap">
                      {members.map((m) => (
                        <button
                          key={m.user_id}
                          type="button"
                          onClick={() => setPaidBy(m.user_id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${paidBy === m.user_id
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {m.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">¿Cómo dividir?</p>
                    <div className="flex gap-2 flex-wrap">
                      {members.map((m) => {
                        const active = sharedWith.includes(m.user_id);
                        return (
                          <button
                            key={m.user_id}
                            type="button"
                            onClick={() => toggleMember(m.user_id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {m.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-pink-500 text-xs mb-3">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={submitting || !amount}
                className="w-full bg-emerald-500 text-white font-semibold rounded-2xl py-4 text-base disabled:opacity-40 hover:bg-emerald-600 transition-colors active:scale-[0.98]"
              >
                {submitting ? "Guardando…" : "Guardar gasto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FABContext.Provider>
  );
}
