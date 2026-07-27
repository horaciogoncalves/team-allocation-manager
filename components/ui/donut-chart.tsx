"use client";

import { useId, type ReactNode } from "react";

export interface DonutChartItem {
  id: string;
  label: string;
  value: number;
  colorClass: string;
}

interface DonutChartProps {
  items: DonutChartItem[];
  totalLabel?: string;
  emptyState?: ReactNode;
}

export function DonutChart({ items, totalLabel, emptyState }: DonutChartProps) {
  const titleId = useId();

  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  const segments = items.reduce<{ id: string; offset: number; dashArray: number; colorClass: string; ariaLabel: string }[]>(
    (acc, item) => {
      const fraction = total > 0 ? item.value / total : 0;
      const dashArray = fraction * circumference;
      const previousOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dashArray : 0;
      acc.push({
        id: item.id,
        offset: previousOffset,
        dashArray,
        colorClass: item.colorClass,
        ariaLabel: `${item.label}: ${item.value} (${Math.round(fraction * 100)}%)`,
      });
      return acc;
    },
    []
  );

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0" role="img" aria-labelledby={titleId}>
        <span id={titleId} className="sr-only">
          {totalLabel ? `Donut chart: ${totalLabel}` : "Donut chart"}
        </span>
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-zinc-100 dark:text-zinc-800"
            strokeWidth="6"
          />
          {segments.map((segment) => (
            <circle
              key={segment.id}
              cx="20"
              cy="20"
              r={radius}
              fill="transparent"
              strokeWidth="6"
              strokeDasharray={`${segment.dashArray} ${circumference}`}
              strokeDashoffset={-segment.offset}
              className={`${segment.colorClass} transition-all hover:opacity-80`}
              aria-label={segment.ariaLabel}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {total}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {totalLabel ?? "Total"}
          </span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {items.map((item) => {
          const fraction = total > 0 ? item.value / total : 0;
          return (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-3 h-3 rounded-full shrink-0 ${item.colorClass}`} aria-hidden="true" />
                <span className="text-zinc-700 dark:text-zinc-300 truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums text-zinc-900 dark:text-zinc-100 font-medium">
                  {item.value}
                </span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400 w-10 text-right">
                  {Math.round(fraction * 100)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
