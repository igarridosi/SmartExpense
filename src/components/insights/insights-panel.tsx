"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/currency";
import { trackEvent } from "@/lib/analytics/track";
import type { InsightsSnapshot } from "@/services/insights.service";

const INSIGHTS_SIMULATOR_STORAGE_KEY = "smart-expense:insights-simulator:v1";

interface PersistedSimulatorState {
  categoryName: string;
  reductionPct: number;
  monthlySavingsGoal: number;
}

interface InsightsPanelProps {
  snapshot: InsightsSnapshot;
  baseCurrency: string;
  monthLabel: string;
  year: number;
}

function ChartFallback({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50">
      <p className="max-w-xs text-center text-sm text-zinc-500">{message}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "info" | "success" | "warning" }) {
  const styles: Record<typeof severity, string> = {
    info: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  };

  const labels: Record<typeof severity, string> = {
    info: "Info",
    success: "Bien",
    warning: "Atención",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[severity]}`}
    >
      {labels[severity]}
    </span>
  );
}

export function InsightsPanel({ snapshot, baseCurrency, monthLabel, year }: InsightsPanelProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [selectedCategoryName, setSelectedCategoryName] = useState(
    snapshot.topCategories[0]?.name ?? ""
  );
  const [reductionPct, setReductionPct] = useState(10);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(0);
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(
    Math.round(snapshot.currentMonthTotal * 0.1 * 100) / 100
  );

  useEffect(() => {
    const defaultCategoryName = snapshot.topCategories[0]?.name ?? "";
    const defaultMonthlyGoal = Math.round(snapshot.currentMonthTotal * 0.1 * 100) / 100;
    let nextCategoryName = defaultCategoryName;
    let nextReductionPct = 10;
    let nextMonthlyGoal = defaultMonthlyGoal;

    try {
      const raw = window.localStorage.getItem(INSIGHTS_SIMULATOR_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSimulatorState>;
        const hasCategory =
          typeof parsed.categoryName === "string" &&
          snapshot.topCategories.some((category) => category.name === parsed.categoryName);

        nextCategoryName = hasCategory ? parsed.categoryName! : defaultCategoryName;
        nextReductionPct =
          typeof parsed.reductionPct === "number"
            ? Math.min(80, Math.max(1, parsed.reductionPct))
            : 10;
        nextMonthlyGoal =
          typeof parsed.monthlySavingsGoal === "number" && parsed.monthlySavingsGoal >= 0
            ? parsed.monthlySavingsGoal
            : defaultMonthlyGoal;
      }
    } catch {
      nextCategoryName = defaultCategoryName;
      nextReductionPct = 10;
      nextMonthlyGoal = defaultMonthlyGoal;
    }

    const frame = window.requestAnimationFrame(() => {
      setSelectedCategoryName(nextCategoryName);
      setReductionPct(nextReductionPct);
      setMonthlySavingsGoal(nextMonthlyGoal);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [snapshot.topCategories, snapshot.currentMonthTotal]);

  useEffect(() => {
    void trackEvent({
      name: "insights_viewed",
      context: "insights",
      metadata: {
        monthLabel,
        year,
      },
    });
  }, [monthLabel, year]);

  useEffect(() => {
    const payload: PersistedSimulatorState = {
      categoryName: selectedCategoryName,
      reductionPct,
      monthlySavingsGoal,
    };

    window.localStorage.setItem(
      INSIGHTS_SIMULATOR_STORAGE_KEY,
      JSON.stringify(payload)
    );
  }, [selectedCategoryName, reductionPct, monthlySavingsGoal]);

  useEffect(() => {
    if (!selectedCategoryName) return;
    void trackEvent({
      name: "insights_whatif_changed",
      context: "insights",
      metadata: {
        categoryName: selectedCategoryName,
        reductionPct,
      },
    });
  }, [selectedCategoryName, reductionPct]);

  useEffect(() => {
    void trackEvent({
      name: "insights_goal_updated",
      context: "insights",
      metadata: {
        monthlySavingsGoal,
      },
    });
  }, [monthlySavingsGoal]);

  const selectedCategory =
    snapshot.topCategories.find((category) => category.name === selectedCategoryName) ??
    snapshot.topCategories[0];

  const scenario = useMemo(() => {
    if (!selectedCategory) {
      return {
        monthlySavings: 0,
        annualSavings: 0,
        simulatedTotal: snapshot.currentMonthTotal,
      };
    }

    const monthlySavings = (selectedCategory.total * reductionPct) / 100;
    return {
      monthlySavings,
      annualSavings: monthlySavings * 12,
      simulatedTotal: Math.max(0, snapshot.currentMonthTotal - monthlySavings),
    };
  }, [selectedCategory, reductionPct, snapshot.currentMonthTotal]);

  const savingsProgressPct =
    monthlySavingsGoal > 0
      ? Math.min(100, (scenario.monthlySavings / monthlySavingsGoal) * 100)
      : 0;
  const weeklySavings = scenario.monthlySavings / 4.33;
  const savingsImpactPct =
    snapshot.currentMonthTotal > 0
      ? (scenario.monthlySavings / snapshot.currentMonthTotal) * 100
      : 0;
  const goalGap = Math.max(0, monthlySavingsGoal - scenario.monthlySavings);
  const goalReached = monthlySavingsGoal > 0 && scenario.monthlySavings >= monthlySavingsGoal;
  const selectedCategoryTotal = selectedCategory?.total ?? 0;
  const requiredReductionPctRaw =
    selectedCategoryTotal > 0
      ? (monthlySavingsGoal / selectedCategoryTotal) * 100
      : 0;
  const requiredReductionPct = Math.min(80, Math.max(1, Math.round(requiredReductionPctRaw)));
  const goalReachableWithCategory =
    monthlySavingsGoal <= 0 ||
    (selectedCategoryTotal > 0 && requiredReductionPctRaw <= 80);
  const goalCoveragePct =
    monthlySavingsGoal > 0
      ? Math.min(100, (scenario.monthlySavings / monthlySavingsGoal) * 100)
      : 0;

  const categoryOptions = snapshot.topCategories.map((category) => ({
    value: category.name,
    label: category.name,
  }));
  const safeActiveCategoryIndex = Math.min(
    activeCategoryIndex,
    Math.max(snapshot.topCategories.length - 1, 0)
  );
  const hasDailyTrend = snapshot.dailyTrend.some((item) => item.total > 0);
  const trendPeak = snapshot.monthlyTrend.reduce(
    (acc, item) => (item.total > acc.total ? item : acc),
    snapshot.monthlyTrend[0]
  );
  const trendLowest = snapshot.monthlyTrend.reduce(
    (acc, item) => (item.total < acc.total ? item : acc),
    snapshot.monthlyTrend[0]
  );
  const trendAverage =
    snapshot.monthlyTrend.length > 0
      ? snapshot.monthlyTrend.reduce((sum, item) => sum + item.total, 0) /
        snapshot.monthlyTrend.length
      : 0;
  const latestMonth = snapshot.monthlyTrend[snapshot.monthlyTrend.length - 1];
  const previousToLatestMonth =
    snapshot.monthlyTrend[snapshot.monthlyTrend.length - 2];
  const lastStepVariation =
    latestMonth && previousToLatestMonth && previousToLatestMonth.total > 0
      ? ((latestMonth.total - previousToLatestMonth.total) /
          previousToLatestMonth.total) *
        100
      : 0;
  const financialHealthSeverity: "warning" | "info" | "success" =
    snapshot.financialHealth.score >= 75
      ? "success"
      : snapshot.financialHealth.score >= 55
        ? "info"
        : "warning";
  const selectedIdea =
    selectedIdeaIndex !== null ? snapshot.actionableIdeas[selectedIdeaIndex] : null;

  const getPillarTone = (score: number) => {
    if (score >= 75) {
      return {
        text: "text-emerald-700",
        bar: "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
      };
    }

    if (score >= 55) {
      return {
        text: "text-amber-700",
        bar: "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500",
      };
    }

    return {
      text: "text-rose-700",
      bar: "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500",
    };
  };

  return (
    <section className="space-y-4" aria-label="Panel de insights accionables">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="surface-card md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">Gasto actual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
              {formatCurrency(snapshot.currentMonthTotal, baseCurrency)}
            </p>
            <p className="mt-1 text-sm capitalize text-zinc-500">
              {monthLabel} {year}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">Variación vs mes anterior</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
              {snapshot.variationVsLastMonth >= 0 ? "+" : ""}
              {snapshot.variationVsLastMonth.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Anterior: {formatCurrency(snapshot.previousMonthTotal, baseCurrency)}
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-600">Proyección de cierre</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
              {formatCurrency(snapshot.projectedMonthTotal, baseCurrency)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">Estimación al ritmo actual</p>
          </CardContent>
        </Card>

        <Card className="surface-card md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm text-zinc-600">Salud financiera</CardTitle>
              <SeverityBadge severity={financialHealthSeverity} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold text-zinc-900 [font-variant-numeric:tabular-nums]">
              {snapshot.financialHealth.score}/100
            </p>
            <p className="text-sm text-zinc-600">Estado {snapshot.financialHealth.label}</p>
            <p className="text-xs text-zinc-500">{snapshot.financialHealth.summary}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Desglose del score de salud</CardTitle>
          <p className="text-xs text-zinc-500">
            Cada pilar ayuda a entender dónde estás fuerte y dónde conviene priorizar ajustes.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.financialHealth.pillars.map((pillar) => (
              <article key={pillar.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{pillar.label}</p>
                  <p className={`text-xs font-semibold ${getPillarTone(pillar.score).text}`}>
                    {pillar.score}/100
                  </p>
                </div>
                <progress
                  max={100}
                  value={pillar.score}
                  className={`mb-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-zinc-200 ${getPillarTone(pillar.score).bar}`}
                  aria-label={`Puntaje de ${pillar.label}`}
                />
                <p className="text-xs leading-relaxed text-zinc-600">{pillar.explanation}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      {snapshot.hasActionableInsights && snapshot.actionableIdeas.length > 0 && (
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>5 ideas accionables para mejorar tu gasto</CardTitle>
            <p className="text-xs text-zinc-500">
              Explora cada idea y abre el detalle solo cuando quieras profundizar.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.actionableIdeas.map((idea, index) => {
                const isSelected = selectedIdeaIndex === index;

                return (
                  <article
                    key={idea.title}
                    className={`rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? "border-zinc-300 bg-white"
                        : "border-zinc-200 bg-zinc-50"
                    }`}
                    aria-label={idea.title}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">{idea.title}</p>
                      <SeverityBadge severity={idea.severity} />
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-zinc-600">{idea.description}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto px-2 py-1 text-xs"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelectedIdeaIndex((current) => (current === index ? null : index))
                      }
                    >
                      {isSelected ? "Ocultar detalle" : "Ver detalle"}
                    </Button>
                  </article>
                );
              })}
            </div>

            {selectedIdea && (
              <article className="mt-4 rounded-xl border border-zinc-200 bg-white p-4" aria-label={`Detalle de ${selectedIdea.title}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">Detalle de: {selectedIdea.title}</p>
                  <SeverityBadge severity={selectedIdea.severity} />
                </div>
                <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
                  <p>
                    <span className="font-semibold text-zinc-900">Por qué importa:</span>{" "}
                    {selectedIdea.whyItMatters}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Acción recomendada:</span>{" "}
                    {selectedIdea.recommendedAction}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Impacto estimado:</span>{" "}
                    {selectedIdea.impactEstimate}
                  </p>
                </div>
              </article>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Simulador What-if</CardTitle>
            <p className="text-xs text-zinc-500">
              Selecciona una categoría y define cuánto reducir para estimar si llegas a tu meta.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryOptions.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Registra más actividad para habilitar la simulación por categoría.
              </p>
            ) : (
              <>
                <Select
                  id="what-if-category"
                  name="what-if-category"
                  label="Categoría a optimizar"
                  options={categoryOptions}
                  value={selectedCategory?.name ?? ""}
                  onChange={(event) => setSelectedCategoryName(event.target.value)}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-700">Reducción aplicada</p>
                    <p className="rounded-md bg-zinc-100 px-2 py-0.5 text-sm font-semibold text-zinc-900">
                      {reductionPct}%
                    </p>
                  </div>
                  <input
                    id="what-if-reduction"
                    type="range"
                    min={1}
                    max={80}
                    step={1}
                    value={reductionPct}
                    onChange={(event) => setReductionPct(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200"
                    aria-label="Porcentaje de reducción simulada"
                  />
                </div>

                {monthlySavingsGoal > 0 && selectedCategory && (
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">Ajuste recomendado para tu meta</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {goalReachableWithCategory
                        ? `Para cubrir tu meta desde ${selectedCategory.name}, necesitarías reducir aprox. ${requiredReductionPct}% en esta categoría.`
                        : `Tu meta es más alta que el máximo simulable en ${selectedCategory.name}. Con 80% de reducción aún no llegas solo con esta categoría.`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setReductionPct(requiredReductionPct)}
                      >
                        Aplicar recomendación ({requiredReductionPct}%)
                      </Button>
                      <span className="text-xs text-zinc-500">
                        Basado en tu meta mensual actual.
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Ahorro estimado</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(scenario.monthlySavings, baseCurrency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Cobertura de meta</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {goalCoveragePct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs text-zinc-500">Recorte sobre tu gasto</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {savingsImpactPct.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">Nuevo gasto mensual estimado</p>
                    <p className="text-base font-semibold text-zinc-900">
                      {formatCurrency(scenario.simulatedTotal, baseCurrency)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Antes: {formatCurrency(snapshot.currentMonthTotal, baseCurrency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">Impacto semanal estimado</p>
                    <p className="text-base font-semibold text-zinc-900">
                      {formatCurrency(weeklySavings, baseCurrency)}
                    </p>
                    <p className="text-xs text-zinc-500">Ahorro potencial por semana</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle>Meta de ahorro y progreso</CardTitle>
            <p className="text-xs text-zinc-500">
              Define una meta realista y usa el simulador para validar si llegas al objetivo.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="monthly_savings_goal"
              name="monthly_savings_goal"
              type="number"
              min="0"
              step="0.01"
              label="Meta mensual de ahorro"
              value={Number.isFinite(monthlySavingsGoal) ? monthlySavingsGoal : 0}
              onChange={(event) => setMonthlySavingsGoal(Number(event.target.value) || 0)}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <p className="text-zinc-600">Progreso estimado con la simulación actual</p>
                <p className="font-semibold text-zinc-900">{savingsProgressPct.toFixed(1)}%</p>
              </div>
              <progress
                max={100}
                value={savingsProgressPct}
                className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-zinc-200 [&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500"
                aria-label="Progreso de meta de ahorro"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Meta mensual</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatCurrency(monthlySavingsGoal, baseCurrency)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Brecha restante</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatCurrency(goalGap, baseCurrency)}
                </p>
              </div>
            </div>

            {monthlySavingsGoal > 0 && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${goalReached ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {goalReached
                  ? "Con esta simulación ya cumples tu meta mensual de ahorro."
                  : `Con esta simulación todavía faltan ${formatCurrency(goalGap, baseCurrency)} para llegar a tu meta.`}
              </div>
            )}

            <p className="text-xs text-zinc-500">
              Esta meta se guarda en tu navegador para {monthLabel} {year} y se usa como referencia de planificación.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="surface-card xl:col-span-7">
          <CardHeader>
            <CardTitle>Evolución de gasto (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {isClient ? (
              <div className="h-72" role="img" aria-label="Gráfico de evolución mensual del gasto total">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshot.monthlyTrend} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="insightArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const item = payload[0].payload as { month: string; total: number; count: number; avg: number };

                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                            <p className="text-sm font-semibold text-zinc-900">{item.month}</p>
                            <p className="text-sm text-zinc-700">
                              Total: {formatCurrency(item.total, baseCurrency)}
                            </p>
                            <p className="text-xs text-zinc-500">{item.count} gastos · Promedio {formatCurrency(item.avg, baseCurrency)}</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fill="url(#insightArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartFallback message="Cargando gráfico de evolución..." />
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Mes más alto</p>
                <p className="text-sm font-semibold text-zinc-900 capitalize">
                  {trendPeak?.month ?? "-"}
                </p>
                <p className="text-xs text-zinc-600">
                  {formatCurrency(trendPeak?.total ?? 0, baseCurrency)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Mes más bajo</p>
                <p className="text-sm font-semibold text-zinc-900 capitalize">
                  {trendLowest?.month ?? "-"}
                </p>
                <p className="text-xs text-zinc-600">
                  {formatCurrency(trendLowest?.total ?? 0, baseCurrency)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Promedio 6 meses</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatCurrency(trendAverage, baseCurrency)}
                </p>
                <p className="text-xs text-zinc-600">por mes</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Cambio último mes</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {lastStepVariation >= 0 ? "+" : ""}
                  {lastStepVariation.toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-600">vs mes anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card xl:col-span-5">
          <CardHeader>
            <CardTitle>Dominio por categorías</CardTitle>
          </CardHeader>
          <CardContent>
            {isClient ? (
              <div className="relative h-72" role="img" aria-label="Gráfico de dona por categorías con mayor gasto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.18" />
                      </filter>
                    </defs>
                    <Pie
                      data={snapshot.topCategories}
                      dataKey="share"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={82}
                      outerRadius={118}
                      paddingAngle={3}
                      cornerRadius={8}
                      stroke="#ffffff"
                      strokeWidth={2}
                      filter="url(#donutShadow)"
                      isAnimationActive={false}
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(0)}
                    >
                      {snapshot.topCategories.map((item) => (
                        <Cell key={`cat-${item.name}`} fill={item.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl border border-zinc-200 bg-white/95 px-2 py-2 text-center shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Categoría</p>
                    {snapshot.topCategories[safeActiveCategoryIndex] ? (
                      <div className="mx-auto flex max-w-[125px] items-center justify-center gap-1 text-xs font-semibold text-zinc-900">
                        <span className="truncate">
                          {snapshot.topCategories[safeActiveCategoryIndex].name}
                        </span>
                        <CategoryIcon
                          icon={snapshot.topCategories[safeActiveCategoryIndex].icon}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                      </div>
                    ) : (
                      <p className="max-w-[125px] truncate text-xs font-semibold text-zinc-900">Sin datos</p>
                    )}
                    <p className="text-[11px] text-zinc-600">
                      {snapshot.topCategories[safeActiveCategoryIndex]
                        ? `${snapshot.topCategories[safeActiveCategoryIndex].share.toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ChartFallback message="Cargando dominio por categorías..." />
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {snapshot.topCategories.slice(0, 4).map((category) => (
                <div key={category.name} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate font-medium">{category.name}</span>
                      <CategoryIcon icon={category.icon} className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <span className="shrink-0">{category.share.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card xl:col-span-4">
          <CardHeader>
            <CardTitle>Ritmo semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {isClient ? (
              <div className="h-72" role="img" aria-label="Barras de gasto por día de la semana">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={snapshot.weekdayTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const item = payload[0].payload as { day: string; total: number; count: number };
                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                            <p className="font-medium text-zinc-900">{item.day}</p>
                            <p className="text-sm text-zinc-600">{formatCurrency(item.total, baseCurrency)}</p>
                            <p className="text-xs text-zinc-500">{item.count} transacciones</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartFallback message="Cargando ritmo semanal..." />
            )}
          </CardContent>
        </Card>

        <Card className="surface-card xl:col-span-4">
          <CardHeader>
            <CardTitle>Tendencia diaria del mes</CardTitle>
          </CardHeader>
          <CardContent>
            {hasDailyTrend && isClient ? (
              <div className="h-72" role="img" aria-label="Curva de gasto diario durante el mes">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshot.dailyTrend} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="dailyArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const item = payload[0].payload as { day: number; total: number; count: number };
                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                            <p className="font-medium text-zinc-900">Día {item.day}</p>
                            <p className="text-sm text-zinc-600">{formatCurrency(item.total, baseCurrency)}</p>
                            <p className="text-xs text-zinc-500">{item.count} transacciones</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2.5} fill="url(#dailyArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : !isClient ? (
              <ChartFallback message="Cargando tendencia diaria..." />
            ) : (
              <ChartFallback message="Aún no hay suficientes días con actividad para mostrar una tendencia diaria útil." />
            )}
          </CardContent>
        </Card>

        <Card className="surface-card xl:col-span-4">
          <CardHeader>
            <CardTitle>Top tickets del mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot.topSingleExpenses.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin datos aún para este mes.</p>
              ) : (
                snapshot.topSingleExpenses.map((expense) => (
                  <div key={`${expense.date}-${expense.label}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-1 text-sm font-medium text-zinc-900">
                        <span className="truncate">{expense.label}</span>
                        <CategoryIcon icon={expense.icon} className="h-4 w-4 shrink-0" />
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-zinc-900">
                        {formatCurrency(expense.amount, baseCurrency)}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500">{expense.category}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
