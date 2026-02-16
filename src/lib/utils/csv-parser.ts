import Papa from "papaparse";
import {
  csvRawRowSchema,
  validateCsvRow,
  type CsvValidatedRow,
} from "@/lib/validators/csv-row.schema";

/**
 * CSV parser — PapaParse wrapper with Zod validation.
 * Executed client-side. Parses CSV text, validates each row,
 * and returns validated rows grouped by status.
 */

export interface CsvParseResult {
  validRows: CsvValidatedRow[];
  discardedRows: CsvValidatedRow[];
  totalRows: number;
  defaultsCount: number; // Number of rows where at least one default was applied
}

/**
 * Parse CSV text and validate each row.
 * Expected format: date,amount,currency,category,description
 */
export function parseCsv(
  csvText: string,
  baseCurrency: string
): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  const validRows: CsvValidatedRow[] = [];
  const discardedRows: CsvValidatedRow[] = [];
  let defaultsCount = 0;

  for (const rawRow of parsed.data) {
    // Coerce to our expected shape using Zod (fills missing fields with "")
    const coerced = csvRawRowSchema.safeParse(rawRow);
    if (!coerced.success) {
      discardedRows.push({
        expense_date: "",
        amount: 0,
        currency: baseCurrency,
        category: "",
        description: "",
        defaults_applied: ["Fila con formato inválido"],
        discarded: true,
        discard_reason: "Formato de fila inválido",
      });
      continue;
    }

    const validated = validateCsvRow(coerced.data, baseCurrency);

    if (validated.discarded) {
      discardedRows.push(validated);
    } else {
      validRows.push(validated);
      if (validated.defaults_applied.length > 0) {
        defaultsCount++;
      }
    }
  }

  return {
    validRows,
    discardedRows,
    totalRows: parsed.data.length,
    defaultsCount,
  };
}

/**
 * Read a File object as text.
 * Returns the raw CSV string.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsText(file);
  });
}
