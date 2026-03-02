"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Home,
  Link2,
  DollarSign,
  Copy,
  Share2,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { createHousehold, setActiveHousehold } from "@/lib/queries";

const CURRENCIES = [
  { code: "PEN", symbol: "S/", label: "Soles" },
  { code: "USD", symbol: "$", label: "Dólares" },
  { code: "EUR", symbol: "€", label: "Euros" },
];

type Step = "choose" | "create" | "join" | "invite" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [submitting, setSubmitting] = useState(false);

  // Create space state
  const [spaceName, setSpaceName] = useState("");
  const [currency, setCurrency] = useState("PEN");
  const [budget, setBudget] = useState("");

  // Invite state (after creating space)
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Join state
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  // Created household id
  const [createdHouseholdId, setCreatedHouseholdId] = useState<number | null>(null);

  const currInfo = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const handleCreateSpace = async () => {
    if (!user || !spaceName.trim()) return;
    setSubmitting(true);
    try {
      const bud = budget === "" ? null : Number(budget);
      const newHH = await createHousehold(user.id, spaceName.trim(), bud);
      setCreatedHouseholdId(newHH.id);

      // Save currency preference
      if (typeof window !== "undefined") {
        localStorage.setItem(`currency_${newHH.id}`, currency);
      }

      // Generate invite code
      const res = await fetch("/api/create-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household_id: newHH.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteCode(data.invite.code);
        setInviteLink(data.invite.link);
      }

      setStep("invite");
    } catch {
      // If invite generation fails, still go to dashboard
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");

    try {
      const res = await fetch("/api/join-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error || "Error al unirse");
        return;
      }

      router.push("/dashboard");
    } catch {
      setJoinError("Error de conexion. Intenta de nuevo.");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Unete a mi espacio en NuestrosGastos",
          text: `Usa este codigo para unirte: ${inviteCode}`,
          url: inviteLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleFinishOnboarding = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user already has a household, skip onboarding
  if (user?.active_household_id) {
    router.push("/dashboard");
    return null;
  }

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

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-sm p-8">

        {/* Step: Choose */}
        {step === "choose" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-gray-900 mb-1">
                Hola, {user?.name?.split(" ")[0] || "Usuario"}!
              </h1>
              <p className="text-sm text-gray-400">
                Para empezar, crea un nuevo espacio o unete a uno existente.
              </p>
            </div>

            <button
              onClick={() => setStep("create")}
              className="w-full flex items-center gap-4 p-5 bg-[#F4F5F8] rounded-2xl hover:bg-[#EAECF0] transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <Home size={22} className="text-[#22C55E]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">Crear un espacio nuevo</p>
                <p className="text-xs text-gray-400">Para tu hogar, departamento o viaje</p>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-[#22C55E] transition-colors" />
            </button>

            <button
              onClick={() => setStep("join")}
              className="w-full flex items-center gap-4 p-5 bg-[#F4F5F8] rounded-2xl hover:bg-[#EAECF0] transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center flex-shrink-0">
                <Link2 size={22} className="text-[#EC4899]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">Unirme a un espacio</p>
                <p className="text-xs text-gray-400">Con un codigo o enlace de invitacion</p>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-[#EC4899] transition-colors" />
            </button>
          </div>
        )}

        {/* Step: Create */}
        {step === "create" && (
          <div className="flex flex-col gap-5">
            <div>
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Crea tu espacio</h1>
              <p className="text-sm text-gray-400">
                Configura lo basico. Puedes cambiar todo despues.
              </p>
            </div>

            {/* Space name */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Nombre del espacio
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="Mi Depa, Casa de Andrea..."
                maxLength={50}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:font-normal placeholder:text-gray-300"
                autoFocus
              />
            </div>

            {/* Currency */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Divisa
              </label>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      currency === c.code
                        ? "bg-[#22C55E] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Presupuesto mensual ({currInfo.symbol}) — opcional
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  {currInfo.symbol}
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Sin limite"
                  min="0"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 pl-10 text-base font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#22C55E] placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
            </div>

            <button
              onClick={handleCreateSpace}
              disabled={!spaceName.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base disabled:opacity-40 hover:bg-[#16A34A] transition-colors"
            >
              {submitting ? "Creando..." : "Crear espacio"} {!submitting && <ArrowRight size={18} />}
            </button>
          </div>
        )}

        {/* Step: Invite members (after creating space) */}
        {step === "invite" && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <Check size={28} className="text-[#22C55E]" strokeWidth={3} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Espacio creado</h1>
              <p className="text-sm text-gray-400">
                Ahora invita a los miembros de <span className="font-semibold text-gray-700">{spaceName}</span>
              </p>
            </div>

            {inviteLink && (
              <>
                {/* Invite code display */}
                <div className="w-full bg-[#F4F5F8] rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-2">Codigo de invitacion</p>
                  <p className="text-2xl font-black tracking-[0.2em] text-gray-900">{inviteCode}</p>
                </div>

                {/* Copy link button */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl py-3.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <Copy size={15} />
                  {copied ? "Enlace copiado!" : "Copiar enlace de invitacion"}
                </button>

                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base hover:bg-[#16A34A] transition-colors"
                >
                  <Share2 size={18} />
                  Compartir invitacion
                </button>
              </>
            )}

            <button
              onClick={handleFinishOnboarding}
              className={`w-full flex items-center justify-center gap-2 font-black rounded-2xl py-4 text-base transition-colors ${
                inviteLink
                  ? "border-2 border-gray-200 text-gray-500 hover:bg-gray-50"
                  : "bg-[#22C55E] text-white hover:bg-[#16A34A]"
              }`}
            >
              Ir al dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Join */}
        {step === "join" && (
          <div className="flex flex-col gap-5">
            <div>
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Unirme a un espacio</h1>
              <p className="text-sm text-gray-400">
                Ingresa el codigo que te compartieron.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                Codigo de invitacion
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABCD1234"
                maxLength={8}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-center text-xl font-black tracking-[0.15em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#EC4899] placeholder:font-normal placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal"
                autoFocus
              />
              {joinError && (
                <p className="text-xs text-[#EC4899] mt-2">{joinError}</p>
              )}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Si te enviaron un enlace, abrelo directamente en tu navegador y te uniras automaticamente.
            </p>

            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joining}
              className="w-full flex items-center justify-center gap-2 bg-[#EC4899] text-white font-black rounded-2xl py-4 text-base disabled:opacity-40 hover:bg-[#DB2777] transition-colors"
            >
              {joining ? "Uniendome..." : "Unirme"} {!joining && <ArrowRight size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Skip */}
      {(step === "choose" || step === "create" || step === "join") && (
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Omitir por ahora
        </button>
      )}
    </div>
  );
}
