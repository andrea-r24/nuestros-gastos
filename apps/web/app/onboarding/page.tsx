"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Home, DollarSign, Users } from "lucide-react";

const STEPS = [
  { id: 1, label: "Tu espacio", icon: Home },
  { id: 2, label: "Presupuesto", icon: DollarSign },
  { id: 3, label: "Listo", icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Space name
  const [spaceName, setSpaceName] = useState("Casa compartida");

  // Step 2: Budget
  const [budget, setBudget] = useState("");

  // Auth check
  useEffect(() => {
    const tid = localStorage.getItem("telegram_id");
    if (!tid) router.push("/");
  }, [router]);

  const handleFinish = async () => {
    const telegramId = localStorage.getItem("telegram_id");
    if (!telegramId) return;

    setSubmitting(true);
    try {
      await fetch("/api/setup-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: parseInt(telegramId, 10),
          household_name: spaceName.trim() || "Casa compartida",
          monthly_budget: budget ? parseFloat(budget) : null,
        }),
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-[#22C55E] to-[#EC4899] rounded-xl flex items-center justify-center text-white font-black text-lg">
          N
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900">
          nuestros<span className="text-[#22C55E]">gastos</span>
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${done
                    ? "bg-[#22C55E] text-white"
                    : active
                      ? "bg-white text-[#22C55E] border-2 border-[#22C55E]"
                      : "bg-white text-gray-300 border-2 border-gray-200"
                  }`}
              >
                {done ? <Check size={14} /> : <Icon size={14} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${done ? "bg-[#22C55E]" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-sm p-8">

        {/* Step 1: Space name */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Ponle nombre a tu espacio</h1>
              <p className="text-sm text-gray-400">
                Asi lo vereis tu y Pamela cuando entren al dashboard.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Nombre del espacio
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="Casa compartida"
                maxLength={50}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:font-normal placeholder:text-gray-300"
                autoFocus
              />
              <p className="text-xs text-gray-300 mt-1.5">
                Ejemplos: Mi Depa, Casa de Andrea y Pamela, El Nido...
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!spaceName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base disabled:opacity-40 hover:bg-[#16A34A] transition-colors"
            >
              Siguiente <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Presupuesto mensual</h1>
              <p className="text-sm text-gray-400">
                Opcional. Puedes cambiarlo en cualquier momento desde Espacios.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Limite mensual (S/)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  S/
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Sin limite"
                  min="0"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 pl-10 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:font-normal placeholder:text-gray-300"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-500 font-semibold rounded-2xl py-3.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Atras
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-3.5 text-base hover:bg-[#16A34A] transition-colors"
              >
                {budget ? "Guardar y continuar" : "Omitir"} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <Check size={36} className="text-[#22C55E]" strokeWidth={3} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Todo listo</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Tu espacio <span className="font-semibold text-gray-700">{spaceName}</span> esta configurado.
                Puedes invitar a Pamela desde la seccion Espacios.
              </p>
            </div>

            <div className="w-full bg-[#F4F5F8] rounded-2xl p-4 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Home size={15} className="text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{spaceName}</p>
                  {budget && (
                    <p className="text-xs text-gray-400">Presupuesto: S/ {parseFloat(budget).toLocaleString()}/mes</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-11">
                <Users size={12} className="text-gray-400" />
                <p className="text-xs text-gray-400">Invita miembros desde Espacios</p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base disabled:opacity-50 hover:bg-[#16A34A] transition-colors"
            >
              {submitting ? "Configurando..." : "Ir al dashboard"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Skip */}
      {step < 3 && (
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Omitir configuracion por ahora
        </button>
      )}
    </div>
  );
}
