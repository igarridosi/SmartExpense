import type { SupabaseClient } from "@supabase/supabase-js";
import { EXCHANGE_RATE_API_URL } from "@/lib/utils/constants";

/**
 * Exchange rate service — handles fetching, caching, and converting currencies.
 * Uses Frankfurter API (free, no key) with a Supabase cache layer.
 */

interface RateResult {
  rate: number;
  source: "cache" | "api" | "fallback";
}

/**
 * Get the exchange rate from `fromCurrency` to `toCurrency`.
 * Strategy:
 *   1. Check DB cache for today's rate
 *   2. Fetch from Frankfurter API and cache
 *   3. Fallback to last known rate in DB
 *   4. Final fallback: rate = 1.0 (same currency)
 */
export async function getExchangeRate(
  supabase: SupabaseClient,
  fromCurrency: string,
  toCurrency: string
): Promise<RateResult> {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Same currency — no conversion needed
  if (from === to) {
    return { rate: 1.0, source: "cache" };
  }

  const today = new Date().toISOString().split("T")[0];

  // 1. Check cache for today
  const cached = await getCachedRate(supabase, from, to, today);
  if (cached !== null) {
    return { rate: cached, source: "cache" };
  }

  // 2. Fetch from API
  try {
    const apiRate = await fetchRateFromAPI(from, to);
    if (apiRate !== null) {
      // Cache it
      await cacheRate(supabase, from, to, apiRate, today);
      return { rate: apiRate, source: "api" };
    }
  } catch (err) {
    console.error("[ExchangeRate] API fetch failed:", err);
  }

  // 3. Fallback: last known rate from DB
  const fallback = await getLastKnownRate(supabase, from, to);
  if (fallback !== null) {
    return { rate: fallback, source: "fallback" };
  }

  // 4. Final fallback — should not happen for supported currencies
  console.warn(
    `[ExchangeRate] No rate found for ${from} → ${to}. Using 1.0`
  );
  return { rate: 1.0, source: "fallback" };
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertAmount(
  supabase: SupabaseClient,
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ amount_in_base: number; exchange_rate_used: number }> {
  const { rate } = await getExchangeRate(supabase, fromCurrency, toCurrency);
  return {
    amount_in_base: Math.round(amount * rate * 100) / 100,
    exchange_rate_used: rate,
  };
}

// ─── Internal helpers ─────────────────────────────────────

/** Check the DB cache for a specific date */
async function getCachedRate(
  supabase: SupabaseClient,
  base: string,
  target: string,
  date: string
): Promise<number | null> {
  const { data } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base", base)
    .eq("target", target)
    .eq("fetched_at", date)
    .single();

  return data ? Number(data.rate) : null;
}

/** Get the most recent cached rate (any date) */
async function getLastKnownRate(
  supabase: SupabaseClient,
  base: string,
  target: string
): Promise<number | null> {
  const { data } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base", base)
    .eq("target", target)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  return data ? Number(data.rate) : null;
}

/** Cache a rate in the DB */
async function cacheRate(
  supabase: SupabaseClient,
  base: string,
  target: string,
  rate: number,
  date: string
): Promise<void> {
  await supabase
    .from("exchange_rates")
    .upsert(
      { base, target, rate, fetched_at: date },
      { onConflict: "base,target,fetched_at" }
    );
}

/**
 * Fetch rate from Frankfurter API.
 * Frankfurter uses EUR as base by default, but supports other bases.
 * GET /latest?from=USD&to=EUR → { "rates": { "EUR": 0.92 } }
 */
async function fetchRateFromAPI(
  from: string,
  to: string
): Promise<number | null> {
  const url = `${EXCHANGE_RATE_API_URL}/latest?from=${from}&to=${to}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // Cache for 24h at the fetch level
  });

  if (!response.ok) {
    throw new Error(`Frankfurter API error: ${response.status}`);
  }

  const data = await response.json();
  const rate = data?.rates?.[to];

  if (typeof rate !== "number") {
    return null;
  }

  return rate;
}
