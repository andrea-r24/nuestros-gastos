import { createClient } from "./supabase-browser";
import { categoryType } from "./utils";
import {
  isMockMode,
  MOCK_HOUSEHOLD,
  MOCK_HOUSEHOLDS,
  MOCK_MEMBERS,
  MOCK_EXPENSES,
} from "./mock-data";

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

  const { data } = await createClient()
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

  const { data } = await createClient()
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
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return MOCK_EXPENSES.filter((e) => e.expense_date.startsWith(prefix));
  }

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const { data } = await createClient()
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
    const payer = MOCK_MEMBERS.find((m) => m.user_id === paidBy);
    const today = new Date().toISOString().split("T")[0];
    MOCK_EXPENSES.unshift({
      id: Date.now(),
      paid_by: paidBy,
      payer_name: payer?.name ?? "Tu",
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

  const { error } = await createClient()
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

  const { error } = await createClient()
    .from("households")
    .update({ monthly_budget: budget })
    .eq("id", householdId);
  if (error) throw error;
}

/** Actualiza el nombre del hogar */
export async function updateHouseholdName(householdId: number, name: string) {
  if (isMockMode()) { MOCK_HOUSEHOLD.name = name; return; }

  const { error } = await createClient()
    .from("households")
    .update({ name })
    .eq("id", householdId);
  if (error) throw error;
}

/** Busca un usuario por su Telegram ID */
export async function getUserByTelegramId(
  telegramId: number
): Promise<{ id: number; name: string } | null> {
  const { data } = await createClient()
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
  const client = createClient();

  const { data: hh, error: hhError } = await client
    .from("households")
    .insert({ name, monthly_budget: budget })
    .select()
    .single();
  if (hhError || !hh) throw hhError ?? new Error("No se pudo crear el hogar");

  const { error: memberError } = await client.from("household_members").insert({ household_id: hh.id, user_id: userId, role: "owner" });
  if (memberError) throw memberError;

  const { error: updateError } = await client.from("users").update({ active_household_id: hh.id }).eq("id", userId);
  if (updateError) throw updateError;

  return { id: hh.id, name: hh.name, monthly_budget: hh.monthly_budget != null ? Number(hh.monthly_budget) : null };
}

/** Todos los hogares donde el usuario es miembro */
export async function getUserHouseholds(userId: number): Promise<Household[]> {
  if (isMockMode()) return MOCK_HOUSEHOLDS;

  const { data } = await createClient()
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

  const { error } = await createClient()
    .from("users")
    .update({ active_household_id: householdId })
    .eq("id", userId);
  if (error) throw error;
}

/** Agrega un miembro a un household */
export async function addMemberToHousehold(householdId: number, userId: number) {
  if (isMockMode()) throw new Error("No disponible en modo demo");
  const client = createClient();

  const { data: existing } = await client
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    throw new Error("El usuario ya es miembro de este hogar");
  }

  const { error } = await client
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

  const { error } = await createClient()
    .from("household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Invite helpers
// ---------------------------------------------------------------------------

export interface HouseholdInvite {
  id: number;
  household_id: number;
  code: string;
  created_by: number;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

/** Create an invite code for a household */
export async function createInvite(householdId: number, createdBy: number): Promise<HouseholdInvite> {
  if (isMockMode()) throw new Error("No disponible en modo demo");

  const code = generateInviteCode();
  const client = createClient();

  const { data, error } = await client
    .from("household_invites")
    .insert({
      household_id: householdId,
      code,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("No se pudo crear la invitacion");
  return data as HouseholdInvite;
}

/** Get active invites for a household */
export async function getHouseholdInvites(householdId: number): Promise<HouseholdInvite[]> {
  if (isMockMode()) return [];

  const { data } = await createClient()
    .from("household_invites")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return (data ?? []) as HouseholdInvite[];
}

/** Deactivate an invite */
export async function deactivateInvite(inviteId: number): Promise<void> {
  if (isMockMode()) return;

  const { error } = await createClient()
    .from("household_invites")
    .update({ is_active: false })
    .eq("id", inviteId);

  if (error) throw error;
}

/** Get household info by invite code (for public invite page) */
export async function getHouseholdByInviteCode(code: string): Promise<{ household_id: number; household_name: string } | null> {
  const { data } = await createClient()
    .from("household_invites")
    .select("household_id, households!household_id(name)")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return null;
  return {
    household_id: data.household_id,
    household_name: (data as any).households.name,
  };
}

// ---------------------------------------------------------------------------
// Custom subcategories
// ---------------------------------------------------------------------------

export interface CustomSubcategory {
  id: number;
  household_id: number;
  macro_category: string;
  name: string;
  created_by: number;
}

/** Get custom subcategories for a household */
export async function getCustomSubcategories(householdId: number): Promise<CustomSubcategory[]> {
  if (isMockMode()) return [];

  const { data } = await createClient()
    .from("custom_subcategories")
    .select("id, household_id, macro_category, name, created_by")
    .eq("household_id", householdId)
    .order("name");

  return (data ?? []) as CustomSubcategory[];
}

/** Create a custom subcategory */
export async function createCustomSubcategory(
  householdId: number,
  macroCategory: string,
  name: string,
  createdBy: number
): Promise<CustomSubcategory> {
  if (isMockMode()) throw new Error("No disponible en modo demo");

  const { data, error } = await createClient()
    .from("custom_subcategories")
    .insert({
      household_id: householdId,
      macro_category: macroCategory,
      name: name.trim(),
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CustomSubcategory;
}

/** Generate a random 8-character invite code */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude confusing chars: I, O, 0, 1
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
