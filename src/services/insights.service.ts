import type { SupabaseClient } from "@supabase/supabase-js";

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
  severity: "info" | "success" | "warning";
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

/**
 * Insights service — builds actionable analytics for the Insights section.
 */
export async function getInsightsSnapshot(
  supabase: SupabaseClient,
  month: number,
  year: number
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
  const weekdayTotal = Math.max(0, currentMonthTotal - weekendTotal);
  const activeDays = new Set(currentMonthRows.map((row) => row.expense_date)).size;
  const avgPerActiveDay = activeDays > 0 ? currentMonthTotal / activeDays : 0;

  const hasActionableInsights =
    currentMonthRows.length >= 8 && activeDays >= 4 && topCategories.length >= 2;

  const actionableIdeas: ActionableInsight[] = [
    {
      title: "Proyección de cierre mensual",
      description:
        currentMonthTotal > 0
          ? `Si mantienes este ritmo, cerrarías en ${Math.round(projectedMonthTotal)} unidades base.`
          : "Aún no hay gasto suficiente este mes para proyectar con precisión.",
      severity: currentMonthTotal > 0 ? "info" : "warning",
    },
    {
      title: "Concentración por categoría",
      description: topCategory
        ? `${topCategory.icon} ${topCategory.name} representa ${topCategory.share.toFixed(1)}% del mes. Conviene fijar un tope específico.`
        : "No hay categorías dominantes todavía este mes.",
      severity: topCategory && topCategory.share >= 35 ? "warning" : "success",
    },
    {
      title: "Patrón fin de semana",
      description:
        currentMonthTotal > 0
          ? `El ${((weekendTotal / currentMonthTotal) * 100).toFixed(1)}% del gasto sucede en fin de semana. Comparado con días hábiles: ${Math.round(weekdayTotal)} vs ${Math.round(weekendTotal)}.`
          : "No hay suficiente actividad para detectar patrón semanal.",
      severity:
        currentMonthTotal > 0 && weekendTotal > weekdayTotal * 0.45
          ? "warning"
          : "info",
    },
    {
      title: "Ticket más alto del mes",
      description: topSingleExpenses[0]
        ? `${topSingleExpenses[0].icon} ${topSingleExpenses[0].label} fue el mayor gasto unitario.`
        : "Todavía no hay gastos destacados este mes.",
      severity: "info",
    },
    {
      title: "Pulso de hábito de gasto",
      description:
        activeDays > 0
          ? `Registraste movimientos en ${activeDays} días del mes, con un promedio de ${Math.round(avgPerActiveDay)} por día activo.`
          : "Empieza registrando algunos gastos para obtener hábito y tendencias.",
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
    actionableIdeas: hasActionableInsights ? actionableIdeas : [],
  };
}
