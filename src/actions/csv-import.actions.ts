"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as categoryService from "@/services/category.service";
import * as expenseService from "@/services/expense.service";
import * as exchangeRateService from "@/services/exchange-rate.service";
import type {
  CsvExpensePayload,
  ImportResult,
  ImportedRowResult,
} from "@/types/csv-import";

/**
 * Server Action: Import multiple expenses from parsed CSV data.
 * Handles category auto-creation, currency conversion, and batch insert.
 * Returns a detailed report of what happened with each row.
 */
export async function importExpensesAction(
  rows: CsvExpensePayload[]
): Promise<ImportResult> {
  const supabase = await createClient();

  // Get authenticated user + base currency
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      inserted: 0,
      defaulted: 0,
      errors: rows.length,
      discarded: 0,
      details: rows.map((_, i) => ({
        rowIndex: i,
        success: false,
        defaults_applied: [],
        error: "Usuario no autenticado",
      })),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user.id)
    .single();

  const baseCurrency = profile?.base_currency ?? "USD";

  // Cache resolved categories to avoid duplicate DB lookups
  const categoryCache = new Map<string, string>(); // name -> id
  const details: ImportedRowResult[] = [];
  let inserted = 0;
  let defaulted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // 1. Resolve category (with cache)
      let categoryId = categoryCache.get(row.category.toLowerCase());
      if (!categoryId) {
        const category = await categoryService.findOrCreateCategory(
          supabase,
          row.category
        );
        categoryId = category.id;
        categoryCache.set(row.category.toLowerCase(), categoryId);
      }

      // 2. Get exchange rate conversion
      const { amount_in_base, exchange_rate_used } =
        await exchangeRateService.convertAmount(
          supabase,
          row.amount,
          row.currency,
          baseCurrency
        );

      // 3. Insert expense
      await expenseService.createExpense(supabase, {
        category_id: categoryId,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        expense_date: row.expense_date,
        amount_in_base,
        exchange_rate_used,
        source: "csv",
      });

      const hadDefaults = row.defaults_applied.length > 0;
      details.push({
        rowIndex: i,
        success: true,
        defaults_applied: row.defaults_applied,
      });

      inserted++;
      if (hadDefaults) defaulted++;
    } catch (err) {
      errors++;
      details.push({
        rowIndex: i,
        success: false,
        defaults_applied: row.defaults_applied,
        error:
          err instanceof Error ? err.message : "Error desconocido al insertar",
      });
    }
  }

  // Revalidate pages that show expense data
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/expenses/import");

  return { inserted, defaulted, errors, discarded: 0, details };
}
