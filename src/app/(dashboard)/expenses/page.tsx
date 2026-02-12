import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import * as expenseService from "@/services/expense.service";
import * as categoryService from "@/services/category.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { getCurrentYearMonth, getMonthName } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gastos",
};

interface ExpensesPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    page?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();

  const month = params.month ? parseInt(params.month) : currentMonth;
  const year = params.year ? parseInt(params.year) : currentYear;
  const page = params.page ? parseInt(params.page) : 1;

  const supabase = await createClient();

  const [expenses, categories, { data: profile }] = await Promise.all([
    expenseService.getExpenses(supabase, { month, year, page }),
    categoryService.getCategories(supabase),
    supabase.from("profiles").select("base_currency").single(),
  ]);

  const baseCurrency = profile?.base_currency ?? "USD";

  // Calculate prev/next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <div className="flex items-center gap-2">
          <Link href={`/expenses?month=${prevMonth}&year=${prevYear}`}>
            <Button variant="secondary" size="sm">
              ←
            </Button>
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium text-gray-700 capitalize">
            {getMonthName(month)} {year}
          </span>
          <Link href={`/expenses?month=${nextMonth}&year=${nextYear}`}>
            <Button variant="secondary" size="sm">
              →
            </Button>
          </Link>
        </div>
      </div>

      {/* Create new expense form */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} />
        </CardContent>
      </Card>

      {/* Expense list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Historial ({expenses.count} gastos)
        </h2>
        <ExpenseList
          expenses={expenses}
          categories={categories}
          currentMonth={month}
          currentYear={year}
          baseCurrency={baseCurrency}
        />
      </div>
    </div>
  );
}
