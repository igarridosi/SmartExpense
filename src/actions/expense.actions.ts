"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createExpenseSchema,
  updateExpenseSchema,
  deleteExpenseSchema,
} from "@/lib/validators/expense.schema";
import * as expenseService from "@/services/expense.service";
import * as exchangeRateService from "@/services/exchange-rate.service";
import { trackProductEvent } from "@/services/product-events.service";

export type ExpenseActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Get the exchange rate + converted amount using the exchange rate service.
 * Fetches from Frankfurter API with DB caching and fallback.
 */
async function getConversionInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  amount: number,
  currency: string,
  baseCurrency: string
): Promise<{ amount_in_base: number; exchange_rate_used: number }> {
  return exchangeRateService.convertAmount(supabase, amount, currency, baseCurrency);
}

export async function createExpenseAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const raw = {
    category_id: formData.get("category_id") as string,
    description: (formData.get("description") as string) ?? "",
    amount: Number(formData.get("amount")),
    currency: (formData.get("currency") as string) ?? "USD",
    expense_date: formData.get("expense_date") as string,
  };

  const result = createExpenseSchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const supabase = await createClient();

    // Get user's base currency from profile
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("base_currency")
      .eq("id", user!.id)
      .single();

    const baseCurrency = profile?.base_currency ?? "USD";
    const { amount_in_base, exchange_rate_used } = await getConversionInfo(
      supabase,
      result.data.amount,
      result.data.currency,
      baseCurrency
    );

    await expenseService.createExpense(supabase, {
      ...result.data,
      amount_in_base,
      exchange_rate_used,
    });

    await trackProductEvent(supabase, {
      name: "expense_created",
      context: "expenses",
      metadata: {
        category_id: result.data.category_id,
        currency: result.data.currency,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al crear el gasto",
    };
  }
}

export async function updateExpenseAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const raw = {
    id: formData.get("id") as string,
    category_id: formData.get("category_id") as string,
    description: (formData.get("description") as string) ?? "",
    amount: Number(formData.get("amount")),
    currency: (formData.get("currency") as string) ?? "USD",
    expense_date: formData.get("expense_date") as string,
  };

  const result = updateExpenseSchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("base_currency")
      .eq("id", user!.id)
      .single();

    const baseCurrency = profile?.base_currency ?? "USD";
    const { amount_in_base, exchange_rate_used } = await getConversionInfo(
      supabase,
      result.data.amount,
      result.data.currency,
      baseCurrency
    );

    await expenseService.updateExpense(supabase, {
      ...result.data,
      amount_in_base,
      exchange_rate_used,
    });

    await trackProductEvent(supabase, {
      name: "expense_updated",
      context: "expenses",
      metadata: {
        expense_id: result.data.id,
        category_id: result.data.category_id,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error al actualizar el gasto",
    };
  }
}

export async function deleteExpenseAction(
  formData: FormData
): Promise<ExpenseActionState> {
  const raw = { id: formData.get("id") as string };

  const result = deleteExpenseSchema.safeParse(raw);
  if (!result.success) {
    return { error: "ID de gasto inválido" };
  }

  try {
    const supabase = await createClient();
    await expenseService.deleteExpense(supabase, result.data.id);
    await trackProductEvent(supabase, {
      name: "expense_deleted",
      context: "expenses",
      metadata: {
        expense_id: result.data.id,
      },
    });
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Error al eliminar el gasto",
    };
  }
}
