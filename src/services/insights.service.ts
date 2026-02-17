import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCurrency } from "@/lib/utils/currency";

interface InsightExpenseRow {
  amount_in_base: number;
  expense_date: string;
  source: "manual" | "csv";
  description: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface MonthlyTrendPoint {
  month: string;
  total: number;
  count: number;
  avg: number;
}

export interface CategoryInsightPoint {
  name: string;
  icon: string;
  color: string;
  total: number;
  share: number;
  count: number;
}

export interface WeekdayInsightPoint {
  day: string;
  total: number;
  count: number;
}

export interface DailyTrendPoint {
  day: number;
  total: number;
  count: number;
}

export interface TopExpenseInsightPoint {
  label: string;
  amount: number;
  category: string;
  icon: string;
  date: string;
}

export interface ActionableInsight {
  title: string;
  description: string;
  whyItMatters: string;
  recommendedAction: string;
  impactEstimate: string;
  severity: "info" | "success" | "warning";
}

export interface FinancialHealthPillar {
  key: "stability" | "concentration" | "consistency" | "control";
  label: string;
  score: number;
  weight: number;
  explanation: string;
}

export interface FinancialHealthSnapshot {
  score: number;
  label: "Sólida" | "Estable" | "En riesgo";
  summary: string;
  pillars: FinancialHealthPillar[];
}

export interface InsightsSnapshot {
  currentMonthTotal: number;
  previousMonthTotal: number;
  variationVsLastMonth: number;
  projectedMonthTotal: number;
  hasActionableInsights: boolean;
  monthlyTrend: MonthlyTrendPoint[];
  topCategories: CategoryInsightPoint[];
  weekdayTrend: WeekdayInsightPoint[];
  dailyTrend: DailyTrendPoint[];
  topSingleExpenses: TopExpenseInsightPoint[];
  financialHealth: FinancialHealthSnapshot;
  actionableIdeas: ActionableInsight[];
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", { month: "short" }).format(date);
}

function clampPct(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(-100, Math.min(999, value));
}

function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Insights service — builds actionable analytics for the Insights section.
 */
export async function getInsightsSnapshot(
  supabase: SupabaseClient,
  month: number,
  year: number,
  baseCurrency: string = "USD"
): Promise<InsightsSnapshot> {
  const selectedMonthStart = new Date(year, month - 1, 1);
  const previousMonthStart = new Date(year, month - 2, 1);
  const nextMonthStart = new Date(year, month, 1);

  const trendStart = new Date(year, month - 6, 1);

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `amount_in_base, expense_date, source, description, categories (name, icon, color)`
    )
    .gte("expense_date", toIsoDateOnly(trendStart))
    .lt("expense_date", toIsoDateOnly(nextMonthStart))
    .order("expense_date", { ascending: true });

  if (error) throw new Error(`Error fetching insights data: ${error.message}`);

  const raw = (data ?? []) as unknown as InsightExpenseRow[];

  const monthBuckets = new Map<string, { total: number; count: number }>();
  for (let i = 0; i < 6; i++) {
    const current = new Date(trendStart.getFullYear(), trendStart.getMonth() + i, 1);
    monthBuckets.set(getMonthKey(current), { total: 0, count: 0 });
  }

  const weekdayTotals = Array.from({ length: 7 }, (_, idx) => ({
    day: WEEKDAY_LABELS[idx],
    total: 0,
    count: 0,
  }));

  const daysInSelectedMonth = new Date(year, month, 0).getDate();
  const dailyTrendBase = Array.from({ length: daysInSelectedMonth }, (_, idx) => ({
    day: idx + 1,
    total: 0,
    count: 0,
  }));

  const currentMonthRows: InsightExpenseRow[] = [];

