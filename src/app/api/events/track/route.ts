import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackProductEvent } from "@/services/product-events.service";

const eventSchema = z.object({
  name: z.enum([
    "auth_login_success",
    "auth_signup_success",
    "expense_created",
    "expense_updated",
    "expense_deleted",
    "insights_viewed",
    "insights_whatif_changed",
    "insights_goal_updated",
  ]),
  context: z.enum(["auth", "expenses", "insights", "dashboard", "settings"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();
    try {
      await trackProductEvent(supabase, parsed.data);
    } catch {
      return NextResponse.json({ ok: true, stored: false }, { status: 202 });
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
