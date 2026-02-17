"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseActionState,
} from "@/actions/expense.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { today } from "@/lib/utils/date";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/constants";
import type { Category } from "@/types/category";
import type { ExpenseWithCategory } from "@/types/expense";

interface ExpenseFormProps {
  categories: Category[];
  /** If provided, we're editing */
  expense?: ExpenseWithCategory;
  /** Called after successful save */
  onDone?: () => void;
}

const initialState: ExpenseActionState = {};

export function ExpenseForm({ categories, expense, onDone }: ExpenseFormProps) {
  const isEditing = !!expense;
  const action = isEditing ? updateExpenseAction : createExpenseAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state.success, onDone]);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name}`,
  }));

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {isEditing && <input type="hidden" name="id" value={expense.id} />}

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          label="Monto"
          placeholder="0.00"
          defaultValue={expense?.amount ?? ""}
          required
          error={state.fieldErrors?.amount?.[0]}
        />

        <Select
          id="currency"
          name="currency"
          label="Moneda"
          options={currencyOptions}
          defaultValue={expense?.currency ?? "USD"}
          error={state.fieldErrors?.currency?.[0]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="category_id"
          name="category_id"
          label="Categoría"
          options={categoryOptions}
          placeholder="Selecciona una categoría"
          defaultValue={expense?.category_id ?? ""}
          required
          error={state.fieldErrors?.category_id?.[0]}
        />

        <Input
          id="expense_date"
          name="expense_date"
          type="date"
          label="Fecha"
          defaultValue={expense?.expense_date ?? today()}
          required
          error={state.fieldErrors?.expense_date?.[0]}
        />
      </div>

      <Input
        id="description"
        name="description"
        type="text"
        label="Descripción (opcional)"
        placeholder="Ej: Almuerzo de trabajo"
        defaultValue={expense?.description ?? ""}
        error={state.fieldErrors?.description?.[0]}
      />

      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          {isEditing ? "Guardar cambios" : "Agregar gasto"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
