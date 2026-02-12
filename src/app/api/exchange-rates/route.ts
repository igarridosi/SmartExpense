import { NextResponse } from "next/server";
import { EXCHANGE_RATE_API_URL, SUPPORTED_CURRENCIES } from "@/lib/utils/constants";

/**
 * In-memory rate limit cache.
 * Tracks last fetch time per currency pair to enforce max 1 API call per pair per day.
 */
const rateLimitCache = new Map<string, number>();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/exchange-rates?from=USD&to=EUR
 * Proxy to Frankfurter API with rate limiting (1 fetch per pair per day).
 * Returns: { from, to, rate, date }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing 'from' and 'to' query parameters" },
      { status: 400 }
    );
  }

  // Validate currency codes
  const validCodes = SUPPORTED_CURRENCIES.map((c) => c.code);
  if (!validCodes.includes(from as (typeof validCodes)[number]) || !validCodes.includes(to as (typeof validCodes)[number])) {
    return NextResponse.json(
      { error: `Unsupported currency. Supported: ${validCodes.join(", ")}` },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json({
      from,
      to,
      rate: 1.0,
      date: new Date().toISOString().split("T")[0],
    });
  }

  // Rate limit check: max 1 API call per pair per day
  const pairKey = `${from}:${to}`;
  const lastFetch = rateLimitCache.get(pairKey);
  if (lastFetch && Date.now() - lastFetch < ONE_DAY_MS) {
    return NextResponse.json(
      { error: "Rate limited. Max 1 request per currency pair per day." },
      { status: 429 }
    );
  }

  try {
    const url = `${EXCHANGE_RATE_API_URL}/latest?from=${from}&to=${to}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24h cache
    });

    if (!response.ok) {
      throw new Error(`Frankfurter API responded with ${response.status}`);
    }

    const data = await response.json();
    const rate = data?.rates?.[to];

    if (typeof rate !== "number") {
      throw new Error("Invalid rate response from API");
    }

    // Mark pair as fetched for rate limiting
    rateLimitCache.set(pairKey, Date.now());

    return NextResponse.json({
      from,
      to,
      rate,
      date: data.date || new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("[/api/exchange-rates] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 502 }
    );
  }
}
