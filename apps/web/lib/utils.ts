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
// Category definitions — single source of truth for the frontend
// Must stay in sync with the Python CATEGORIES dict in supabase_client.py
// ---------------------------------------------------------------------------
export interface CategoryDef {
  type: "fixed" | "variable";
  hex: string;
}

export const CATEGORIES: Record<string, CategoryDef> = {
  Supermercado:    { type: "variable", hex: "#6C63FF" },
  Delivery:        { type: "variable", hex: "#F97316" },
  Servicios:       { type: "fixed",    hex: "#FF6B6B" },
  Suscripciones:   { type: "fixed",    hex: "#A855F7" },
  Transporte:      { type: "variable", hex: "#4ECDC4" },
  Salud:           { type: "variable", hex: "#A78BFA" },
  Entretenimiento: { type: "variable", hex: "#FFE66D" },
  Mantenimiento:   { type: "fixed",    hex: "#6B7280" },
  Otros:           { type: "variable", hex: "#9CA3AF" },
};

export const VALID_CATEGORIES = Object.keys(CATEGORIES);

/** Return the hex color for a category, defaulting to Otros gray */
export function categoryHex(category: string): string {
  return CATEGORIES[category]?.hex ?? CATEGORIES.Otros.hex;
}

/** Return the type tag ("fixed" | "variable") for a category */
export function categoryType(category: string): "fixed" | "variable" {
  return CATEGORIES[category]?.type ?? "variable";
}
