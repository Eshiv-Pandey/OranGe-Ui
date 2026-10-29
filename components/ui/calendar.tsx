"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { addCalendarDays, addCalendarMonths, calendarDate, calendarDays, calendarMonth, clampCalendarDate, formatCalendarDate, isCalendarDate, localToday } from "./calendar-date";
import "../../styles/launch-forms.css";

export type CalendarProps = AppearanceProps & {
  value?: string; defaultValue?: string; onValueChange?: (date: string) => void;
  month?: string; defaultMonth?: string; onMonthChange?: (month: string) => void;
  min?: string; max?: string; disabled?: boolean; isDateDisabled?: (date: string) => boolean;
  locale?: string; weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; label?: string; autoFocus?: boolean;
};
const subscribeToToday = () => () => {};
const serverToday = () => "";

/** A single date grid, with roving keyboard focus and date-only values. */
export function Calendar({ value, defaultValue = "", onValueChange, month, defaultMonth, onMonthChange, min, max, disabled, isDateDisabled, locale = "en-US", weekStartsOn = 0, label = "Choose a date", autoFocus = false, appearance = "polished", className }: CalendarProps) {
  const today = useSyncExternalStore(subscribeToToday, localToday, serverToday), heading = useId(), grid = useRef<HTMLTableElement>(null);
  const [internal, setInternal] = useState(defaultValue), [internalMonth, setInternalMonth] = useState(defaultMonth ?? ""), [focused, setFocused] = useState("");
  const pendingFocus = useRef(autoFocus), initialFocus = useRef(autoFocus);
  const selected = isCalendarDate(value ?? internal) ? value ?? internal : "";
  const lower = isCalendarDate(min) ? min : undefined, upper = isCalendarDate(max) ? max : undefined;
  const seed = [month, internalMonth, selected, today].find(isCalendarDate);
  const visibleMonth = seed ? calendarMonth(clampCalendarDate(seed, lower, upper)) : "";
  const dates = visibleMonth ? calendarDays(visibleMonth, weekStartsOn) : [];
  const blocked = (date: string) => Boolean(disabled || lower && date < lower || upper && date > upper || isDateDisabled?.(date));
  const inMonth = (date: string) => date.slice(0, 7) === visibleMonth.slice(0, 7);
  const focusDate = [focused, selected, today].find((date) => isCalendarDate(date) && inMonth(date) && !blocked(date)) ?? dates.find((date) => inMonth(date) && !blocked(date));
  useEffect(() => {
    if ((pendingFocus.current || initialFocus.current) && focusDate) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
      pendingFocus.current = false; initialFocus.current = false;
    }
  }, [focusDate, visibleMonth]);
  function show(date: string) { const next = calendarMonth(clampCalendarDate(date, lower, upper)); if (month === undefined) setInternalMonth(next); onMonthChange?.(next); }
  function choose(date: string) { if (blocked(date)) return; if (value === undefined) setInternal(date); onValueChange?.(date); setFocused(date); if (!inMonth(date)) { pendingFocus.current = true; show(date); } }
  function navigate(date: string, direction: number) {
    let next = clampCalendarDate(date, lower, upper);
    for (let count = 0; blocked(next) && count < 366; count++) {
      const candidate = addCalendarDays(next, direction);
      if (lower && candidate < lower || upper && candidate > upper) return;
      next = candidate;
    }
    if (blocked(next)) return;
    pendingFocus.current = true; setFocused(next); if (!inMonth(next)) show(next);
    if (next === focusDate) grid.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus();
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = (calendarDate(date).getUTCDay() - weekStartsOn + 7) % 7;
    const shift = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7, Home: -weekday, End: 6 - weekday } as Record<string, number>)[event.key];
    if (shift !== undefined) { event.preventDefault(); navigate(addCalendarDays(date, shift), shift < 0 ? -1 : 1); }
    else if (event.key === "PageUp" || event.key === "PageDown") { event.preventDefault(); const delta = (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1); navigate(addCalendarMonths(date, delta), delta < 0 ? -1 : 1); }
  }
  const previous = visibleMonth ? addCalendarMonths(visibleMonth, -1) : "", next = visibleMonth ? addCalendarMonths(visibleMonth, 1) : "";
  return <section className={uiClass("ui-calendar ui-surface", className)} data-appearance={appearance} aria-label={label} data-disabled={disabled || undefined}>
    {visibleMonth ? <>
      <header className="ui-calendar-header">
        <button type="button" className="ui-icon-button" aria-label="Previous month" disabled={disabled || Boolean(lower && previous.slice(0, 7) < lower.slice(0, 7))} onClick={() => show(previous)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12 5-5 5 5 5"/></svg></button>
        <h3 id={heading} aria-live="polite">{formatCalendarDate(visibleMonth, locale, { month: "long", year: "numeric" })}</h3>
        <button type="button" className="ui-icon-button" aria-label="Next month" disabled={disabled || Boolean(upper && next.slice(0, 7) > upper.slice(0, 7))} onClick={() => show(next)}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5"/></svg></button>
      </header>
      <table ref={grid} role="grid" aria-labelledby={heading} className="ui-calendar-grid"><thead><tr>{dates.slice(0, 7).map((date) => <th key={date} scope="col" aria-label={formatCalendarDate(date, locale, { weekday: "long" })}>{formatCalendarDate(date, locale, { weekday: "short" })}</th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, row) => <tr key={row}>{dates.slice(row * 7, row * 7 + 7).map((date) => <td key={date} role="gridcell" aria-selected={selected === date}><button type="button" data-date={date} data-outside={!inMonth(date) || undefined} data-selected={selected === date || undefined} aria-label={formatCalendarDate(date, locale, { dateStyle: "full" })} aria-current={date === today ? "date" : undefined} disabled={blocked(date)} tabIndex={date === focusDate ? 0 : -1} onFocus={() => setFocused(date)} onKeyDown={(event) => keyDown(event, date)} onClick={() => choose(date)}>{calendarDate(date).getUTCDate()}</button></td>)}</tr>)}</tbody>
      </table>
      {!focusDate && <p className="ui-help" role="status">No dates available this month.</p>}
    </> : <p className="ui-calendar-loading" role="status">Loading calendar...</p>}
  </section>;
}
