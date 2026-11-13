/** Small arithmetic parser. No eval, dynamic code, or network requests. */
export function calculateExpression(input: string): { value: number | null; error?: string } {
  if (!input.trim()) return { value: null };
  if (input.length > 200) return { value: null, error: "Use an expression of 200 characters or fewer." };
  const source = input.toLowerCase().replace(/×/g, "*").replace(/÷/g, "/").replace(/\bof\b/g, "*").replace(/\s/g, "");
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+*/%\-]/g) ?? [];
  if (!tokens.length || tokens.join("") !== source || tokens.length > 128) return { value: null, error: "Use numbers, parentheses, +, -, *, / and percentages." };
  let index = 0, depth = 0;
  function atom(): number {
    if (++depth > 24) throw new Error("Use fewer nested parentheses.");
    let value: number;
    if (tokens[index] === "+" || tokens[index] === "-") { const sign = tokens[index++]; value = atom() * (sign === "-" ? -1 : 1); }
    else if (tokens[index] === "(") { index++; value = sum(); if (tokens[index++] !== ")") throw new Error("Close the parentheses."); }
    else { const token = tokens[index++]; if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error("Complete the expression."); value = Number(token); }
    while (tokens[index] === "%") { index++; value /= 100; }
    depth--; return value;
  }
  function product(): number { let value = atom(); while (tokens[index] === "*" || tokens[index] === "/") { const op = tokens[index++], right = atom(); if (op === "/" && right === 0) throw new Error("Cannot divide by zero."); value = op === "*" ? value * right : value / right; } return value; }
  function sum(): number { let value = product(); while (tokens[index] === "+" || tokens[index] === "-") { const op = tokens[index++], right = product(); value = op === "+" ? value + right : value - right; } return value; }
  try { const value = sum(); if (index !== tokens.length) throw new Error("Complete the expression."); if (!Number.isFinite(value)) throw new Error("The result is too large."); return { value: Object.is(value, -0) ? 0 : value }; }
  catch (error) { return { value: null, error: error instanceof Error ? error.message : "Check the expression." }; }
}
export const UNIT_INFO = {
  m: { label: "Meters", family: "length", factor: 1 }, km: { label: "Kilometers", family: "length", factor: 1000 }, cm: { label: "Centimeters", family: "length", factor: .01 }, mm: { label: "Millimeters", family: "length", factor: .001 },
  mi: { label: "Miles", family: "length", factor: 1609.344 }, ft: { label: "Feet", family: "length", factor: .3048 }, in: { label: "Inches", family: "length", factor: .0254 },
  kg: { label: "Kilograms", family: "weight", factor: 1 }, g: { label: "Grams", family: "weight", factor: .001 }, lb: { label: "Pounds", family: "weight", factor: .45359237 }, oz: { label: "Ounces", family: "weight", factor: .028349523125 },
  c: { label: "Celsius", family: "temperature", factor: 1 }, f: { label: "Fahrenheit", family: "temperature", factor: 1 }, k: { label: "Kelvin", family: "temperature", factor: 1 },
} as const;
export function convertUnit(amount: number, from: keyof typeof UNIT_INFO, to: keyof typeof UNIT_INFO): { value: number | null; error?: string } {
  if (!Number.isFinite(amount)) return { value: null, error: "Enter a finite amount." };
  if (!Object.prototype.hasOwnProperty.call(UNIT_INFO, from) || !Object.prototype.hasOwnProperty.call(UNIT_INFO, to) || UNIT_INFO[from].family !== UNIT_INFO[to].family) return { value: null, error: "Choose units of the same measurement." };
  const celsius = from === "f" ? (amount - 32) * 5 / 9 : from === "k" ? amount - 273.15 : amount;
  const value = UNIT_INFO[from].family === "temperature" ? to === "f" ? celsius * 9 / 5 + 32 : to === "k" ? celsius + 273.15 : celsius : amount * UNIT_INFO[from].factor / UNIT_INFO[to].factor;
  return Number.isFinite(value) ? { value } : { value: null, error: "The result is too large." };
}
export function displayNumber(value: number, locale = "en-US"): string { try { return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(value); } catch { return String(Math.round(value * 1e6) / 1e6); } }
export function currencyAmount(value: number, currency = "USD", locale = "en-US"): string { try { return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value); } catch { return displayNumber(value, locale) + " " + currency; } }
export function safeBookmarkUrl(value: string): string | null { try { const url = new URL(/^https?:\/\//i.test(value) ? value : /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(value) ? "https://" + value : value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : null; } catch { return null; } }
export const COLOR_NAMES: Readonly<Record<string, string>> = { orange: "#ff6a00", coral: "#ff7f50", indigo: "#6366f1", violet: "#8b5cf6", teal: "#14b8a6", mint: "#a7dfbd", pink: "#ec4899", blue: "#3b82f6", red: "#ef4444", green: "#22c55e", yellow: "#eab308", black: "#000000", white: "#ffffff", "tiffany blue": "#0abab5", "minecraft diamond": "#4aedd9" };
export function parseColor(text: string): string | null { const value = text.trim().toLowerCase(); if (Object.prototype.hasOwnProperty.call(COLOR_NAMES, value)) return COLOR_NAMES[value]; if (/^#[a-f\d]{6}$/.test(value)) return value; if (/^#[a-f\d]{3}$/.test(value)) return "#" + value.slice(1).split("").map(c => c + c).join(""); return null; }
