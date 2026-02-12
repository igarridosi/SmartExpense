import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/constants";

/**
 * Zod schema for a single CSV row.
 * Used for validation + coercion during CSV import.
 * Invalid fields are transformed to sensible defaults (forced import strategy).
 */

const currencyCodes: string[] = SUPPORTED_CURRENCIES.map((c) => c.code);

/** Raw shape coming from PapaParse (all strings) */
export const csvRawRowSchema = z.object({
  date: z.string().optional().default(""),
  amount: z.string().optional().default(""),
  currency: z.string().optional().default(""),
  category: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type CsvRawRow = z.infer<typeof csvRawRowSchema>;

/** Validated + coerced row ready for insertion */
export interface CsvValidatedRow {
  expense_date: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  defaults_applied: string[]; // Track which fields had defaults applied
  discarded: boolean; // True if row should be skipped (invalid amount)
  discard_reason?: string;
}

/**
 * Validate and coerce a raw CSV row.
 * Applies the defaults from ARCHITECTURE.md §7 "Reglas de Defaults".
 */
export function validateCsvRow(
  raw: CsvRawRow,
  baseCurrency: string
): CsvValidatedRow {
  const defaults_applied: string[] = [];
  let discarded = false;
  let discard_reason: string | undefined;

  // --- Date validation ---
  let expense_date = raw.date.trim();
  if (!isValidDate(expense_date)) {
    expense_date = todayISO();
    defaults_applied.push("date → hoy");
  } else if (isFutureDate(expense_date)) {
    expense_date = todayISO();
    defaults_applied.push("date → hoy (era futura)");
  }

  // --- Amount validation ---
  const rawAmount = raw.amount.trim().replace(",", ".");
  let amount = parseFloat(rawAmount);

  if (isNaN(amount) || amount === 0) {
    discarded = true;
    discard_reason = `Monto inválido: "${raw.amount}"`;
    // Return early with zero values — row will be filtered out
    return {
      expense_date,
      amount: 0,
      currency: baseCurrency,
      category: raw.category.trim() || "Sin categoría",
      description: raw.description.trim() || "Sin descripción",
      defaults_applied,
      discarded,
      discard_reason,
    };
  }

  if (amount < 0) {
    amount = Math.abs(amount);
    defaults_applied.push("amount → abs()");
  }

  // --- Currency validation ---
  let currency = raw.currency.trim().toUpperCase();
  if (!currency || !currencyCodes.includes(currency)) {
    currency = baseCurrency;
    if (raw.currency.trim()) {
      defaults_applied.push(`currency → ${baseCurrency} (no reconocido: "${raw.currency.trim()}")`);
    } else {
      defaults_applied.push(`currency → ${baseCurrency}`);
    }
  }

  // --- Category validation ---
  let category = raw.category.trim();
  if (!category) {
    category = "Sin categoría";
    defaults_applied.push("category → 'Sin categoría'");
  }

  // --- Description validation ---
  let description = raw.description.trim();
  if (!description) {
    description = "Sin descripción";
    defaults_applied.push("description → 'Sin descripción'");
  }

  return {
    expense_date,
    amount,
    currency,
    category,
    description,
    defaults_applied,
    discarded,
  };
}

// --- Helpers ---

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  // Must match YYYY-MM-DD
  const match = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!match) return false;
  const date = new Date(dateStr + "T00:00:00");
  return !isNaN(date.getTime());
}

function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  return date > tomorrow;
}
