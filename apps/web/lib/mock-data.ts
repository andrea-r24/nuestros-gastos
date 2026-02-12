/**
 * Mock data for development / demo mode.
 * Activated by setting localStorage.dev_mock = "1".
 *
 * Represents a realistic two-person household in Lima.
 */

import type { AuthUser } from "./useAuth";
import type { Household, Member, Expense } from "./queries";

// ---------------------------------------------------------------------------
// Mock users
// ---------------------------------------------------------------------------
export const MOCK_USER: AuthUser = {
  id: 1,
  telegram_id: 999999,
  name: "Andrea",
  active_household_id: 1,
};

export const MOCK_USER_PAMELA: AuthUser = {
  id: 2,
  telegram_id: 888888,
  name: "Pamela",
  active_household_id: 1,
};

// ---------------------------------------------------------------------------
// Mock households
// ---------------------------------------------------------------------------
export const MOCK_HOUSEHOLD: Household = {
  id: 1,
  name: "Casa de Andrea y Pamela",
  monthly_budget: 3000,
};

export const MOCK_HOUSEHOLDS: Household[] = [
  MOCK_HOUSEHOLD,
  { id: 2, name: "Oficina", monthly_budget: null },
];

// ---------------------------------------------------------------------------
// Mock members
// ---------------------------------------------------------------------------
export const MOCK_MEMBERS: Member[] = [
  { user_id: 1, name: "Andrea", role: "owner" },
  { user_id: 2, name: "Pamela", role: "member" },
];

// ---------------------------------------------------------------------------
// Mock expenses — realistic Lima household spending for Feb 2026
// ---------------------------------------------------------------------------
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");

function date(day: number): string {
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 1,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 284.5,
    category: "Supermercado",
    type: "variable",
    description: "Plaza Vea semanal",
    store: "Plaza Vea",
    shared_with: [1, 2],
    expense_date: date(2),
  },
  {
    id: 2,
    paid_by: 2,
    payer_name: "Pamela",
    amount: 189.9,
    category: "Supermercado",
    type: "variable",
    description: "Wong quincena",
    store: "Wong",
    shared_with: [1, 2],
    expense_date: date(4),
  },
  {
    id: 3,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 450,
    category: "Servicios",
    type: "fixed",
    description: "Alquiler parte Andrea",
    store: null,
    shared_with: [1],
    expense_date: date(1),
  },
  {
    id: 4,
    paid_by: 2,
    payer_name: "Pamela",
    amount: 450,
    category: "Servicios",
    type: "fixed",
    description: "Alquiler parte Pamela",
    store: null,
    shared_with: [2],
    expense_date: date(1),
  },
  {
    id: 5,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 89,
    category: "Servicios",
    type: "fixed",
    description: "Luz + agua",
    store: null,
    shared_with: [1, 2],
    expense_date: date(3),
  },
  {
    id: 6,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 67.8,
    category: "Delivery",
    type: "variable",
    description: "Pedidos Ya cena",
    store: "PedidosYa",
    shared_with: [1, 2],
    expense_date: date(5),
  },
  {
    id: 7,
    paid_by: 2,
    payer_name: "Pamela",
    amount: 55,
    category: "Delivery",
    type: "variable",
    description: "Rappi almuerzo",
    store: "Rappi",
    shared_with: [1, 2],
    expense_date: date(6),
  },
  {
    id: 8,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 120,
    category: "Suscripciones",
    type: "fixed",
    description: "Netflix + Spotify",
    store: null,
    shared_with: [1, 2],
    expense_date: date(1),
  },
  {
    id: 9,
    paid_by: 2,
    payer_name: "Pamela",
    amount: 45,
    category: "Transporte",
    type: "variable",
    description: "Uber semana",
    store: "Uber",
    shared_with: [2],
    expense_date: date(7),
  },
  {
    id: 10,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 38,
    category: "Transporte",
    type: "variable",
    description: "InDriver",
    store: "InDriver",
    shared_with: [1],
    expense_date: date(8),
  },
  {
    id: 11,
    paid_by: 2,
    payer_name: "Pamela",
    amount: 160,
    category: "Salud",
    type: "variable",
    description: "Farmacia + consulta",
    store: "Inkafarma",
    shared_with: [1, 2],
    expense_date: date(5),
  },
  {
    id: 12,
    paid_by: 1,
    payer_name: "Andrea",
    amount: 95,
    category: "Entretenimiento",
    type: "variable",
    description: "Cine + palomitas",
    store: "Cineplanet",
    shared_with: [1, 2],
    expense_date: date(9),
  },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
export function isMockMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("dev_mock") === "1";
}
