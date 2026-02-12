import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MonthlyTotal } from "@/components/dashboard/monthly-total";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import * as dashboardService from "@/services/dashboard.service";
import { getCurrentYearMonth, getMonthName } from "@/lib/utils/date";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get user profile for base currency
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("base_currency")
    .eq("id", user!.id)
    .single();

  const baseCurrency = profile?.base_currency ?? "USD";
  const { month, year } = getCurrentYearMonth();

  // Fetch data in parallel
  const [summary, recentExpenses] = await Promise.all([
    dashboardService.getMonthlySummary(supabase, month, year),
    dashboardService.getRecentExpenses(supabase, 7),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>

      {/* Monthly stats */}
      <MonthlyTotal
        summary={summary}
        baseCurrency={baseCurrency}
        month={month}
        year={year}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Pie chart — takes more space */}
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle className="text-zinc-900">
              Gastos por categoría — {getMonthName(month)} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={summary.categoryBreakdown}
              baseCurrency={baseCurrency}
            />
          </CardContent>
        </Card>

        {/* Recent expenses */}
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-zinc-900">Gastos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentExpenses
              expenses={recentExpenses}
              baseCurrency={baseCurrency}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
