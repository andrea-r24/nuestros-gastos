"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { VALID_CATEGORIES } from "@/lib/utils";
import { Member, insertExpense } from "@/lib/queries";

interface Props {
  members: Member[];
  onRefresh: () => void;
  currentUserId: number;
  householdId: number;
}

export default function FAB({ members, onRefresh, currentUserId, householdId }: Props) {
  const [open, setOpen] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(VALID_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [sharedWith, setSharedWith] = useState<number[]>([currentUserId]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMember = (userId: number) => {
    setSharedWith((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const resetForm = () => {
    setAmount("");
    setCategory(VALID_CATEGORIES[0]);
    setDescription("");
    setSharedWith([currentUserId]);
    setError(null);
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
        paidBy: currentUserId,
        amount: numAmount,
        category,
        description,
        sharedWith,
      });
      resetForm();
      setOpen(false);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el gasto.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating action button — sits above the BottomNav (bottom-24 = 6rem) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-[#6C63FF] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5A52D5] transition-colors"
      >
        <Plus size={28} />
      </button>

      {/* Bottom-sheet modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white w-full max-w-md rounded-t-2xl p-6 pb-10">
            {/* Handle pill */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Nuevo gasto</h3>
              <button onClick={() => setOpen(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Amount */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF] mb-3"
            />

            {/* Category */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF] mb-3"
            >
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Description */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF] mb-3"
            />

            {/* Shared with */}
            <label className="block text-sm font-medium text-gray-700 mb-2">Compartido con</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {members.map((m) => {
                const active = sharedWith.includes(m.user_id);
                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleMember(m.user_id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      active
                        ? "bg-[#6C63FF] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-[#6C63FF] text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50 hover:bg-[#5A52D5] transition-colors"
            >
              {submitting ? "Guardando…" : "Guardar gasto"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
