import { getSupabaseClient } from "./supabase";
import { categoryType } from "./utils";
import {
  isMockMode,
  MOCK_HOUSEHOLD,
  MOCK_HOUSEHOLDS,
  MOCK_MEMBERS,
  MOCK_EXPENSES,
} from "./mock-data";

// ---------------------------------------------------------------------------
// RLS Context Helper
// ---------------------------------------------------------------------------

/**
 * Ensures RLS context is set before executing queries.
 * Call this before any RLS-protected query to set app.telegram_id.
 */
async function ensureRLSContext() {
  const telegramId = localStorage.getItem("telegram_id");
  if (!telegramId) {
    throw new Error("Not authenticated");
  }

  const client = getSupabaseClient();
  await client.rpc("set_telegram_context", { telegram_id: parseInt(telegramId, 10) });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Household {
  id: number;
  name: string;
  monthly_budget: number | null;
}

export interface Member {
  user_id: number;
  name: string;
  role: string;
}

export interface Expense {
  id: number;
  paid_by: number;
  payer_name: string;
  amount: number;
  category: string;
  type: "fixed" | "variable";
  description: string | null;
  store: string | null;
  shared_with: number[];
  expense_date: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map user_id → nombre, para resolver el array shared_with */
export function buildMemberMap(members: Member[]): Map<number, string> {
  return new Map(members.map((m) => [m.user_id, m.name]));
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Hogar: nombre + presupuesto */
export async function getHousehold(id: number): Promise<Household | null> {
  if (isMockMode()) return MOCK_HOUSEHOLD;
  await ensureRLSContext();

  const { data } = await getSupabaseClient()
    .from("households")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    monthly_budget: data.monthly_budget != null ? Number(data.monthly_budget) : null,
  };
}

/** Miembros activos de un hogar, con nombre del usuario */
export async function getHouseholdMembers(
  householdId: number
): Promise<Member[]> {
  if (isMockMode()) return MOCK_MEMBERS;
  await ensureRLSContext();

  const { data } = await getSupabaseClient()
    .from("household_members")
    .select("user_id, role, users!user_id(name)")
    .eq("household_id", householdId)
    .eq("is_active", true);

  return (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    name: row.users.name,
    role: row.role,
  }));
}

/** Gastos de un hogar para un mes dado, con nombre del pagador */
export async function getExpenses(
  householdId: number,
  year: number,
  month: number
): Promise<Expense[]> {
  if (isMockMode()) {
    // Filter mock expenses by the requested year/month
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return MOCK_EXPENSES.filter((e) => e.expense_date.startsWith(prefix));
  }
  await ensureRLSContext();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const { data } = await getSupabaseClient()
    .from("expenses")
    .select("*, users!paid_by(name)")
    .eq("household_id", householdId)
    .gte("expense_date", start)
    .lt("expense_date", end)
    .order("expense_date", { ascending: false });

  return (data ?? []).map((row: any) => ({
    id: row.id,
    paid_by: row.paid_by,
    payer_name: row.users.name,
    amount: Number(row.amount),
    category: row.category,
    type: row.type,
    description: row.description,
    store: row.store,
    shared_with: row.shared_with,
    expense_date: row.expense_date,
  }));
}

/** Inserta un gasto nuevo */
export async function insertExpense({
  householdId,
  paidBy,
  amount,
  category,
  description,
  sharedWith,
}: {
  householdId: number;
  paidBy: number;
  amount: number;
  category: string;
  description: string;
  sharedWith: number[];
}) {
  if (isMockMode()) {
    // In demo mode, add to mock expenses in memory (won't persist on refresh)
    const payer = MOCK_MEMBERS.find((m) => m.user_id === paidBy);
    const today = new Date().toISOString().split("T")[0];
    MOCK_EXPENSES.unshift({
      id: Date.now(),
      paid_by: paidBy,
      payer_name: payer?.name ?? "Tú",
      amount,
      category,
      type: "variable" as const,
      description: description || null,
      store: null,
      shared_with: sharedWith,
      expense_date: today,
    });
    return;
  }
  await ensureRLSContext();

  const { error } = await getSupabaseClient()
    .from("expenses")
    .insert({
      household_id: householdId,
      paid_by: paidBy,
      amount,
      category,
      type: categoryType(category),
      description: description || null,
      shared_with: sharedWith,
    });
  if (error) throw error;
}

