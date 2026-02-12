"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3x3, BarChart3, Plus, Users, Settings } from "lucide-react";

const LEFT_TABS = [
  { href: "/dashboard", label: "HOME", icon: Grid3x3, matchPrefixes: ["/dashboard/categories", "/dashboard/expenses"] },
  { href: "/dashboard/insights", label: "INSIGHTS", icon: BarChart3, matchPrefixes: [] },
];

const RIGHT_TABS = [
  { href: "/dashboard/spaces", label: "SPACE", icon: Users, matchPrefixes: [] },
  { href: "/dashboard/settings", label: "SETTINGS", icon: Settings, matchPrefixes: [] },
];

interface BottomNavProps {
  onAddPress?: () => void;
}

export default function BottomNav({ onAddPress }: BottomNavProps) {
  const pathname = usePathname();

  function isActive(href: string, matchPrefixes: string[]) {
    if (href === "/dashboard") {
      return pathname === href || matchPrefixes.some((p) => pathname.startsWith(p));
    }
    return pathname.startsWith(href);
  }

  const renderTab = (tab: typeof LEFT_TABS[0]) => {
    const Icon = tab.icon;
    const active = isActive(tab.href, tab.matchPrefixes);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className="flex flex-col items-center gap-0.5 px-4 py-1"
      >
        <Icon
          size={22}
          className={active ? "text-[#22C55E]" : "text-gray-400"}
          strokeWidth={active ? 2.5 : 1.8}
        />
        <span
          className={`text-[10px] tracking-wide ${active ? "text-[#22C55E] font-bold" : "text-gray-400 font-medium"
            }`}
        >
          {tab.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 md:hidden">
      <div className="flex items-end justify-around py-2 pb-safe max-w-2xl mx-auto relative">
        {/* Left tabs */}
        {LEFT_TABS.map(renderTab)}

        {/* Center FAB button — protruding above the nav bar */}
        <button
          onClick={onAddPress}
          className="flex flex-col items-center -mt-8"
        >
          <div className="w-14 h-14 bg-[#22C55E] rounded-full shadow-lg shadow-[#22C55E]/30 flex items-center justify-center active:scale-95 transition-transform ring-4 ring-white">
            <Plus size={26} strokeWidth={2.5} className="text-white" />
          </div>
        </button>

        {/* Right tabs */}
        {RIGHT_TABS.map(renderTab)}
      </div>
    </nav>
  );
}
