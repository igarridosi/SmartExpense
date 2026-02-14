"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { formatCurrency } from "@/lib/utils/currency";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
        No hay datos para mostrar este mes
      </div>
    );
  }

  const chartData = data.map((item) => ({
    icon: item.category_icon,
    label: item.category_name,
    name: `${item.category_icon} ${item.category_name}`,
    value: Math.round(item.total * 100) / 100,
    color: item.category_color,
    percentage: item.percentage,
    count: item.count,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={isMobile ? 92 : 110}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={(props: PieLabelRenderProps) => {
              const payload = (props.payload as Record<string, unknown>) ?? {};
              const icon = typeof payload.icon === "string" ? payload.icon : "";
              const name = props.name ?? "";
              const pct = (props.payload as Record<string, unknown>)?.percentage;

              if (isMobile) {
                return icon;
              }

              return `${name} ${typeof pct === "number" ? pct.toFixed(1) : ""}%`;
            }}
            labelLine={true}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={entry.color}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const item = payload[0].payload;
              return (
                <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="text-sm text-zinc-600 [font-variant-numeric:tabular-nums]">
                    {formatCurrency(item.value, baseCurrency)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {item.percentage.toFixed(1)}% · {item.count}{" "}
                    {item.count === 1 ? "gasto" : "gastos"}
                  </p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry) => {
              const payload = (entry?.payload as Record<string, unknown>) ?? {};
              const icon = typeof payload.icon === "string" ? payload.icon : value;

              return (
                <span className="text-xs text-zinc-700">{isMobile ? icon : value}</span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
