import { getSupabaseClient } from "./supabase";
import { categoryType } from "./utils";

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
  const { error } = await getSupabaseClient()
    .from("households")
    .update({ monthly_budget: budget })
    .eq("id", householdId);
  if (error) throw error;
}