  for (const row of raw) {
    const expenseDate = new Date(`${row.expense_date}T00:00:00`);
    const monthKey = getMonthKey(getMonthStart(expenseDate));

    const bucket = monthBuckets.get(monthKey);
    if (bucket) {
      bucket.total += row.amount_in_base;
      bucket.count += 1;
    }

    if (expenseDate >= selectedMonthStart && expenseDate < nextMonthStart) {
      currentMonthRows.push(row);
      const weekday = expenseDate.getDay();
      const dayOfMonth = expenseDate.getDate();

      weekdayTotals[weekday].total += row.amount_in_base;
      weekdayTotals[weekday].count += 1;

      dailyTrendBase[dayOfMonth - 1].total += row.amount_in_base;
      dailyTrendBase[dayOfMonth - 1].count += 1;
    }
  }

  const monthlyTrend = Array.from(monthBuckets.entries()).map(([key, values]) => {
    const [y, m] = key.split("-").map(Number);
    const monthDate = new Date(y, m - 1, 1);

    return {
      month: getMonthLabel(monthDate),
      total: Math.round(values.total * 100) / 100,
      count: values.count,
      avg: values.count > 0 ? Math.round((values.total / values.count) * 100) / 100 : 0,
    };
  });

  const currentMonthTotal = currentMonthRows.reduce(
    (acc, row) => acc + row.amount_in_base,
    0
  );

  const previousMonthTotal =
    monthBuckets.get(getMonthKey(previousMonthStart))?.total ?? 0;

  const variationVsLastMonth =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  const today = new Date();
  const projectedDayDivisor =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? Math.max(1, today.getDate())
      : daysInSelectedMonth;
  const projectedMonthTotal = (currentMonthTotal / projectedDayDivisor) * daysInSelectedMonth;

  const categoryMap = new Map<
    string,
    { icon: string; color: string; total: number; count: number }
  >();

  for (const row of currentMonthRows) {
    const key = row.categories.name;
    const existing = categoryMap.get(key);

    if (existing) {
      existing.total += row.amount_in_base;
      existing.count += 1;
    } else {
      categoryMap.set(key, {
        icon: row.categories.icon,
        color: row.categories.color,
        total: row.amount_in_base,
        count: 1,
      });
    }
  }

