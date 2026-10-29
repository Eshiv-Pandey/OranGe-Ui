/** Date-only ISO helpers. UTC arithmetic avoids daylight-saving shifts. */
export function isCalendarDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function calendarDate(value: string): Date { return new Date(`${value}T12:00:00Z`); }
export function dateString(value: Date): string { return value.toISOString().slice(0, 10); }
export function addCalendarDays(value: string, amount: number): string { const date = calendarDate(value); date.setUTCDate(date.getUTCDate() + amount); return dateString(date); }
export function addCalendarMonths(value: string, amount: number): string {
  const date = calendarDate(value), day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + amount);
  const last = new Date(date); last.setUTCMonth(last.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(day, last.getUTCDate())); return dateString(date);
}
export function calendarMonth(value: string): string { return `${value.slice(0, 7)}-01`; }
export function formatCalendarDate(value: string, locale = "en-US", options: Intl.DateTimeFormatOptions = { dateStyle: "long" }): string {
  try { return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(calendarDate(value)); }
  catch { return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(calendarDate(value)); }
}
export function localToday(): string { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function clampCalendarDate(value: string, min?: string, max?: string): string { return min && value < min ? min : max && value > max ? max : value; }
export function calendarDays(month: string, weekStartsOn = 0): string[] {
  const first = calendarMonth(month), offset = (calendarDate(first).getUTCDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(first, index - offset));
}
