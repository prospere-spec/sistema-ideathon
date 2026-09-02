import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({ columns, rows, empty }: { columns: DataColumn<T>[]; rows: T[]; empty?: ReactNode }) {
  if (!rows.length) return empty || null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr className="bg-surface-low/60">
            {columns.map((column) => <th key={column.key} className={cn("px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted", column.className)}>{column.header}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/30">
          {rows.map((row) => (
            <tr key={row.id} className="group transition-colors hover:bg-surface-low/50">
              {columns.map((column) => <td key={column.key} className={cn("px-5 py-4 align-middle text-sm text-ink", column.className)}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