  const topCategories = Array.from(categoryMap.entries())
    .map(([name, values]) => ({
      name,
      icon: values.icon,
      color: values.color,
      total: Math.round(values.total * 100) / 100,
      share:
        currentMonthTotal > 0
          ? Math.round(((values.total / currentMonthTotal) * 100) * 10) / 10
          : 0,
      count: values.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const weekdayTrend = weekdayTotals.map((item) => ({
    ...item,
    total: Math.round(item.total * 100) / 100,
  }));

  const dailyTrend = dailyTrendBase.map((item) => ({
    day: item.day,
    total: Math.round(item.total * 100) / 100,
    count: item.count,
  }));

  const topSingleExpenses = [...currentMonthRows]
    .sort((a, b) => b.amount_in_base - a.amount_in_base)
    .slice(0, 5)
    .map((expense) => ({
      label: expense.description?.trim() || expense.categories.name,
      amount: expense.amount_in_base,
      category: expense.categories.name,
      icon: expense.categories.icon,
      date: expense.expense_date,
    }));

  const topCategory = topCategories[0];
  const weekendTotal = weekdayTrend
    .filter((d) => d.day === "Sáb" || d.day === "Dom")
    .reduce((sum, d) => sum + d.total, 0);
  const weekendShare =
    currentMonthTotal > 0 ? (weekendTotal / currentMonthTotal) * 100 : 0;
  const weekdayTotal = Math.max(0, currentMonthTotal - weekendTotal);
  const activeDays = new Set(currentMonthRows.map((row) => row.expense_date)).size;
  const avgPerActiveDay = activeDays > 0 ? currentMonthTotal / activeDays : 0;

  const elapsedDaysInMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? Math.max(1, today.getDate())
      : daysInSelectedMonth;
  const activeDayRatio = activeDays / elapsedDaysInMonth;

  const stabilityScore = clampScore(100 - Math.min(100, Math.abs(variationVsLastMonth) * 1.25));
  const concentrationScore = clampScore(
    topCategory ? 100 - Math.max(0, (topCategory.share - 25) * 2.8) : 70
  );
  const consistencyScore = clampScore(activeDayRatio * 100);
  const controlScore = clampScore(100 - Math.max(0, (weekendShare - 35) * 2));

  const financialHealthPillars: FinancialHealthPillar[] = [
    {
      key: "stability",
      label: "Estabilidad mensual",
      score: Math.round(stabilityScore),
      weight: 0.3,
      explanation: `Mide cuánto varía tu gasto frente al mes anterior (${variationVsLastMonth >= 0 ? "+" : ""}${variationVsLastMonth.toFixed(1)}%).`,
    },
    {
      key: "concentration",
      label: "Diversificación por categoría",
      score: Math.round(concentrationScore),
      weight: 0.25,
      explanation: topCategory
        ? `${topCategory.name} concentra ${topCategory.share.toFixed(1)}% del gasto mensual.`
        : "No hay concentración relevante por categoría todavía.",
    },
    {
      key: "consistency",
      label: "Consistencia de registro",
      score: Math.round(consistencyScore),
      weight: 0.2,
      explanation: `Registraste gastos en ${activeDays} de ${elapsedDaysInMonth} días observados del mes.`,
    },
    {
      key: "control",
      label: "Control del patrón semanal",
      score: Math.round(controlScore),
      weight: 0.25,
      explanation: `El gasto de fin de semana representa ${weekendShare.toFixed(1)}% del total del mes.`,
    },
  ];

  const financialHealthScore = Math.round(
    financialHealthPillars.reduce((acc, pillar) => acc + pillar.score * pillar.weight, 0)
  );
  const financialHealthLabel: FinancialHealthSnapshot["label"] =
    financialHealthScore >= 75 ? "Sólida" : financialHealthScore >= 55 ? "Estable" : "En riesgo";

  const financialHealthSummary =
    financialHealthLabel === "Sólida"
      ? "Tu patrón de gasto luce controlado y consistente en el periodo analizado."
      : financialHealthLabel === "Estable"
        ? "Hay una base razonable, pero aún existen focos claros de mejora en hábitos y concentración."
        : "Se detecta volatilidad relevante o concentración alta; conviene ajustar límites y seguimiento semanal.";

  const hasActionableInsights =
    currentMonthRows.length >= 8 && activeDays >= 4 && topCategories.length >= 2;

  const projectedMonthTotalFormatted = formatCurrency(projectedMonthTotal, baseCurrency);
  const weekdayTotalFormatted = formatCurrency(weekdayTotal, baseCurrency);
  const weekendTotalFormatted = formatCurrency(weekendTotal, baseCurrency);
  const topExpenseFormatted = topSingleExpenses[0]
    ? formatCurrency(topSingleExpenses[0].amount, baseCurrency)
    : null;
  const avgPerActiveDayFormatted = formatCurrency(avgPerActiveDay, baseCurrency);

  const actionableIdeas: ActionableInsight[] = [
    {
      title: "Proyección de cierre mensual",
      description:
        currentMonthTotal > 0
          ? `Si mantienes este ritmo, el mes cerraría en ~${projectedMonthTotalFormatted} (importe total estimado del mes).`
          : "Aún no hay suficientes importes registrados este mes para proyectar un cierre fiable.",
      whyItMatters:
        "La proyección anticipa desviaciones antes de finalizar el mes y te permite reaccionar a tiempo.",
      recommendedAction:
        "Define un tope semanal y revisa el acumulado cada 3-4 días para corregir tendencia.",
      impactEstimate:
        currentMonthTotal > 0
          ? `Reduciendo un 5% del ritmo actual, el cierre bajaría aprox. ${formatCurrency(projectedMonthTotal * 0.05, baseCurrency)}.`
          : "Sin datos suficientes para estimar impacto.",
      severity: currentMonthTotal > 0 ? "info" : "warning",
    },
    {
      title: "Concentración por categoría",
      description: topCategory
        ? `${topCategory.name} concentra ${topCategory.share.toFixed(1)}% del gasto del mes (${formatCurrency(topCategory.total, baseCurrency)}). Puede ser útil definir un límite para esta categoría.`
        : "No hay una categoría dominante todavía en el importe mensual registrado.",
      whyItMatters:
        "Una concentración alta en una sola categoría incrementa el riesgo de desviaciones difíciles de compensar.",
      recommendedAction:
        topCategory
          ? `Configura un presupuesto específico para ${topCategory.name} y monitorea alertas al 80% de uso.`
          : "Mantén límites simples por categoría para evitar concentración temprana.",
      impactEstimate: topCategory
        ? `Si reduces ${topCategory.name} un 10%, ahorrarías ${formatCurrency(topCategory.total * 0.1, baseCurrency)} al mes.`
        : "Sin categoría dominante no hay impacto principal estimado.",
      severity: topCategory && topCategory.share >= 35 ? "warning" : "success",
    },
    {
      title: "Patrón fin de semana",
      description:
        currentMonthTotal > 0
          ? `El ${((weekendTotal / currentMonthTotal) * 100).toFixed(1)}% del gasto se registra en fin de semana. Importe comparado: laborables ${weekdayTotalFormatted} vs fin de semana ${weekendTotalFormatted}.`
          : "No hay suficiente actividad registrada para detectar un patrón semanal fiable.",
      whyItMatters:
        "Los picos de fin de semana suelen acumular compras discrecionales y elevar el gasto mensual sin percepción inmediata.",
      recommendedAction:
        "Establece un presupuesto fijo para sábado/domingo y registra cada consumo el mismo día.",
      impactEstimate:
        currentMonthTotal > 0
          ? `Bajar 15% el gasto de fin de semana libera ${formatCurrency(weekendTotal * 0.15, baseCurrency)} por mes.`
          : "Sin datos suficientes para estimar impacto.",
      severity:
        currentMonthTotal > 0 && weekendTotal > weekdayTotal * 0.45
          ? "warning"
          : "info",
    },
    {
      title: "Ticket más alto del mes",
      description: topSingleExpenses[0]
        ? `${topSingleExpenses[0].label} es el gasto unitario más alto del mes (${topExpenseFormatted}).`
        : "Todavía no hay suficientes gastos para identificar un ticket unitario destacado.",
      whyItMatters:
        "Un ticket alto puede representar una compra puntual válida o una fuga que conviene revisar para evitar recurrencia.",
      recommendedAction:
        "Clasifica este gasto como excepcional o recurrente y define regla para futuros consumos similares.",
      impactEstimate: topSingleExpenses[0]
        ? `Evitar 1 ticket similar el próximo mes podría ahorrar ${formatCurrency(topSingleExpenses[0].amount, baseCurrency)}.`
        : "Sin tickets destacados para estimar impacto.",
      severity: "info",
    },
    {
      title: "Pulso de hábito de gasto",
      description:
        activeDays > 0
          ? `Has registrado gastos en ${activeDays} días del mes, con un promedio de ${avgPerActiveDayFormatted} por día activo.`
          : "Empieza registrando algunos gastos para obtener métricas de hábito y tendencias más útiles.",
      whyItMatters:
        "La consistencia de registro mejora la calidad del análisis y reduce decisiones basadas en datos incompletos.",
      recommendedAction:
        "Define un recordatorio diario breve para registrar gastos y revisar categorías antes de cerrar el día.",
      impactEstimate:
        activeDays > 0
          ? `Aumentar la consistencia de registro ayuda a detectar fugas tempranas del orden de ${formatCurrency(avgPerActiveDay * 0.1, baseCurrency)} por día activo.`
          : "Sin actividad suficiente para estimar impacto.",
      severity: activeDays >= 10 ? "success" : "info",
    },
  ];

  return {
    currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
    previousMonthTotal: Math.round(previousMonthTotal * 100) / 100,
    variationVsLastMonth: clampPct(variationVsLastMonth),
    projectedMonthTotal: Math.round(projectedMonthTotal * 100) / 100,
    hasActionableInsights,
    monthlyTrend,
    topCategories,
    weekdayTrend,
    dailyTrend,
    topSingleExpenses,
    financialHealth: {
      score: financialHealthScore,
      label: financialHealthLabel,
      summary: financialHealthSummary,
      pillars: financialHealthPillars,
    },
    actionableIdeas: hasActionableInsights ? actionableIdeas : [],
  };
}