/** Actualiza el presupuesto mensual del hogar */
export async function updateBudget(householdId: number, budget: number | null) {
  if (isMockMode()) { MOCK_HOUSEHOLD.monthly_budget = budget; return; }
  await ensureRLSContext();

  const { error } = await getSupabaseClient()
    .from("households")
    .update({ monthly_budget: budget })
    .eq("id", householdId);
  if (error) throw error;
}

/** Actualiza el nombre del hogar */
export async function updateHouseholdName(householdId: number, name: string) {
  if (isMockMode()) { MOCK_HOUSEHOLD.name = name; return; }
  await ensureRLSContext();

  const { error } = await getSupabaseClient()
    .from("households")
    .update({ name })
    .eq("id", householdId);
  if (error) throw error;
}

/** Busca un usuario por su Telegram ID */
export async function getUserByTelegramId(
  telegramId: number
): Promise<{ id: number; name: string } | null> {
  const { data } = await getSupabaseClient()
    .from("users")
    .select("id, name")
    .eq("telegram_id", telegramId)
    .single();
  return data;
}

/** Crea un nuevo hogar y lo activa para el usuario */
export async function createHousehold(userId: number, name: string, budget: number | null): Promise<Household> {
  if (isMockMode()) {
    const newHousehold: Household = { id: Date.now(), name, monthly_budget: budget };
    MOCK_HOUSEHOLDS.push(newHousehold);
    return newHousehold;
  }
  await ensureRLSContext();
  const client = getSupabaseClient();

  const { data: hh, error: hhError } = await client
    .from("households")
    .insert({ name, monthly_budget: budget })
    .select()
    .single();
  if (hhError || !hh) throw hhError ?? new Error("No se pudo crear el hogar");

  await client.from("household_members").insert({ household_id: hh.id, user_id: userId, role: "owner" });
  await client.from("users").update({ active_household_id: hh.id }).eq("id", userId);

  return { id: hh.id, name: hh.name, monthly_budget: hh.monthly_budget != null ? Number(hh.monthly_budget) : null };
}

/** Todos los hogares donde el usuario es miembro */
export async function getUserHouseholds(userId: number): Promise<Household[]> {
  if (isMockMode()) return MOCK_HOUSEHOLDS;
  await ensureRLSContext();

  const { data } = await getSupabaseClient()
    .from("household_members")
    .select("households!household_id(id, name, monthly_budget)")
    .eq("user_id", userId)
    .eq("is_active", true);

  return (data ?? []).map((row: any) => ({
    id: row.households.id,
    name: row.households.name,
    monthly_budget: row.households.monthly_budget != null ? Number(row.households.monthly_budget) : null,
  }));
}

/** Actualiza el hogar activo del usuario */
export async function setActiveHousehold(userId: number, householdId: number) {
  if (isMockMode()) { MOCK_HOUSEHOLD.id = householdId; return; }
  await ensureRLSContext();

  const { error } = await getSupabaseClient()
    .from("users")
    .update({ active_household_id: householdId })
    .eq("id", userId);
  if (error) throw error;
}

/** Agrega un miembro a un household */
export async function addMemberToHousehold(householdId: number, userId: number) {
  if (isMockMode()) throw new Error("No disponible en modo demo");
  await ensureRLSContext();

  // Check if already a member
  const { data: existing } = await getSupabaseClient()
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    throw new Error("El usuario ya es miembro de este hogar");
  }

  // Add as member
  const { error } = await getSupabaseClient()
    .from("household_members")
    .insert({
      household_id: householdId,
      user_id: userId,
      role: "member",
    });

  if (error) throw error;
}

/** Elimina un miembro de un household (no permite eliminar al owner) */
export async function removeMemberFromHousehold(householdId: number, userId: number) {
  if (isMockMode()) throw new Error("No disponible en modo demo");
  await ensureRLSContext();

  const { error } = await getSupabaseClient()
    .from("household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", userId);

  if (error) throw error;
}
