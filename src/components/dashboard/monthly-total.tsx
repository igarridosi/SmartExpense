import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { getMonthName } from "@/lib/utils/date";
import type { MonthlySummary } from "@/services/dashboard.service";

/**
 * Server Component: Displays the monthly total and key stats.
 */

interface MonthlyTotalProps {
  summary: MonthlySummary;
  baseCurrency: string;
  month: number;
  year: number;
}

export function MonthlyTotal({
  summary,
  baseCurrency,
  month,
  year,
}: MonthlyTotalProps) {
  const monthName = getMonthName(month);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total spending */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Total del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.total, baseCurrency)}
          </p>
          <p className="mt-1 text-sm text-gray-500 capitalize">
            {monthName} {year}
          </p>
        </CardContent>
      </Card>

      {/* Number of expenses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Gastos registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{summary.count}</p>
          <p className="mt-1 text-sm text-gray-500">
            {summary.count === 1 ? "transacción" : "transacciones"}
          </p>
        </CardContent>
      </Card>

      {/* Average per expense */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Promedio por gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.avgPerExpense, baseCurrency)}
          </p>
          <p className="mt-1 text-sm text-gray-500">por transacción</p>
        </CardContent>
      </Card>
    </div>
  );
}
