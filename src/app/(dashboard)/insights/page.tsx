import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightsPanel } from "@/components/insights/insights-panel";
import { getMonthName } from "@/lib/utils/date";
import { getInsightsSnapshot } from "@/services/insights.service";

export const metadata: Metadata = {
  title: "Insights",
};

interface InsightsPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = await searchParams;
  const now = new Date();

  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const year = params.year ? Number(params.year) : now.getFullYear();

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("base_currency")
    .single();

  const monthLabel = getMonthName(month);
  const baseCurrency = profile?.base_currency ?? "USD";
  const snapshot = await getInsightsSnapshot(supabase, month, year, baseCurrency);

  return (
    <div className="space-y-5">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-zinc-900">
            Insights accionables — {monthLabel} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600">
            Tendencias avanzadas, categorías de mayor consumo y recomendaciones
            basadas en tus datos reales.
          </p>
        </CardContent>
      </Card>

      <InsightsPanel
        snapshot={snapshot}
        baseCurrency={baseCurrency}
        monthLabel={monthLabel}
        year={year}
      />
    </div>
  );
}
