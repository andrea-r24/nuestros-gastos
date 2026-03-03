"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Home, Users, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthAndInvite = async () => {
      const supabase = createClient();

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);

      // Validate invite code — fetch household name via public RLS
      const { data } = await supabase
        .from("household_invites")
        .select("household_id, is_active, expires_at, households!household_id(name)")
        .eq("code", code)
        .single();

      if (!data) {
        setError("Codigo de invitacion invalido");
      } else if (!data.is_active) {
        setError("Esta invitacion ya no esta activa");
      } else if (new Date(data.expires_at) < new Date()) {
        setError("Esta invitacion ha expirado");
      } else {
        setHouseholdName((data as any).households?.name ?? "Espacio");
      }

      setLoading(false);
    };

    if (code) {
      checkAuthAndInvite();
    }
  }, [code]);

  const handleLoginAndJoin = async () => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/invite/${code}`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const handleJoin = async () => {
    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/join-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al unirse");
        setJoining(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

      <div className="w-full max-w-md bg-white rounded-[28px] shadow-sm p-8">
        {error && !householdName ? (
          /* Error state */
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-[#EC4899]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">{error}</h1>
              <p className="text-sm text-gray-400">
                Pidele a quien te invito que te envie un nuevo enlace.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base hover:bg-[#16A34A] transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        ) : (
          /* Valid invite */
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
              <Users size={28} className="text-[#22C55E]" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Te invitaron a</h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Home size={15} className="text-[#22C55E]" />
                </div>
                <span className="text-lg font-bold text-gray-900">{householdName}</span>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#EC4899]">{error}</p>
            )}

            {isLoggedIn ? (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base disabled:opacity-50 hover:bg-[#16A34A] transition-colors"
              >
                {joining ? "Uniendome..." : "Unirme al espacio"}{" "}
                {!joining && <ArrowRight size={18} />}
              </button>
            ) : (
              <button
                onClick={handleLoginAndJoin}
                className="w-full flex items-center justify-center gap-2 bg-[#22C55E] text-white font-black rounded-2xl py-4 text-base hover:bg-[#16A34A] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                  />
                </svg>
                Iniciar sesion con Google para unirme
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
