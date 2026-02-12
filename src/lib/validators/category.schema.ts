import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
  icon: z
    .string()
    .min(1, "El ícono es obligatorio")
    .max(10, "Ícono demasiado largo"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido (ej: #FF5733)"),
});

export const updateCategorySchema = z.object({
  id: z.string().uuid("ID de categoría inválido"),
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
  icon: z
    .string()
    .min(1, "El ícono es obligatorio")
    .max(10, "Ícono demasiado largo"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hexadecimal inválido (ej: #FF5733)"),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid("ID de categoría inválido"),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
