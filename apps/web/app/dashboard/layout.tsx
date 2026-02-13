"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Users, Settings, Layers, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { useAuth, useActiveHousehold } from "@/lib/useAuth";

// Sub-pages where the header should be hidden on mobile (they have their own back nav)
const HIDE_HEADER_PATHS = ["/dashboard/categories", "/dashboard/expenses", "/dashboard/notifications"];
import { getHouseholdMembers, insertExpense, Member } from "@/lib/queries";
import { categoryHierarchy, type MacroCategoryKey } from "@/lib/categories";

// ── FAB Context ────────────────────────────────────────────────────────────
const FABOpenContext = createContext<() => void>(() => { });
const useFABOpen = () => useContext(FABOpenContext);

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/insights", label: "Análisis", icon: PieChart, exact: false },
  { href: "/dashboard/spaces", label: "Espacios", icon: Users, exact: false },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings, exact: false },
];

function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "…";

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="text-base font-black text-gray-900">nuestrosgastos</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                ? "bg-[#22C55E]/10 text-[#22C55E]"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-xs font-black">
            {name[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "…"}</p>
            <p className="text-xs text-gray-400">Miembro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── FAB Modal (inline in layout) ────────────────────────────────────────────

const MACROS = Object.entries(categoryHierarchy) as [MacroCategoryKey, typeof categoryHierarchy[MacroCategoryKey]][];
const DEFAULT_MACRO_KEY: MacroCategoryKey = "alimentos";
const DEFAULT_SUB_ID = categoryHierarchy[DEFAULT_MACRO_KEY].subcategories[0].id;

function FABModal({ isOpen, onClose, members, householdId, currentUserId, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  householdId: number;
  currentUserId: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [macroKey, setMacroKey] = useState<MacroCategoryKey>(DEFAULT_MACRO_KEY);
  const [subId, setSubId] = useState(DEFAULT_SUB_ID);
  const [description, setDescription] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [sharedWith, setSharedWith] = useState<number[]>(members.map((m) => m.user_id));
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Currency & FX
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxLoading, setFxLoading] = useState(false);

  const activeMacro = categoryHierarchy[macroKey];
  const activeSub = activeMacro.subcategories.find((s) => s.id === subId) ?? activeMacro.subcategories[0];
  const ActiveSubIcon = activeSub.icon;
  const ActiveMacroIcon = activeMacro.icon;

  // Fetch FX rate when modal opens or currency changes to USD
  useEffect(() => {
    if (!isOpen) return;
    if (currency === "USD" && fxRate === null) {
      setFxLoading(true);
      fetch("https://open.er-api.com/v6/latest/USD")
        .then((r) => r.json())
        .then((data) => {
          if (data.rates?.PEN) setFxRate(data.rates.PEN);
        })
        .catch(() => { /* silenced */ })
        .finally(() => setFxLoading(false));
    }
  }, [isOpen, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setAmount("");
    setMacroKey(DEFAULT_MACRO_KEY);
    setSubId(DEFAULT_SUB_ID);
    setDescription("");
    setPaidBy(currentUserId);
    setSharedWith(members.map((m) => m.user_id));
    setError(null);
    setShowDetails(false);
    setCurrency("PEN");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { setError("El monto debe ser un número positivo."); return; }
    if (sharedWith.length === 0) { setError("Selecciona al menos una persona."); return; }

    // Convert to PEN if in USD
    let finalAmount = numAmount;
    if (currency === "USD") {
      if (!fxRate) { setError("Tipo de cambio no disponible. Intenta de nuevo."); return; }
      finalAmount = Math.round(numAmount * fxRate * 100) / 100;
    }

    setSubmitting(true);
    setError(null);
    try {
      const desc = currency === "USD"
        ? `${description ? description + " " : ""}(US$ ${numAmount.toFixed(2)} × ${fxRate?.toFixed(4)})`
        : description;
      await insertExpense({ householdId, paidBy, amount: finalAmount, category: subId, description: desc, sharedWith });
      handleClose();
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar el gasto.");
    } finally {
      setSubmitting(false);
    }
  };

  const sharedNames = members.filter((m) => sharedWith.includes(m.user_id)).map((m) => m.name.split(" ")[0]).join(" y ");

  const currSymbol = currency === "USD" ? "$" : "S/";
  const numAmount = parseFloat(amount) || 0;
  const convertedAmount = currency === "USD" && fxRate ? numAmount * fxRate : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-[40px] pt-3 pb-10 overflow-hidden">
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
        <button onClick={handleClose} className="absolute top-4 right-5 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <X size={16} className="text-gray-500" />
        </button>
        <div className="px-6">
          <p className="text-xs text-gray-400 font-medium text-center mb-1">Registrar gasto</p>

          {/* Currency toggle */}
          <div className="flex justify-center gap-2 mb-3">
            {(["PEN", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${currency === c
                    ? "bg-[#22C55E] text-white"
                    : "bg-gray-100 text-gray-500"
                  }`}
              >
                {c === "PEN" ? "S/ PEN" : "$ USD"}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="flex items-center justify-center gap-2 my-3">
            <span className="text-3xl font-display font-semibold text-gray-300">{currSymbol}</span>
            <input type="text" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="text-6xl font-display font-semibold text-gray-900 w-48 text-center bg-transparent focus:outline-none placeholder:text-gray-200" />
          </div>

          {/* FX info */}
          {currency === "USD" && (
            <div className="text-center mb-3">
              {fxLoading ? (
                <p className="text-xs text-gray-400">Cargando tipo de cambio...</p>
              ) : fxRate ? (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">TC: 1 USD = {fxRate.toFixed(4)} PEN</span>
                  {convertedAmount && convertedAmount > 0 && (
                    <span className="ml-1.5 text-[#22C55E] font-semibold">
                      ≈ S/ {convertedAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-400">No se pudo obtener el tipo de cambio</p>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mb-4">Compartido con {sharedNames || "nadie"}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x -mx-6 px-6 mb-3">
            {MACROS.map(([key, macro]) => {
              const MacroIcon = macro.icon;
              const active = macroKey === key;
              return (
                <button key={key} type="button" onClick={() => { setMacroKey(key); setSubId(categoryHierarchy[key].subcategories[0].id); }}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl flex-shrink-0 snap-start transition-all ${active ? "shadow-sm" : "bg-gray-100"}`}
                  style={active ? { backgroundColor: macro.color + "20" } : {}}>
                  <MacroIcon size={20} style={{ color: active ? macro.color : "#9CA3AF" }} />
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: active ? macro.color : "#9CA3AF" }}>{macro.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-wrap mb-4">
            {activeMacro.subcategories.map((sub) => {
              const SubIcon = sub.icon;
              const active = subId === sub.id;
              return (
                <button key={sub.id} type="button" onClick={() => setSubId(sub.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={active ? { backgroundColor: activeMacro.color, color: "#fff" } : { backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                  <SubIcon size={12} />{sub.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ backgroundColor: activeMacro.color + "10" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activeMacro.color + "25" }}>
              <ActiveSubIcon size={14} style={{ color: activeMacro.color }} />
            </div>
            <span className="text-sm font-medium text-gray-700 flex-1">{activeSub.name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: activeMacro.color + "25", color: activeMacro.color }}>
              <ActiveMacroIcon size={10} />{activeMacro.name}
            </span>
          </div>
          <button type="button" onClick={() => setShowDetails((v) => !v)} className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-4">
            {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showDetails ? "Menos detalles" : "Más detalles"}
          </button>
          {showDetails && (
            <div className="space-y-3 mb-4">
              <input type="text" placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div>
                <p className="text-xs text-gray-400 mb-2">¿Quién pagó?</p>
                <div className="flex gap-2 flex-wrap">
                  {members.map((m) => (
                    <button key={m.user_id} type="button" onClick={() => setPaidBy(m.user_id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${paidBy === m.user_id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>{m.name.split(" ")[0]}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">¿Cómo dividir?</p>
                <div className="flex gap-2 flex-wrap">
                  {members.map((m) => {
                    const active = sharedWith.includes(m.user_id);
                    return (
                      <button key={m.user_id} type="button" onClick={() => setSharedWith((prev) => prev.includes(m.user_id) ? prev.filter((id) => id !== m.user_id) : [...prev, m.user_id])} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"}`}>{m.name.split(" ")[0]}</button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {error && <p className="text-pink-500 text-xs mb-3">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting || !amount} className="w-full bg-emerald-500 text-white font-semibold rounded-2xl py-4 text-base disabled:opacity-40 hover:bg-emerald-600 transition-colors active:scale-[0.98]">
            {submitting ? "Guardando…" : currency === "USD" && convertedAmount ? `Guardar S/ ${convertedAmount.toFixed(2)}` : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { householdId } = useActiveHousehold();
  const [fabOpen, setFabOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (householdId) {
      getHouseholdMembers(householdId).then(setMembers);
    }
  }, [householdId]);

  const handleAddSuccess = useCallback(() => {
    window.location.reload();
  }, []);

  const hideHeaderOnMobile = HIDE_HEADER_PATHS.some((p) => pathname.startsWith(p));

  return (
    <FABOpenContext.Provider value={() => setFabOpen(true)}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Mobile header — hidden on drill-down sub-pages */}
          {!hideHeaderOnMobile && <Header />}

          <main className="flex-1 px-4 py-4 pb-24 md:pb-8 md:px-8 md:py-6 overflow-y-auto max-w-3xl">
            {children}
          </main>

          {/* Mobile bottom nav only */}
          <BottomNav onAddPress={() => setFabOpen(true)} />
        </div>
      </div>

      {/* FAB Modal */}
      <FABModal
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
        members={members}
        householdId={householdId ?? 0}
        currentUserId={user?.id ?? 0}
        onSuccess={handleAddSuccess}
      />
    </FABOpenContext.Provider>
  );
}
