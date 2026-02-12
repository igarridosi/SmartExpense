import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Format a date string (YYYY-MM-DD) for display.
 */
export function formatDate(
  dateStr: string,
  pattern: string = "d MMM yyyy"
): string {
  try {
    return format(parseISO(dateStr), pattern, { locale: es });
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Get month name in Spanish for a given month number (1-12).
 */
export function getMonthName(month: number): string {
  const date = new Date(2026, month - 1, 1);
  return format(date, "MMMM", { locale: es });
}

/**
 * Get the current year and month.
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
