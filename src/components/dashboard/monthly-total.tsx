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
    <div className="grid gap-4 md:grid-cols-6">
      {/* Total spending */}
      <Card className="md:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Total del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
            {formatCurrency(summary.total, baseCurrency)}
          </p>
          <p className="mt-1 text-sm text-zinc-500 capitalize">
            {monthName} {year}
          </p>
        </CardContent>
      </Card>

      {/* Number of expenses */}
      <Card className="md:col-span-3 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Gastos registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
            {summary.count}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {summary.count === 1 ? "transacción" : "transacciones"}
          </p>
        </CardContent>
      </Card>

      {/* Average per expense */}
      <Card className="md:col-span-6 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500">
            Promedio por gasto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
            {formatCurrency(summary.avgPerExpense, baseCurrency)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">por transacción</p>
        </CardContent>
      </Card>
    </div>
  );
}
