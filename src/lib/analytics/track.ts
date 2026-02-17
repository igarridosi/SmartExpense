"use client";

import type { ProductEventPayload } from "@/types/product-event";

export async function trackEvent(payload: ProductEventPayload): Promise<void> {
  try {
    await fetch("/api/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    return;
  }
}
