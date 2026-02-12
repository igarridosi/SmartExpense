/**
 * Domain types for categories.
 * Reflects the public.categories table in Supabase.
 */

export interface Category {
  id: string;
  user_id: string | null; // null = global category
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

/** Distinguishes global vs user-owned categories in the UI */
export type CategoryOwnership = "global" | "user";

/** Payload for creating a new user category */
export interface CreateCategoryPayload {
  name: string;
  icon: string;
  color: string;
}

/** Payload for updating a user category */
export interface UpdateCategoryPayload {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** Helper to determine ownership */
export function getCategoryOwnership(category: Category): CategoryOwnership {
  return category.user_id === null ? "global" : "user";
}
