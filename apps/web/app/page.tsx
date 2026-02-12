"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Home() {
  const router = useRouter();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!BOT_USERNAME || !widgetRef.current) return;
    const container = widgetRef.current;

    (window as any).onTelegramAuth = async (user: any) => {
      try {
        const verifyRes = await fetch("/api/verify-telegram-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.valid) {
          alert("Error de autenticación: " + (verifyData.error || "hash inválido"));
          return;
        }

        const registerRes = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegram_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
          }),
        });
        const registerData = await registerRes.json();

        if (registerData.user) {
          localStorage.setItem("telegram_id", String(registerData.user.telegram_id));
          router.push(registerData.isNewUser ? "/onboarding" : "/dashboard");
        } else {
          alert("Error al registrar usuario");
        }
      } catch (error) {
        console.error("Auth error:", error);
        alert("Error al verificar la autenticación");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth");
    script.setAttribute("data-request-write-access", "");
    script.async = true;
    container.appendChild(script);

    return () => {
      delete (window as any).onTelegramAuth;
      if (container.contains(script)) container.removeChild(script);
    };
  }, [router]);

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
        <Link
          href="/dev-login"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Desarrollo
        </Link>
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
                sin estrés
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-md leading-relaxed">
              Sin deudas incómodas. Sin culpa. Solo claridad. La forma simple de llevar los gastos del hogar sin conversaciones difíciles.
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-[#22C55E] flex items-center justify-center mb-3 text-lg">
                👁
              </div>
              <p className="font-bold text-slate-900 text-sm">Claridad total</p>
              <p className="text-xs text-slate-400 mt-0.5">Ve exactamente a dónde va el dinero</p>
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
            {/* Primary: bot magic link */}
            {BOT_USERNAME ? (
              <div className="flex flex-col gap-3 w-full">
                <a
                  href={`https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-4 rounded-2xl text-base font-bold shadow-lg shadow-green-200 hover:bg-[#1DA850] transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  Abrir @{BOT_USERNAME} en Telegram
                </a>
                <p className="text-sm text-slate-500">
                  En el bot, escribe{" "}
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">/login</code>
                  {" "}para recibir tu link de acceso.
                </p>
                {/* Secondary: keep the widget hidden but functional as fallback */}
                <div ref={widgetRef} className="hidden" />
              </div>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-4 rounded-2xl text-base font-bold shadow-lg shadow-green-200 hover:bg-[#1DA850] transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Entrar al dashboard
              </Link>
            )}
            <p className="text-xs text-slate-400">
              Sin contraseñas. Accede con tu cuenta de Telegram.
            </p>
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
              <p className="text-xs text-slate-400 font-medium mb-3">Distribución</p>
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
                  <p className="text-xs text-slate-400">Hoy · Pagó Andrea</p>
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
