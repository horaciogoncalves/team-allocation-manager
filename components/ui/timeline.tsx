"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  clampDate,
  differenceInDays,
  eachMonthOfInterval,
  endOfMonth,
  formatMonth,
  formatShortDate,
  parseDate,
} from "@/lib/date-utils";
import type { AllocationWithDetails, Member, Project } from "@/lib/types";

interface TimelineProps {
  projects: Project[];
  allocations: AllocationWithDetails[];
  members: Member[];
  startDate: Date;
  endDate: Date;
}

const MONTH_WIDTH_PX = 140;
const BAR_HEIGHT = 20;
const BAR_GAP = 8;
const ROW_PADDING = 12;
const HEADER_HEIGHT = 40;
const PROJECT_LABEL_WIDTH = 176;

const MEMBER_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getMemberColorClass(memberId: string): string {
  return MEMBER_COLORS[hashString(memberId) % MEMBER_COLORS.length];
}

function formatRangeLabel(start: string | null, end: string | null): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (startDate && endDate) {
    return `${formatShortDate(startDate)} → ${formatShortDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatShortDate(startDate)}`;
  }
  if (endDate) {
    return `Until ${formatShortDate(endDate)}`;
  }
  return "No dates set";
}

export function Timeline({
  projects,
  allocations,
  members,
  startDate,
  endDate,
}: TimelineProps) {
  const [hoveredAllocation, setHoveredAllocation] = useState<AllocationWithDetails | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const months = useMemo(() => eachMonthOfInterval(startDate, endDate), [startDate, endDate]);
  const totalDays = useMemo(
    () => differenceInDays(endDate, startDate) + 1,
    [startDate, endDate]
  );

  const timelineWidth = Math.max(months.length * MONTH_WIDTH_PX, 320);

  const memberColorMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(member.id, getMemberColorClass(member.id));
    });
    return map;
  }, [members]);

  const projectsWithAllocations = useMemo(() => {
    const projectIds = new Set(allocations.map((a) => a.project_id));
    return projects
      .filter((project) => projectIds.has(project.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, allocations]);

  function dayToPercent(dayOffset: number): number {
    return totalDays > 0 ? (dayOffset / totalDays) * 100 : 0;
  }

  function getMonthStyle(monthStart: Date, monthEnd: Date): { left: string; width: string } {
    const leftDay = Math.max(0, differenceInDays(monthStart, startDate));
    const rightDay = Math.min(totalDays - 1, differenceInDays(monthEnd, startDate));
    const widthDays = rightDay - leftDay + 1;
    return {
      left: `${dayToPercent(leftDay)}%`,
      width: `${dayToPercent(widthDays)}%`,
    };
  }

  function getAllocationStyle(
    allocation: AllocationWithDetails
  ): { left: string; width: string; visible: boolean } | null {
    const rawStart = parseDate(allocation.start_date);
    const rawEnd = parseDate(allocation.end_date);

    let allocStart = rawStart ? clampDate(rawStart, startDate, endDate) : null;
    let allocEnd = rawEnd ? clampDate(rawEnd, startDate, endDate) : null;

    if (rawStart && rawStart > endDate) return null;
    if (rawEnd && rawEnd < startDate) return null;

    if (!allocStart && !allocEnd) {
      return { left: "0%", width: "100%", visible: true };
    }

    if (!allocStart) {
      allocStart = startDate;
    }
    if (!allocEnd) {
      allocEnd = endDate;
    }

    const leftDay = Math.max(0, differenceInDays(allocStart, startDate));
    const rightDay = Math.min(totalDays - 1, differenceInDays(allocEnd, startDate));
    const widthDays = Math.max(1, rightDay - leftDay + 1);

    return {
      left: `${dayToPercent(leftDay)}%`,
      width: `${dayToPercent(widthDays)}%`,
      visible: true,
    };
  }

  function handleBarMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    allocation: AllocationWithDetails
  ) {
    setHoveredAllocation(allocation);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }

  function handleBarMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }

  function handleBarMouseLeave() {
    setHoveredAllocation(null);
    setTooltipPosition(null);
  }

  if (projectsWithAllocations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No projects with allocations to display.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div
          className="relative"
          style={{ minWidth: timelineWidth + PROJECT_LABEL_WIDTH, minHeight: HEADER_HEIGHT }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
            style={{ height: HEADER_HEIGHT }}
          >
            <div
              className="shrink-0 sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-900 px-4 flex items-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-800"
              style={{ width: PROJECT_LABEL_WIDTH }}
            >
              Project
            </div>
            <div className="relative flex-1">
              {months.map((month, index) => {
                const monthStart = month;
                const monthEnd = endOfMonth(addDays(month, 0));
                const style = getMonthStyle(monthStart, monthEnd);
                return (
                  <div
                    key={index}
                    className="absolute top-0 h-full border-l border-zinc-200 dark:border-zinc-800 px-1 flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap overflow-hidden"
                    style={{ left: style.left, width: style.width }}
                  >
                    {formatMonth(monthStart)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {projectsWithAllocations.map((project) => {
            const projectAllocations = allocations
              .filter((a) => a.project_id === project.id)
              .sort((a, b) => (a.member?.name ?? "").localeCompare(b.member?.name ?? ""));

            const rowHeight = Math.max(
              HEADER_HEIGHT,
              ROW_PADDING + projectAllocations.length * (BAR_HEIGHT + BAR_GAP) + BAR_GAP
            );

            return (
              <div
                key={project.id}
                className="flex border-b border-zinc-200 dark:border-zinc-800 last:border-b-0"
                style={{ minHeight: rowHeight }}
              >
                <div
                  className="shrink-0 sticky left-0 z-10 bg-white dark:bg-zinc-900 px-4 flex items-center text-sm font-medium text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800"
                  style={{ width: PROJECT_LABEL_WIDTH }}
                >
                  <span className="truncate" title={project.name}>
                    {project.name}
                  </span>
                </div>
                <div className="relative flex-1 py-2">
                  {/* Month grid lines */}
                  {months.map((month, index) => {
                    const monthStart = month;
                    const monthEnd = endOfMonth(addDays(month, 0));
                    const style = getMonthStyle(monthStart, monthEnd);
                    return (
                      <div
                        key={index}
                        className="absolute top-0 bottom-0 border-l border-zinc-100 dark:border-zinc-800/60"
                        style={{ left: style.left }}
                        aria-hidden="true"
                      />
                    );
                  })}

                  {/* Allocation bars */}
                  {projectAllocations.map((allocation) => {
                    const style = getAllocationStyle(allocation);
                    if (!style || !style.visible) return null;

                    const colorClass = memberColorMap.get(allocation.member_id) ?? "bg-zinc-500";
                    const label = allocation.member?.name ?? "Unknown member";
                    const ariaLabel = `${label}, ${allocation.allocation_percentage}% allocation, ${formatRangeLabel(
                      allocation.start_date,
                      allocation.end_date
                    )}`;

                    return (
                      <div
                        key={allocation.id}
                        className={`absolute rounded-md shadow-sm ${colorClass} hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer transition-all`}
                        style={{
                          left: style.left,
                          width: style.width,
                          top: `${ROW_PADDING / 2 + projectAllocations.indexOf(allocation) * (BAR_HEIGHT + BAR_GAP)}px`,
                          height: BAR_HEIGHT,
                        }}
                        role="img"
                        aria-label={ariaLabel}
                        onMouseEnter={(e) => handleBarMouseEnter(e, allocation)}
                        onMouseMove={handleBarMouseMove}
                        onMouseLeave={handleBarMouseLeave}
                      >
                        {style.width && parseFloat(style.width) > 10 && (
                          <span className="absolute inset-0 px-1.5 flex items-center text-[10px] font-medium text-white truncate leading-none">
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredAllocation && tooltipPosition && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm max-w-xs"
          style={{
            left: tooltipPosition.x + 12,
            top: tooltipPosition.y + 12,
          }}
        >
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {hoveredAllocation.member?.name ?? "Unknown member"}
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
            {hoveredAllocation.allocation_percentage}% allocation
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            {formatRangeLabel(hoveredAllocation.start_date, hoveredAllocation.end_date)}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs">
            {hoveredAllocation.project?.name ?? "Unknown project"}
          </p>
        </div>
      )}
    </div>
  );
}
