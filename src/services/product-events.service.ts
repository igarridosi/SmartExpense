import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductEventPayload } from "@/types/product-event";

export async function trackProductEvent(
  supabase: SupabaseClient,
  payload: ProductEventPayload,
  explicitUserId?: string | null
): Promise<void> {
  let userId = explicitUserId ?? null;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return;
  }

  const { error } = await supabase.from("product_events").insert({
    user_id: userId,
    event_name: payload.name,
    event_context: payload.context,
    metadata: payload.metadata ?? {},
  });

  if (error) {
    throw new Error(`Error tracking event: ${error.message}`);
  }
}
