import {
  Home,
  Wrench,
  ShoppingCart,
  UtensilsCrossed,
  Zap,
  Lightbulb,
  Droplet,
  Phone,
  Smartphone,
  Car,
  Fuel,
  Shield,
  CreditCard,
  Film,
  ShoppingBag,
  Sparkles,
  Wallet,
  HeartPulse,
  Pill,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MacroCategoryKey =
  | "vivienda"
  | "alimentos"
  | "servicios"
  | "transporte"
  | "entretenimiento"
  | "salud"
  | "otros";

export interface SubCategory {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface MacroCategory {
  name: string;
  icon: LucideIcon;
  color: string;
  subcategories: SubCategory[];
}

// ---------------------------------------------------------------------------
// Hierarchy
// ---------------------------------------------------------------------------

export const categoryHierarchy: Record<MacroCategoryKey, MacroCategory> = {
  vivienda: {
    name: "Vivienda",
    icon: Home,
    color: "#10B981",
    subcategories: [
      { id: "alquiler", name: "Alquiler y/o Hipoteca", icon: Home },
      { id: "mantenimiento", name: "Mantenimiento", icon: Wrench },
    ],
  },

  alimentos: {
    name: "Alimentos",
    icon: ShoppingCart,
    color: "#EC4899",
    subcategories: [
      { id: "supermercado", name: "Supermercado", icon: ShoppingCart },
      { id: "delivery", name: "Delivery", icon: UtensilsCrossed },
    ],
  },

  servicios: {
    name: "Servicios",
    icon: Zap,
    color: "#3B82F6",
    subcategories: [
      { id: "luz", name: "Luz", icon: Lightbulb },
      { id: "agua", name: "Agua", icon: Droplet },
      { id: "telefono", name: "Teléfono/Internet", icon: Phone },
      { id: "suscripciones", name: "Suscripciones", icon: Smartphone },
    ],
  },

  transporte: {
    name: "Transporte",
    icon: Car,
    color: "#F59E0B",
    subcategories: [
      { id: "taxi", name: "Taxis/Uber", icon: Car },
      { id: "gasolina", name: "Gasolina", icon: Fuel },
      { id: "seguro_vehicular", name: "Seguro vehicular", icon: Shield },
      { id: "credito_vehicular", name: "Pago crédito vehicular", icon: CreditCard },
    ],
  },

  entretenimiento: {
    name: "Entretenimiento",
    icon: Film,
    color: "#8B5CF6",
    subcategories: [
      { id: "restaurantes", name: "Restaurantes", icon: UtensilsCrossed },
      { id: "cine", name: "Cine", icon: Film },
      { id: "ropa", name: "Ropa", icon: ShoppingBag },
      { id: "masajes", name: "Masajes/Spa", icon: Sparkles },
    ],
  },

  salud: {
    name: "Salud",
    icon: HeartPulse,
    color: "#EF4444",
    subcategories: [
      { id: "salud", name: "Salud", icon: HeartPulse },
      { id: "farmacia", name: "Farmacia", icon: Pill },
    ],
  },

  otros: {
    name: "Otros",
    icon: Wallet,
    color: "#64748B",
    subcategories: [{ id: "varios", name: "Varios", icon: Wallet }],
  },
};

// ---------------------------------------------------------------------------
// DB value → new sub ID mapping
// Handles old capitalized category strings stored in the DB.
// ---------------------------------------------------------------------------
const DB_ALIASES: Record<string, string> = {
  Alquiler: "alquiler",
  Mantenimiento: "mantenimiento",
  Supermercado: "supermercado",
  Delivery: "delivery",
  "Luz y agua": "luz",
  Telefono: "telefono",
  Suscripciones: "suscripciones",
  Taxi: "taxi",
  Gasolina: "gasolina",
  "Seguro auto": "seguro_vehicular",
  "Credito auto": "credito_vehicular",
  Restaurante: "restaurantes",
  Cine: "cine",
  Ropa: "ropa",
  Bienestar: "masajes",
  // Legacy single-word categories
  Servicios: "suscripciones",
  Transporte: "taxi",
  Entretenimiento: "cine",
  Salud: "salud",
  Farmacia: "farmacia",
  Otros: "varios",
};

// ---------------------------------------------------------------------------
// getCategoryInfo
// ---------------------------------------------------------------------------

export interface CategoryInfo {
  macroKey: MacroCategoryKey;
  macroName: string;
  macroColor: string;
  macroIcon: LucideIcon;
  subId: string;
  subName: string;
  subIcon: LucideIcon;
}

/** Resolves any DB category string (old or new) to display info with Lucide icons. */
export function getCategoryInfo(rawCategory: string): CategoryInfo {
  const normalized = DB_ALIASES[rawCategory] ?? rawCategory.toLowerCase().replace(/\s/g, "_");

  for (const [macroKey, macro] of Object.entries(categoryHierarchy) as [MacroCategoryKey, MacroCategory][]) {
    const sub = macro.subcategories.find((s) => s.id === normalized);
    if (sub) {
      return {
        macroKey,
        macroName: macro.name,
        macroColor: macro.color,
        macroIcon: macro.icon,
        subId: sub.id,
        subName: sub.name,
        subIcon: sub.icon,
      };
    }
  }

  // Fallback: otros / varios
  const otros = categoryHierarchy.otros;
  const varios = otros.subcategories[0];
  return {
    macroKey: "otros",
    macroName: otros.name,
    macroColor: otros.color,
    macroIcon: otros.icon,
    subId: varios.id,
    subName: varios.name,
    subIcon: varios.icon,
  };
}
