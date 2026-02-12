import { SUPPORTED_CURRENCIES } from "./constants";

/**
 * Format a number as currency.
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "es-ES"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is not valid for Intl
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Get the display symbol for a currency code */
export function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return currency?.symbol ?? code;
}

/** Check if a currency code is supported */
export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code.toUpperCase());
}
