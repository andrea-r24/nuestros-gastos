"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-[#22C55E] to-[#EC4899] rounded-xl flex items-center justify-center text-white font-black text-lg">
            N
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">nuestros<span className="text-[#22C55E]">gastos</span></span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Left: Hero + CTA */}
        <div className="flex flex-col gap-8">
          {/* Badge */}
          <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-white text-[#22C55E] text-sm font-bold tracking-wide uppercase shadow-sm border border-slate-100">
            Finanzas del hogar
          </span>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05]">
              Gastos compartidos,{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #22C55E 0%, #EC4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                sin estres
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-md leading-relaxed">
              Sin deudas incomodas. Sin culpa. Solo claridad. La forma simple de llevar los gastos del hogar sin conversaciones dificiles.
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#22C55E] flex items-center justify-center mb-3 text-lg">
                👁
              </div>
              <p className="font-bold text-slate-900 text-sm">Claridad total</p>
              <p className="text-xs text-slate-400 mt-0.5">Ve exactamente a donde va el dinero</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#EC4899] flex items-center justify-center mb-3 text-lg">
                🤝
              </div>
              <p className="font-bold text-slate-900 text-sm">Sin fricciones</p>
              <p className="text-xs text-slate-400 mt-0.5">Colabora sin incomodidades</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3 text-lg">
                💚
              </div>
              <p className="font-bold text-slate-900 text-sm">Confianza mutua</p>
              <p className="text-xs text-slate-400 mt-0.5">Transparencia que une</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="inline-flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-2xl text-base font-bold shadow-lg shadow-slate-200 border border-slate-200 hover:bg-slate-50 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            {BOT_USERNAME && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-400">
                  Tambien puedes registrar gastos via{" "}
                  <a
                    href={`https://t.me/${BOT_USERNAME}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-semibold hover:underline"
                  >
                    nuestro bot de Telegram
                  </a>
                  . Conectalo desde Ajustes despues de iniciar sesion.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: App preview card */}
        <div className="relative hidden lg:flex items-center justify-center">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#22C55E]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-[#EC4899]/10 rounded-full blur-3xl" />

          {/* Mock app card */}
          <div className="relative bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 w-full max-w-sm">
            {/* Mock header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-slate-400 font-medium">Bienvenida, Andrea 👋</p>
                <p className="text-lg font-black text-slate-900">Casa de Andrea</p>
              </div>
              <div className="w-9 h-9 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
                <span className="text-[#22C55E] text-sm font-bold">A</span>
              </div>
            </div>

            {/* Mock balance */}
            <div className="bg-[#F4F5F8] rounded-[24px] p-5 mb-4">
              <p className="text-xs text-slate-400 font-medium mb-1">Gastos del mes</p>
              <p className="text-4xl font-black text-[#22C55E]">S/ 2,450</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-green-100 text-[#22C55E] text-xs font-bold rounded-full">
                  S/ 140 bajo el mes pasado
                </span>
              </div>
            </div>

            {/* Mock split bar */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-medium mb-3">Distribucion</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] text-xs font-bold">A</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#22C55E] rounded-full" style={{ width: "52%" }} />
                </div>
                <span className="text-xs font-bold text-slate-700">S/ 1,274</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899] text-xs font-bold">P</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#EC4899] rounded-full" style={{ width: "48%" }} />
                </div>
                <span className="text-xs font-bold text-slate-700">S/ 1,176</span>
              </div>
            </div>

            {/* Mock recent expense */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center text-base">🛒</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Plaza Vea</p>
                  <p className="text-xs text-slate-400">Hoy · Pago Andrea</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">S/ 84.20</p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile app preview (below CTA on mobile) */}
      <div className="lg:hidden px-6 pb-12">
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400">Bienvenida, Andrea 👋</p>
              <p className="text-base font-black text-slate-900">Casa de Andrea</p>
            </div>
            <div className="w-8 h-8 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
              <span className="text-[#22C55E] text-xs font-bold">A</span>
            </div>
          </div>
          <div className="bg-[#F4F5F8] rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">Gastos del mes</p>
            <p className="text-3xl font-black text-[#22C55E]">S/ 2,450</p>
          </div>
        </div>
      </div>
    </div>
  );
}
