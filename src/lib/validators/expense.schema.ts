import { z } from "zod";

export const createExpenseSchema = z.object({
  category_id: z.string().uuid("Categoría inválida"),
  description: z
    .string()
    .max(200, "La descripción no puede exceder 200 caracteres")
    .default(""),
  amount: z
    .number({ message: "El monto debe ser un número" })
    .positive("El monto debe ser mayor a 0")
    .max(999_999_999.99, "El monto excede el límite permitido"),
  currency: z
    .string()
    .length(3, "Código de moneda inválido (debe ser 3 caracteres, ej: USD)")
    .toUpperCase(),
  expense_date: z
    .string()
    .min(1, "La fecha es obligatoria")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
});

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().uuid("ID de gasto inválido"),
});

export const deleteExpenseSchema = z.object({
  id: z.string().uuid("ID de gasto inválido"),
});

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>;
