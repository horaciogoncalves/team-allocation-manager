export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function differenceInDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonth(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export function eachMonthOfInterval(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(start);
  const last = startOfMonth(end);
  while (current <= last) {
    months.push(new Date(current));
    current = addMonths(current, 1);
  }
  return months;
}

export function getDateRange(
  mode: "last3m" | "next3m" | "next6m" | "next12m" | "all",
  allocations: { start_date?: string | null; end_date?: string | null }[]
): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mode === "all") {
    let min = today;
    let max = addMonths(today, 6);
    allocations.forEach((a) => {
      const start = parseDate(a.start_date);
      const end = parseDate(a.end_date);
      if (start && start < min) min = start;
      if (end && end > max) max = end;
    });
    if (min === today) {
      min = addMonths(today, -6);
    }
    return { start: startOfMonth(min), end: endOfMonth(max) };
  }

  const map: Record<Exclude<typeof mode, "all">, number> = {
    last3m: -3,
    next3m: 3,
    next6m: 6,
    next12m: 12,
  };

  const months = map[mode];
  if (mode === "last3m") {
    return { start: startOfMonth(addMonths(today, months)), end: endOfMonth(today) };
  }
  return { start: startOfMonth(today), end: endOfMonth(addMonths(today, months)) };
}
