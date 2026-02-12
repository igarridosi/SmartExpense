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
      {/* Expense cards */}
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

      {/* Pagination */}
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
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        {/* Category icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
          style={{
            backgroundColor: `${expense.categories.color}20`,
          }}
        >
          {expense.categories.icon}
        </div>

        {/* Details */}
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

      {/* Amount + actions */}
      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            🗑️
          </Button>
        </div>
      </div>

      {deleteError && (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      )}
    </Card>
  );
}
