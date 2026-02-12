/** Supported currencies with display info */
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "CZK", name: "Corona checa", symbol: "Kč" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "JPY", name: "Yen japonés", symbol: "¥" },
  { code: "CAD", name: "Dólar canadiense", symbol: "CA$" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/** Default pagination */
export const DEFAULT_PAGE_SIZE = 15;

/** Exchange rate API */
export const EXCHANGE_RATE_API_URL =
  process.env.EXCHANGE_RATE_API_URL || "https://api.frankfurter.app";
