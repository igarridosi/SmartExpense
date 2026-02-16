"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteExpenseAction } from "@/actions/expense.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExpenseForm } from "./expense-form";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { ExpenseWithCategory, PaginatedExpenses } from "@/types/expense";
import type { Category } from "@/types/category";
import { Pencil, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { OverflowMenu } from "@/components/ui/overflow-menu";

interface ExpenseListProps {
  expenses: PaginatedExpenses;
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  baseCurrency: string;
}

export function ExpenseList({
  expenses,
  categories,
  currentMonth,
  currentYear,
  baseCurrency,
}: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (expenses.data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">
          No hay gastos registrados para este período.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {expenses.data.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            categories={categories}
            baseCurrency={baseCurrency}
            isEditing={editingId === expense.id}
            onEdit={() => setEditingId(expense.id)}
            onDone={() => setEditingId(null)}
          />
        ))}
      </div>

      {expenses.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {expenses.page > 1 && (
            <Link
              href={`/expenses?month=${currentMonth}&year=${currentYear}&page=${expenses.page - 1}`}
            >
              <Button variant="secondary" size="sm">
                ← Anterior
              </Button>
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Página {expenses.page} de {expenses.totalPages}
          </span>
          {expenses.page < expenses.totalPages && (
            <Link
              href={`/expenses?month=${currentMonth}&year=${currentYear}&page=${expenses.page + 1}`}
            >
              <Button variant="secondary" size="sm">
                Siguiente →
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

interface ExpenseCardProps {
  expense: ExpenseWithCategory;
  categories: Category[];
  baseCurrency: string;
  isEditing: boolean;
  onEdit: () => void;
  onDone: () => void;
}

function ExpenseCard({
  expense,
  categories,
  baseCurrency,
  isEditing,
  onEdit,
  onDone,
}: ExpenseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <Card className="p-4">
        <ExpenseForm
          categories={categories}
          expense={expense}
          onDone={onDone}
        />
      </Card>
    );
  }

  async function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return;
    setIsDeleting(true);
    setDeleteError(null);

    const formData = new FormData();
    formData.set("id", expense.id);
    const result = await deleteExpenseAction(formData);

    if (result.error) {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600">
            <CategoryIcon icon={expense.categories.icon} className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">
              {expense.description || expense.categories.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{expense.categories.name}</span>
              <span>·</span>
              <span>{formatDate(expense.expense_date)}</span>
              {expense.source === "csv" && (
                <>
                  <span>·</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    CSV
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              {formatCurrency(expense.amount, expense.currency)}
            </p>
            {expense.currency !== baseCurrency && (
              <p className="text-xs text-gray-400">
                ≈ {formatCurrency(expense.amount_in_base, baseCurrency)}
              </p>
            )}
          </div>

          <OverflowMenu
            ariaLabel="Acciones del gasto"
            actions={[
              {
                label: "Editar",
                icon: Pencil,
                onClick: onEdit,
                disabled: isDeleting,
              },
              {
                label: "Eliminar",
                icon: Trash2,
                onClick: handleDelete,
                disabled: isDeleting,
              },
            ]}
          />
        </div>
      </div>

      {deleteError && (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      )}
    </Card>
  );
}
