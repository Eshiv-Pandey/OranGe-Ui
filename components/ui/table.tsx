"use client";
import { useState, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { Pagination } from "./pagination";
import "../../styles/library-components.css";
export type TableColumn<T> = { key: keyof T & string; header: string; sortable?: boolean; render?: (row: T) => ReactNode };
export type TableProps<T extends { id: string }> = AppearanceProps & { caption: string; columns: TableColumn<T>[]; rows: T[]; pageSize?: number; emptyMessage?: string };
export function Table<T extends { id: string }>({ appearance = "polished", className, caption, columns, rows, pageSize = 5, emptyMessage = "No records yet." }: TableProps<T>) {
  const [sort, setSort] = useState<{ key: keyof T & string; direction: "ascending" | "descending" } | null>(null);
  const [page, setPage] = useState(1);
  const sorted = sort ? [...rows].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * (sort.direction === "ascending" ? 1 : -1)) : rows;
  const size = Math.max(1, Math.floor(pageSize) || 5); const total = Math.max(1, Math.ceil(rows.length / size)); const current = Math.min(page, total);
  const visible = sorted.slice((current - 1) * size, current * size);
  return <div className={uiClass("ui-table", className)} data-appearance={appearance}>
    <div className="ui-table-scroll" role="region" aria-label={caption + " table"} tabIndex={0}><table>
      <caption>{caption}</caption>
      <thead><tr>{columns.map((column) => <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? sort.direction : undefined}>{column.sortable ? <button type="button" onClick={() => { setSort({ key: column.key, direction: sort?.key === column.key && sort.direction === "ascending" ? "descending" : "ascending" }); setPage(1); }}>{column.header}<span aria-hidden="true">{sort?.key === column.key ? sort.direction === "ascending" ? "↑" : "↓" : "↕"}</span></button> : column.header}</th>)}</tr></thead>
      <tbody>{visible.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String(row[column.key] ?? "")}</td>)}</tr>)}{!rows.length && <tr><td className="ui-table-empty" colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
    </table></div>
    {rows.length > size && <div className="ui-table-footer"><span>{(current - 1) * size + 1} to {Math.min(current * size, rows.length)} of {rows.length}</span><Pagination appearance={appearance} page={current} totalPages={total} onPageChange={setPage} /></div>}
  </div>;
}
