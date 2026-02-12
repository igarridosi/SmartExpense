import type { Category } from "@/types/category";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Category service — business logic layer.
 * All methods receive a Supabase client (already scoped to the user via RLS).
 */

/** Fetch all categories visible to the current user (global + own) */
export async function getCategories(
  supabase: SupabaseClient
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("user_id", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`Error fetching categories: ${error.message}`);
  return data as Category[];
}

/** Fetch a single category by ID */
export async function getCategoryById(
  supabase: SupabaseClient,
  id: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Category;
}

/** Create a new user-owned category */
export async function createCategory(
  supabase: SupabaseClient,
  payload: { name: string; icon: string; color: string }
): Promise<Category> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: payload.name,
      icon: payload.icon,
      color: payload.color,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre");
    }
    throw new Error(`Error creating category: ${error.message}`);
  }

  return data as Category;
}

/** Update a user-owned category (RLS prevents editing global ones) */
export async function updateCategory(
  supabase: SupabaseClient,
  payload: { id: string; name: string; icon: string; color: string }
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: payload.name,
      icon: payload.icon,
      color: payload.color,
    })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ya existe una categoría con ese nombre");
    }
    throw new Error(`Error updating category: ${error.message}`);
  }

  return data as Category;
}

/** Delete a user-owned category (RLS prevents deleting global ones) */
export async function deleteCategory(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar: hay gastos asociados a esta categoría"
      );
    }
    throw new Error(`Error deleting category: ${error.message}`);
  }
}

/**
 * Find or create a category by name for a user.
 * Used during CSV import: if the category doesn't exist, auto-create it.
 */
export async function findOrCreateCategory(
  supabase: SupabaseClient,
  name: string
): Promise<Category> {
  const trimmedName = name.trim();

  // First, check if a category with this name exists (global or user-owned)
  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", trimmedName)
    .limit(1)
    .single();

  if (existing) return existing as Category;

  // If not found, create a user-specific category
  return createCategory(supabase, {
    name: trimmedName,
    icon: "📦",
    color: "#6B7280",
  });
}
