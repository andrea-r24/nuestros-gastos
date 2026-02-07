"use client";

import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — replace with Supabase queries when auth is wired
// ---------------------------------------------------------------------------
const MOCK_USER = "Andrea";
const MOCK_HOUSEHOLDS = [{ id: 1, name: "Hogar" }];

export default function Header() {
  const [activeHousehold, setActiveHousehold] = useState(MOCK_HOUSEHOLDS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: greeting + household selector */}
        <div>
          <p className="text-xs text-gray-400">Hola,</p>
          <button
            className="flex items-center gap-1"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="text-base font-semibold text-gray-900">
              {MOCK_USER}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Right: notification bell + avatar */}
        <div className="flex items-center gap-3">
          <button className="text-gray-400 relative">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#6C63FF] flex items-center justify-center text-white text-sm font-bold">
            {MOCK_USER[0]}
          </div>
        </div>
      </div>

      {/* Household dropdown */}
      {dropdownOpen && (
        <div className="absolute top-full left-4 right-4 bg-white rounded-lg shadow-md mt-1 z-40 p-2">
          {MOCK_HOUSEHOLDS.map((h) => (
            <button
              key={h.id}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                h.id === activeHousehold.id
                  ? "bg-[#6C63FF]/10 text-[#6C63FF] font-semibold"
                  : "text-gray-700"
              }`}
              onClick={() => {
                setActiveHousehold(h);
                setDropdownOpen(false);
              }}
            >
              {h.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
