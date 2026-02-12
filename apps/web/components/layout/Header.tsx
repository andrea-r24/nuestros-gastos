"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { getUserHouseholds, setActiveHousehold } from "@/lib/queries";
import type { Household } from "@/lib/queries";

export default function Header() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "…";

  const [households, setHouseholds] = useState<Household[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeHousehold = households.find((h) => h.id === user?.active_household_id);

  useEffect(() => {
    if (!user) return;
    getUserHouseholds(user.id).then(setHouseholds);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSwitch(h: Household) {
    if (!user || h.id === user.active_household_id) { setDropdownOpen(false); return; }
    await setActiveHousehold(user.id, h.id);
    setDropdownOpen(false);
    window.location.reload();
  }

  const multipleHouseholds = households.length > 1;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-gray-100 md:hidden">
      {/* Left: greeting + space selector */}
      <div>
        <p className="text-xs text-gray-400 font-medium">Bienvenida, {name} 👋</p>

        {multipleHouseholds ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1 mt-0.5"
            >
              <span className="text-base font-bold text-gray-900">
                {activeHousehold?.name ?? "Inicio"}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50">
                {households.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSwitch(h)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    <span className={h.id === user?.active_household_id ? "font-bold text-gray-900" : "text-gray-700"}>
                      {h.name}
                    </span>
                    {h.id === user?.active_household_id && (
                      <Check size={14} className="text-[#22C55E]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-base font-bold text-gray-900">
              {activeHousehold?.name ?? "Inicio"}
            </span>
          </div>
        )}
      </div>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/notifications" className="relative w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#EC4899] rounded-full ring-2 ring-white" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-[#22C55E] flex items-center justify-center text-white text-sm font-bold">
          {name[0]}
        </div>
      </div>
    </header>
  );
}
