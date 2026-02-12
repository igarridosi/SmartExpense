import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ExpenseWithCategory,
  PaginatedExpenses,
  ExpenseFilters,
} from "@/types/expense";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

/**
 * Expense service — business logic layer.
 * All methods receive a Supabase client scoped to the user via RLS.
 */

const EXPENSE_SELECT = `
  *,
  categories (id, name, icon, color)
`;

/** Fetch expenses with pagination and filters */
export async function getExpenses(
  supabase: SupabaseClient,
  filters: ExpenseFilters = {}
): Promise<PaginatedExpenses> {
  const {
    month,
    year,
    category_id,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  let query = supabase
    .from("expenses")
    .select(EXPENSE_SELECT, { count: "exact" });

  // Filter by month/year
  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
    query = query.gte("expense_date", startDate).lt("expense_date", endDate);
  }

  // Filter by category
  if (category_id) {
    query = query.eq("category_id", category_id);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Error fetching expenses: ${error.message}`);

  const totalCount = count ?? 0;

  return {
    data: (data ?? []) as ExpenseWithCategory[],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/** Fetch a single expense by ID */
export async function getExpenseById(
  supabase: SupabaseClient,
  id: string
): Promise<ExpenseWithCategory | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ExpenseWithCategory;
}

/** Create a new expense */
export async function createExpense(
  supabase: SupabaseClient,
  payload: {
    category_id: string;
    description: string;
    amount: number;
    currency: string;
    expense_date: string;
    amount_in_base: number;
    exchange_rate_used: number;
    source?: "manual" | "csv";
  }
): Promise<ExpenseWithCategory> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      category_id: payload.category_id,
      description: payload.description || "",
      amount: payload.amount,
      currency: payload.currency,
      amount_in_base: payload.amount_in_base,
      exchange_rate_used: payload.exchange_rate_used,
      expense_date: payload.expense_date,
      source: payload.source ?? "manual",
    })
    .select(EXPENSE_SELECT)
    .single();

  if (error) throw new Error(`Error creating expense: ${error.message}`);
  return data as ExpenseWithCategory;
}

/** Update an existing expense */
export async function updateExpense(
  supabase: SupabaseClient,
  payload: {
    id: string;
    category_id: string;
    description: string;
    amount: number;
    currency: string;
    expense_date: string;
    amount_in_base: number;
    exchange_rate_used: number;
  }
): Promise<ExpenseWithCategory> {
  const { data, error } = await supabase
    .from("expenses")
    .update({
      category_id: payload.category_id,
      description: payload.description || "",
      amount: payload.amount,
      currency: payload.currency,
      amount_in_base: payload.amount_in_base,
      exchange_rate_used: payload.exchange_rate_used,
      expense_date: payload.expense_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .select(EXPENSE_SELECT)
    .single();

  if (error) throw new Error(`Error updating expense: ${error.message}`);
  return data as ExpenseWithCategory;
}

/** Delete an expense */
export async function deleteExpense(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw new Error(`Error deleting expense: ${error.message}`);
}
