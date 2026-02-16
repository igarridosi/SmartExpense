import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { ExpenseWithCategory } from "@/types/expense";
import { CategoryIcon } from "@/components/ui/category-icon";

/**
 * Server Component: Shows the most recent expenses as a compact list.
 */

interface RecentExpensesProps {
  expenses: ExpenseWithCategory[];
  baseCurrency: string;
}

export function RecentExpenses({ expenses, baseCurrency }: RecentExpensesProps) {
  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-zinc-500">
          Aún no hay gastos registrados.
        </p>
        <Link
          href="/expenses"
          className="mt-2 inline-block text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          Registrar un gasto →
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-3">
            {/* Category icon */}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600">
              <CategoryIcon icon={expense.categories.icon} className="h-4 w-4" />
            </span>

            <div>
              <p className="text-sm font-medium text-zinc-900">
                {expense.description || "Sin descripción"}
              </p>
              <p className="text-xs text-zinc-500">
                {expense.categories.name} · {formatDate(expense.expense_date)}
                {expense.source === "csv" && (
                  <span className="ml-1 rounded bg-zinc-100 px-1 py-0.5 text-[10px] text-zinc-600">
                    CSV
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-900 [font-variant-numeric:tabular-nums]">
              {formatCurrency(expense.amount_in_base, baseCurrency)}
            </p>
            {expense.currency !== baseCurrency && (
              <p className="text-xs text-zinc-400 [font-variant-numeric:tabular-nums]">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            )}
          </div>
        </div>
      ))}

      <div className="pt-3">
        <Link
          href="/expenses"
          className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          Ver todos los gastos →
        </Link>
      </div>
    </div>
  );
}
