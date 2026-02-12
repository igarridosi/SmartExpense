"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validators/category.schema";
import * as categoryService from "@/services/category.service";

export type CategoryActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const raw = {
    name: formData.get("name") as string,
    icon: formData.get("icon") as string,
    color: formData.get("color") as string,
  };

  const result = createCategorySchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = await createClient();
    await categoryService.createCategory(supabase, result.data);
    revalidatePath("/categories");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al crear la categoría",
    };
  }
}

export async function updateCategoryAction(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const raw = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    icon: formData.get("icon") as string,
    color: formData.get("color") as string,
  };

  const result = updateCategorySchema.safeParse(raw);
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const supabase = await createClient();
    await categoryService.updateCategory(supabase, result.data);
    revalidatePath("/categories");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al actualizar la categoría",
    };
  }
}

export async function deleteCategoryAction(
  formData: FormData
): Promise<CategoryActionState> {
  const raw = { id: formData.get("id") as string };

  const result = deleteCategorySchema.safeParse(raw);
  if (!result.success) {
    return { error: "ID de categoría inválido" };
  }

  try {
    const supabase = await createClient();
    await categoryService.deleteCategory(supabase, result.data.id);
    revalidatePath("/categories");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error al eliminar la categoría",
    };
  }
}
