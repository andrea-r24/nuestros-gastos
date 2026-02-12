import { format } from "date-fns";
import { es } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Currency formatting (Peruvian Sol)
// ---------------------------------------------------------------------------
/** Format a number as "S/ 1,234.56" */
export function formatCurrency(amount: number): string {
  return (
    "S/ " +
    amount.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
/** Format a Date as "Enero 2026" (Spanish, capitalized month) */
export function formatMonthYear(date: Date): string {
  const raw = format(date, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Format a date string "2026-01-05" as "5 ene" (short Spanish) */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00"); // noon to avoid TZ shift
  return format(date, "d MMM", { locale: es });
}

// ---------------------------------------------------------------------------
// Category definitions — backed by the new hierarchical types/categories.ts
// Legacy flat category names are still supported for DB backward compatibility.
// ---------------------------------------------------------------------------
import { MACRO_CATEGORIES, getMacro, ALL_SUBCATEGORIES } from "@/types/categories";

export interface CategoryDef {
  type: "fixed" | "variable";
  hex: string;
}

// Fixed macro-category colors
const MACRO_HEX: Record<string, string> = {
  vivienda: "#6366F1",
  alimentos: "#22C55E",
  servicios: "#F97316",
  transporte: "#0EA5E9",
  entretenimiento: "#A855F7",
  salud: "#EC4899",
  otros: "#9CA3AF",
};

// Legacy flat categories kept for backward compat with old DB rows
const LEGACY_HEX: Record<string, string> = {
  Servicios: "#FF6B6B",
  Transporte: "#0EA5E9",
  Entretenimiento: "#A855F7",
};

export const CATEGORIES: Record<string, CategoryDef> = {
  // Legacy entries (old DB rows)
  Supermercado:    { type: "variable", hex: "#22C55E" },
  Delivery:        { type: "variable", hex: "#F97316" },
  Servicios:       { type: "fixed",    hex: "#FF6B6B" },
  Suscripciones:   { type: "fixed",    hex: "#A855F7" },
  Transporte:      { type: "variable", hex: "#0EA5E9" },
  Salud:           { type: "variable", hex: "#EC4899" },
  Entretenimiento: { type: "variable", hex: "#A855F7" },
  Mantenimiento:   { type: "fixed",    hex: "#6366F1" },
  Otros:           { type: "variable", hex: "#9CA3AF" },
  // New subcategory entries
  Alquiler:        { type: "fixed",    hex: "#6366F1" },
  "Luz y agua":    { type: "fixed",    hex: "#F97316" },
  Telefono:        { type: "fixed",    hex: "#F97316" },
  Taxi:            { type: "variable", hex: "#0EA5E9" },
  Gasolina:        { type: "variable", hex: "#0EA5E9" },
  "Seguro auto":   { type: "fixed",    hex: "#0EA5E9" },
  "Credito auto":  { type: "fixed",    hex: "#0EA5E9" },
  Restaurante:     { type: "variable", hex: "#A855F7" },
  Cine:            { type: "variable", hex: "#A855F7" },
  Ropa:            { type: "variable", hex: "#A855F7" },
  Bienestar:       { type: "variable", hex: "#A855F7" },
};

export const VALID_CATEGORIES = ALL_SUBCATEGORIES.map((s) => s.id);

/** Return the hex color for a category (subcategory or legacy), defaulting to Otros gray */
export function categoryHex(category: string): string {
  if (CATEGORIES[category]) return CATEGORIES[category].hex;
  // Derive from macro
  const macro = getMacro(category);
  return MACRO_HEX[macro.id] ?? "#9CA3AF";
}

/** Return the type tag ("fixed" | "variable") for a category */
export function categoryType(category: string): "fixed" | "variable" {
  return CATEGORIES[category]?.type ?? "variable";
}
