/**
 * Two-level category hierarchy.
 *
 * DB stores the subcategory `id` as the `category` column value.
 * Macro-categories are UI-only groupings.
 *
 * Legacy DB values (from before this hierarchy was introduced) are mapped
 * via `LEGACY_CATEGORY_MAP` below.
 */

export interface SubCategory {
  id: string;       // value stored in DB
  label: string;    // display name
  emoji: string;
}

export interface MacroCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;    // hex
  subcategories: SubCategory[];
}

export const MACRO_CATEGORIES: MacroCategory[] = [
  {
    id: "vivienda",
    label: "Vivienda",
    emoji: "🏠",
    color: "#6366F1",
    subcategories: [
      { id: "Alquiler", label: "Alquiler / Hipoteca", emoji: "🔑" },
      { id: "Mantenimiento", label: "Mantenimiento", emoji: "🔧" },
    ],
  },
  {
    id: "alimentos",
    label: "Alimentos",
    emoji: "🛒",
    color: "#22C55E",
    subcategories: [
      { id: "Supermercado", label: "Supermercado", emoji: "🛒" },
      { id: "Delivery", label: "Delivery", emoji: "🍔" },
    ],
  },
  {
    id: "servicios",
    label: "Servicios",
    emoji: "💡",
    color: "#F97316",
    subcategories: [
      { id: "Luz y agua", label: "Luz y agua", emoji: "💡" },
      { id: "Telefono", label: "Teléfono e internet", emoji: "📡" },
      { id: "Suscripciones", label: "Suscripciones", emoji: "📱" },
    ],
  },
  {
    id: "transporte",
    label: "Transporte",
    emoji: "🚗",
    color: "#0EA5E9",
    subcategories: [
      { id: "Taxi", label: "Taxis / Ride-sharing", emoji: "🚕" },
      { id: "Gasolina", label: "Gasolina", emoji: "⛽" },
      { id: "Seguro auto", label: "Seguro vehicular", emoji: "🛡️" },
      { id: "Credito auto", label: "Crédito vehicular", emoji: "🚗" },
    ],
  },
  {
    id: "entretenimiento",
    label: "Entretenimiento",
    emoji: "🎬",
    color: "#A855F7",
    subcategories: [
      { id: "Restaurante", label: "Restaurantes", emoji: "🍽️" },
      { id: "Cine", label: "Cine y ocio", emoji: "🎬" },
      { id: "Ropa", label: "Ropa y accesorios", emoji: "👗" },
      { id: "Bienestar", label: "Masajes y bienestar", emoji: "💆" },
    ],
  },
  {
    id: "salud",
    label: "Salud",
    emoji: "💊",
    color: "#EC4899",
    subcategories: [
      { id: "Salud", label: "Salud y farmacia", emoji: "💊" },
    ],
  },
  {
    id: "otros",
    label: "Otros",
    emoji: "📦",
    color: "#9CA3AF",
    subcategories: [
      { id: "Otros", label: "Otros", emoji: "📦" },
    ],
  },
];

// All valid subcategory IDs (for DB inserts + FAB picker)
export const ALL_SUBCATEGORIES: SubCategory[] = MACRO_CATEGORIES.flatMap(
  (m) => m.subcategories
);

export const VALID_SUB_IDS = ALL_SUBCATEGORIES.map((s) => s.id);

/**
 * Legacy category names from the old flat system.
 * Maps old DB value → new subcategory id.
 */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Servicios: "Luz y agua",
  Transporte: "Taxi",
  Entretenimiento: "Cine",
  // These already match new IDs:
  Supermercado: "Supermercado",
  Delivery: "Delivery",
  Suscripciones: "Suscripciones",
  Mantenimiento: "Mantenimiento",
  Salud: "Salud",
  Otros: "Otros",
};

/** Normalize any category string (old or new) to the current sub-category ID. */
export function normalizeCategory(raw: string): string {
  if (VALID_SUB_IDS.includes(raw)) return raw;
  return LEGACY_CATEGORY_MAP[raw] ?? "Otros";
}

/** Find the macro-category that contains this subcategory. */
export function getMacro(subcategoryId: string): MacroCategory {
  const normalized = normalizeCategory(subcategoryId);
  return (
    MACRO_CATEGORIES.find((m) =>
      m.subcategories.some((s) => s.id === normalized)
    ) ?? MACRO_CATEGORIES[MACRO_CATEGORIES.length - 1]
  );
}

/** Get the SubCategory object for a given ID. */
export function getSubCategory(id: string): SubCategory {
  const normalized = normalizeCategory(id);
  return (
    ALL_SUBCATEGORIES.find((s) => s.id === normalized) ?? {
      id: normalized,
      label: normalized,
      emoji: "📦",
    }
  );
}
