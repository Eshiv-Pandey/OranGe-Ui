"use client";
import { useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type PaginationProps = AppearanceProps & { page?: number; defaultPage?: number; totalPages: number; onPageChange?: (page: number) => void; label?: string; disabled?: boolean };
function wholePage(value: number) { return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1; }
export function Pagination({ appearance = "polished", className, page, defaultPage = 1, totalPages, onPageChange, label = "Pagination", disabled = false }: PaginationProps) {
  const total = wholePage(totalPages);
  const [internal, setInternal] = useState(defaultPage);
  const current = Math.min(total, wholePage(page ?? internal));
  function choose(next: number) { if (disabled) return; const value = Math.min(total, wholePage(next)); if (page === undefined) setInternal(value); onPageChange?.(value); }
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const pages = Array.from({ length: Math.min(total, 5) }, (_, index) => start + index);
  return <nav className={uiClass("ui-pagination", className)} data-appearance={appearance} aria-label={label}>
    <button type="button" onClick={() => choose(current - 1)} disabled={disabled || current === 1} aria-label="Previous page">←</button>
    {start > 1 && <><button type="button" onClick={() => choose(1)} disabled={disabled} aria-label="Page 1">1</button>{start > 2 && <span aria-hidden="true">…</span>}</>}
    {pages.map((value) => <button type="button" key={value} aria-label={"Page " + value} aria-current={current === value ? "page" : undefined} onClick={() => choose(value)} disabled={disabled}>{value}</button>)}
    {pages[pages.length - 1] < total && <>{pages[pages.length - 1] < total - 1 && <span aria-hidden="true">…</span>}<button type="button" onClick={() => choose(total)} disabled={disabled} aria-label={"Page " + total}>{total}</button></>}
    <button type="button" onClick={() => choose(current + 1)} disabled={disabled || current === total} aria-label="Next page">→</button>
  </nav>;
}
