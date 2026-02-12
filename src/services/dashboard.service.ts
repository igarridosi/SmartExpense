import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseWithCategory } from "@/types/expense";

/**
 * Dashboard service — aggregation queries for the dashboard.
 * All amounts are in the user's base currency (amount_in_base).
 */

/** Category spending breakdown for pie chart */
export interface CategorySpending {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
}

/** Monthly summary data */
export interface MonthlySummary {
  total: number;
  count: number;
  avgPerExpense: number;
  categoryBreakdown: CategorySpending[];
}

/**
 * Get monthly spending summary for the dashboard.
 * Aggregates expenses for the given month/year in base currency.
 */
export async function getMonthlySummary(
  supabase: SupabaseClient,
  month: number,
  year: number
): Promise<MonthlySummary> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      amount_in_base,
      category_id,
      categories (id, name, icon, color)
    `)
    .gte("expense_date", startDate)
    .lt("expense_date", endDate);

  if (error) throw new Error(`Error fetching summary: ${error.message}`);

  // Supabase returns joined relations — normalize the shape
  const raw = (data ?? []) as unknown as Array<{
    amount_in_base: number;
    category_id: string;
    categories: { id: string; name: string; icon: string; color: string };
  }>;

  // Calculate total
  const total = raw.reduce((sum, e) => sum + e.amount_in_base, 0);
  const count = raw.length;
  const avgPerExpense = count > 0 ? total / count : 0;

  // Group by category
  const categoryMap = new Map<
    string,
    {
      category_name: string;
      category_icon: string;
      category_color: string;
      total: number;
      count: number;
    }
  >();

  for (const expense of raw) {
    const cat = expense.categories;
    const existing = categoryMap.get(expense.category_id);

    if (existing) {
      existing.total += expense.amount_in_base;
      existing.count++;
    } else {
      categoryMap.set(expense.category_id, {
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        total: expense.amount_in_base,
        count: 1,
      });
    }
  }

  // Convert to array with percentages, sorted by total desc
  const categoryBreakdown: CategorySpending[] = Array.from(
    categoryMap.entries()
  )
    .map(([category_id, data]) => ({
      category_id,
      ...data,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { total, count, avgPerExpense, categoryBreakdown };
}

/**
 * Get the most recent expenses for the dashboard widget.
 * Returns the last N expenses with category info.
 */
export async function getRecentExpenses(
  supabase: SupabaseClient,
  limit: number = 7
): Promise<ExpenseWithCategory[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select(`*, categories (id, name, icon, color)`)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Error fetching recent expenses: ${error.message}`);
  return (data ?? []) as ExpenseWithCategory[];
}
