"use client";

import { useState, useSyncExternalStore } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { CategorySpending } from "@/services/dashboard.service";

/**
 * Client Component: Interactive pie chart showing spending by category.
 * Uses Recharts for the visualization.
 */

interface CategoryPieChartProps {
  data: CategorySpending[];
  baseCurrency: string;
}

export function CategoryPieChart({ data, baseCurrency }: CategoryPieChartProps) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        No hay datos para mostrar este mes
      </div>
    );
  }

  const chartData = data.map((item) => ({
    icon: item.category_icon,
    name: item.category_name,
    categoryName: item.category_name,
    value: Math.round(item.total * 100) / 100,
    color: item.category_color,
    percentage: item.percentage,
    count: item.count,
  }));

  const topCategory = chartData[0];
  const safeActiveCategoryIndex = Math.min(
    activeCategoryIndex,
    Math.max(chartData.length - 1, 0)
  );
  const secondCategory = chartData[1];
  const topCategoryAvg = topCategory ? topCategory.value / topCategory.count : 0;
  const leadGapShare = topCategory && secondCategory
    ? Math.max(0, topCategory.percentage - secondCategory.percentage)
    : 0;
  const leadGapValue = topCategory && secondCategory
    ? Math.max(0, topCategory.value - secondCategory.value)
    : 0;
  const leadGapRelativePercent = secondCategory && secondCategory.percentage > 0
    ? (leadGapShare / secondCategory.percentage) * 100
    : 0;

  return (
    <div className="space-y-3">
      {isClient ? (
        <div className="relative h-96" role="img" aria-label="Gráfico de dona por categorías con etiqueta central interactiva">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="dashboardDonutShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.18" />
                </filter>
              </defs>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={98}
                outerRadius={142}
                paddingAngle={3}
                cornerRadius={8}
                stroke="#ffffff"
                strokeWidth={2}
                filter="url(#dashboardDonutShadow)"
                isAnimationActive={false}
                onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                onMouseLeave={() => setActiveCategoryIndex(0)}
              >
                {chartData.map((item) => (
                  <Cell key={`cell-${item.name}`} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Categoría</p>
              {chartData[safeActiveCategoryIndex] ? (
                <div className="mx-auto flex max-w-[170px] items-center justify-center gap-1 text-base font-semibold text-zinc-900">
                  <span className="truncate">{chartData[safeActiveCategoryIndex].categoryName}</span>
                  <CategoryIcon
                    icon={chartData[safeActiveCategoryIndex].icon}
                    className="h-4 w-4 shrink-0"
                  />
                </div>
              ) : (
                <p className="max-w-[170px] truncate text-base font-semibold text-zinc-900">Sin datos</p>
              )}
              <p className="text-xs text-zinc-600">
                {chartData[safeActiveCategoryIndex]
                  ? `${chartData[safeActiveCategoryIndex].percentage.toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50">
          <p className="text-sm text-zinc-500">Cargando gráfico...</p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Categoría líder</p>
          {topCategory ? (
            <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-zinc-900">
              <span className="truncate">{topCategory.categoryName}</span>
              <CategoryIcon icon={topCategory.icon} className="h-4 w-4 shrink-0" />
            </div>
          ) : (
            <p className="mt-1 truncate text-sm font-semibold text-zinc-900">Sin datos</p>
          )}
          <p className="text-xs text-zinc-600">
            {topCategory
              ? `${formatCurrency(topCategory.value, baseCurrency)} · ${topCategory.percentage.toFixed(1)}%`
              : "0%"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Promedio categoría líder</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {formatCurrency(topCategoryAvg || 0, baseCurrency)}
          </p>
          <p className="text-xs text-zinc-600">
            por {topCategory?.count ?? 0} {topCategory?.count === 1 ? "gasto" : "gastos"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Brecha líder vs 2ª</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {leadGapShare.toFixed(1)} puntos porcentuales ({leadGapRelativePercent >= 0 ? "+" : ""}{leadGapRelativePercent.toFixed(1)}%)
          </p>
          <p className="text-xs text-zinc-600">
            {formatCurrency(leadGapValue, baseCurrency)} de diferencia
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {chartData.slice(0, 6).map((category, index) => (
          <div key={category.name} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-700">
              <div className="flex min-w-0 items-center gap-1 font-medium">
                <p className="truncate">
                  {index + 1}. {category.categoryName}
                </p>
                <CategoryIcon icon={category.icon} className="h-3.5 w-3.5 shrink-0" />
              </div>
              <p className="shrink-0 font-semibold">{category.percentage.toFixed(1)}%</p>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {formatCurrency(category.value, baseCurrency)} · {category.count} {category.count === 1 ? "gasto" : "gastos"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
