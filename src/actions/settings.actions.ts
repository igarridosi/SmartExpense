"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
});

const updateCurrencySchema = z.object({
  base_currency: z
    .string()
    .length(3, "Código de moneda inválido")
    .toUpperCase(),
});

export type SettingsActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfileAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const raw = {
    display_name: formData.get("display_name") as string,
  };

  const result = updateProfileSchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Usuario no autenticado" };

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: result.data.display_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    // Also update auth metadata for topbar display
    await supabase.auth.updateUser({
      data: { display_name: result.data.display_name },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al actualizar perfil",
    };
  }
}

export async function updateBaseCurrencyAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const raw = {
    base_currency: formData.get("base_currency") as string,
  };

  const result = updateCurrencySchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Usuario no autenticado" };

    const { error } = await supabase
      .from("profiles")
      .update({
        base_currency: result.data.base_currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al actualizar la moneda base",
    };
  }
}
