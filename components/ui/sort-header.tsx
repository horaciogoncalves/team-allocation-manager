"use client";

interface SortHeaderProps<TSortKey extends string> {
  label: string;
  sortKey: TSortKey;
  currentSortKey: TSortKey;
  direction: "asc" | "desc";
  onSort: (key: TSortKey) => void;
  align?: "left" | "right";
}

export function SortHeader<TSortKey extends string>({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
  align = "left",
}: SortHeaderProps<TSortKey>) {
  const isActive = currentSortKey === sortKey;
  const indicator = isActive ? (direction === "asc" ? " ▲" : " ▼") : null;

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={`px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 rounded px-0.5 -ml-0.5"
      >
        <span>{label}</span>
        <span aria-hidden="true" className="ml-1">
          {indicator ?? (
            <span className="invisible group-hover:visible text-zinc-400 dark:text-zinc-500">▼</span>
          )}
        </span>
      </button>
    </th>
  );
}
