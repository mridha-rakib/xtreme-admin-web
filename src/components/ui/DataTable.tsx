import { cn } from "@/lib/utils";
import type React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-brand-line bg-surface-card",
        className,
      )}
    >
      <table className="w-full text-left text-sm text-brand-onyx">
        <thead className="border-b border-brand-line bg-surface-subtle/60 text-xs font-semibold uppercase tracking-wider text-brand-slate">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-3", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line/60">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-xs text-brand-slate"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-surface-subtle/30 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-sm", col.className)}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
