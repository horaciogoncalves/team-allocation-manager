export interface DateRange {
  start_date: string | null;
  end_date: string | null;
}

/**
 * Determines whether two allocations overlap.
 *
 * Two allocations overlap if:
 *   (A.start_date IS NULL OR B.end_date IS NULL OR A.start_date <= B.end_date)
 *   AND
 *   (A.end_date IS NULL OR B.start_date IS NULL OR A.end_date >= B.start_date)
 *
 * A NULL start or end date means the allocation is unbounded in that direction.
 */
export function allocationsOverlap(a: DateRange, b: DateRange): boolean {
  if (a.start_date && b.end_date && a.start_date > b.end_date) {
    return false;
  }
  if (a.end_date && b.start_date && a.end_date < b.start_date) {
    return false;
  }
  return true;
}
