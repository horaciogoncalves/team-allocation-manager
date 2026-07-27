"use client";

import type { ReactNode } from "react";
import { SortHeader } from "./sort-header";

export interface ResponsiveTableColumn<T, TSortKey extends string = string> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
  sortKey?: TSortKey;
  isRowHeader?: boolean;
}

interface ResponsiveTableProps<T, TSortKey extends string = string> {
  columns: ResponsiveTableColumn<T, TSortKey>[];
  data: T[];
  keyExtractor: (row: T) => string;
  actions: (row: T) => ReactNode;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  isLoading?: boolean;
  sortKey?: TSortKey;
  sortDirection?: "asc" | "desc";
  onSort?: (key: TSortKey) => void;
  rowClassName?: (row: T) => string | undefined;
}

function alignmentClass(align: "left" | "right" = "left"): string {
  return align === "right" ? "text-right" : "text-left";
}

export function ResponsiveTable<T, TSortKey extends string = string>({
  columns,
  data,
  keyExtractor,
  actions,
  emptyState,
  loadingState,
  isLoading = false,
  sortKey,
  sortDirection,
  onSort,
  rowClassName,
}: ResponsiveTableProps<T, TSortKey>) {
  if (isLoading && loadingState) {
    return <>{loadingState}</>;
  }

  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur sticky top-0">
            <tr>
              {columns.map((column) => {
                if (column.sortKey && onSort && sortKey && sortDirection) {
                  return (
                    <SortHeader
                      key={column.key}
                      label={column.header}
                      sortKey={column.sortKey}
                      currentSortKey={sortKey}
                      direction={sortDirection}
                      onSort={onSort}
                      align={column.align}
                    />
                  );
                }
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${alignmentClass(column.align)}`}
                  >
                    {column.header}
                  </th>
                );
              })}
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.map((row) => {
              const rowExtraClass = rowClassName ? rowClassName(row) : undefined;
              return (
                <tr
                  key={keyExtractor(row)}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60 transition-colors ${rowExtraClass ?? ""}`}
                >
                  {columns.map((column) => {
                    const content = column.cell(row);
                    const alignClass = alignmentClass(column.align);
                    const baseClasses = `px-4 py-3 text-sm first:rounded-l-lg last:rounded-r-lg ${alignClass}`;

                    if (column.isRowHeader) {
                      return (
                        <th
                          key={column.key}
                          scope="row"
                          className={`${baseClasses} text-left font-medium text-zinc-900 dark:text-zinc-100 ${column.className ?? ""}`}
                        >
                          {content}
                        </th>
                      );
                    }

                    return (
                      <td
                        key={column.key}
                        className={`${baseClasses} text-zinc-600 dark:text-zinc-400 ${column.className ?? ""}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-sm text-right space-x-2 first:rounded-l-lg last:rounded-r-lg">
                    {actions(row)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-4">
        {data.map((row) => {
          const rowExtraClass = rowClassName ? rowClassName(row) : undefined;
          return (
            <div
              key={keyExtractor(row)}
              className={`bg-white rounded-xl border border-zinc-200/60 shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800 p-4 ${rowExtraClass ?? ""}`}
            >
              <dl className="space-y-3">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`${alignmentClass(column.align)}`}
                  >
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
                      {column.header}
                    </dt>
                    <dd className="text-sm text-zinc-700 dark:text-zinc-300 break-words">
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                {actions(row)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
