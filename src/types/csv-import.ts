/**
 * Domain types for CSV import results.
 * Tracks what happened during a batch import: inserted, defaulted, errors.
 */

/** Result of a single row import attempt */
export interface ImportedRowResult {
  rowIndex: number;
  success: boolean;
  defaults_applied: string[];
  error?: string;
}

/** Summary returned by the importExpenses Server Action */
export interface ImportResult {
  inserted: number;
  defaulted: number; // Rows that succeeded but had defaults applied
  errors: number;    // Rows that failed during DB insert
  discarded: number; // Rows discarded during validation (invalid amount)
  details: ImportedRowResult[];
}

/** Payload sent from client to Server Action for each valid row */
export interface CsvExpensePayload {
  expense_date: string;
  amount: number;
  currency: string;
  category: string; // Category name (will be resolved via findOrCreateCategory)
  description: string;
  defaults_applied: string[];
}
