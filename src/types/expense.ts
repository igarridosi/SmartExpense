/**
 * Domain types for expenses.
 * Reflects the public.expenses table in Supabase.
 */

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  currency: string;
  amount_in_base: number;
  exchange_rate_used: number;
  expense_date: string; // ISO date string (YYYY-MM-DD)
  source: "manual" | "csv";
  created_at: string;
  updated_at: string;
}

/** Expense joined with category info for display */
export interface ExpenseWithCategory extends Expense {
  categories: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

/** Payload for creating a new expense */
export interface CreateExpensePayload {
  category_id: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
}

/** Payload for updating an expense */
export interface UpdateExpensePayload extends CreateExpensePayload {
  id: string;
}

/** Filter options for expense listing */
export interface ExpenseFilters {
  month?: number;  // 1-12
  year?: number;
  category_id?: string;
  page?: number;
  pageSize?: number;
}

/** Paginated response */
export interface PaginatedExpenses {
  data: ExpenseWithCategory[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
