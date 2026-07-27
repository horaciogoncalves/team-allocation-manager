"use client";

import { useId, type ReactNode } from "react";

export interface BarChartItem {
  id: string;
  label: string;
  value: number;
  max: number;
  colorClass?: string;
  ariaLabel: string;
  suffix?: string;
  warning?: boolean;
  danger?: boolean;
}

interface BarChartProps {
  items: BarChartItem[];
  unitLabel?: string;
  emptyState?: ReactNode;
}

export function BarChart({ items, unitLabel, emptyState }: BarChartProps) {
  const titleId = useId();

  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="space-y-3"
    >
      <span id={titleId} className="sr-only">
        {unitLabel ? `Bar chart in ${unitLabel}` : "Bar chart"}
      </span>
      {items.map((item) => {
        const widthPercent = item.max > 0 ? Math.min((item.value / item.max) * 100, 100) : 0;
        const barColor =
          item.colorClass ??
          (item.danger
            ? "bg-red-500 dark:bg-red-500"
            : item.warning
            ? "bg-amber-500 dark:bg-amber-500"
            : "bg-indigo-500 dark:bg-indigo-500");

        return (
          <div key={item.id} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate pr-2">
                {item.label}
              </span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400 shrink-0">
                {item.value}
                {item.suffix ? item.suffix : ""}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${widthPercent}%` }}
                role="img"
                aria-label={item.ariaLabel}
                title={item.ariaLabel}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
