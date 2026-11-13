import { ADAPTIVE_KINDS, type AdaptiveIntent, type AdaptiveKind, type Unit } from "./types";
import { parseColor, safeBookmarkUrl, UNIT_INFO } from "./math";

function dateKey(date: Date): string { return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0"); }
function title(text: string): string { const value = text.trim().replace(/[?.]+$/, ""); return value ? value.charAt(0).toUpperCase() + value.slice(1) : ""; }
function dateFromText(text: string, now: Date): string {
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/); if (iso && validDate(iso[0])) return iso[0];
  const date = new Date(now);
  if (/\btomorrow\b/i.test(text)) { date.setDate(date.getDate() + 1); return dateKey(date); }
  if (/\btoday\b/i.test(text)) return dateKey(date);
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const match = text.toLowerCase().match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (!match) return "";
  let delta = (names.indexOf(match[2]) - date.getDay() + 7) % 7;
  // Both Friday and next Friday mean the next occurrence, strictly after today.
  if (!delta) delta = 7;
  date.setDate(date.getDate() + delta); return dateKey(date);
}
function timeFromText(text: string): string {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ?? text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return ""; let hours = Number(match[1]); const minutes = Number(match[2] ?? 0);
  if (match[3]) { if (hours < 1 || hours > 12) return ""; hours = hours % 12 + (match[3].toLowerCase() === "pm" ? 12 : 0); }
  if (hours > 23 || minutes > 59) return "";
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}
function stripSchedule(text: string): string { return text.replace(/\b(next\s+)?(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday|urgent)\b/gi, "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, "").replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, "").replace(/\b\d{1,2}:\d{2}\b/g, "").replace(/\s+/g, " ").trim(); }
export function validDate(text: string): boolean { if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false; const date = new Date(text + "T00:00:00Z"); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text; }
const aliases: Record<string, Unit> = { meter: "m", meters: "m", metre: "m", metres: "m", kilometer: "km", kilometers: "km", centimetre: "cm", centimeters: "cm", mile: "mi", miles: "mi", feet: "ft", foot: "ft", inch: "in", inches: "in", kilogram: "kg", kilograms: "kg", gram: "g", grams: "g", pound: "lb", pounds: "lb", lbs: "lb", ounce: "oz", ounces: "oz", celsius: "c", fahrenheit: "f", kelvin: "k" };
function unit(text: string): Unit | null { const key = text.toLowerCase().replace(/°/g, ""); return Object.prototype.hasOwnProperty.call(aliases, key) ? aliases[key] : Object.prototype.hasOwnProperty.call(UNIT_INFO, key) ? key as Unit : null; }
export function parseAdaptiveInput(input: string, options: { now?: Date; currency?: string; enabledKinds?: readonly AdaptiveKind[] } = {}): AdaptiveIntent | null {
  const raw = input.trim().slice(0, 4000); if (!raw) return null;
  const now = options.now && Number.isFinite(options.now.getTime()) ? options.now : new Date();
  const date = dateFromText(raw, now), time = timeFromText(raw);
  let intent: AdaptiveIntent;
  const url = raw.match(/https?:\/\/[^\s]+/i)?.[0] ?? (/^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(raw) ? raw.split(/\s/)[0] : "");
  const color = parseColor(raw.replace(/^colou?r\s*[:=]?\s*/i, ""));
  const convert = raw.match(/(-?\d+(?:\.\d+)?)\s*([a-z°]+)\s+(?:in|to)\s+([a-z°]+)/i);
  const split = raw.match(/\bsplit\s*([₹$£€]?)\s*(\d+(?:\.\d+)?)\s*(?:between|among|by|\/)\s*(\d+)\b/i);
  if (url && safeBookmarkUrl(url)) intent = { kind: "bookmark", confidence: .99, data: { url: safeBookmarkUrl(url)!, title: title(raw.replace(url, "")) || new URL(safeBookmarkUrl(url)!).hostname, description: "" } };
  else if (color) intent = { kind: "color", confidence: .99, data: { color, name: raw.startsWith("#") ? "" : title(raw.replace(/^colou?r\s*[:=]?\s*/i, "")) } };
  else if (/\b(remind|reminder)\b/i.test(raw)) intent = { kind: "reminder", confidence: .95, data: { title: title(stripSchedule(raw.replace(/^remind(?:\s+me)?(?:\s+to)?\s*/i, "").replace(/^reminder\s*:?\s*/i, ""))) || "Reminder", due: date ? date + "T" + (time || "09:00") : "", priority: /\b(urgent|important|high priority)\b/i.test(raw) ? "high" : "normal", completed: false }, explanation: date ? "Relative dates use your local calendar. Check the due time." : "Add a due time if this reminder needs one." };
  else if (/^(buy|shopping|checklist|todo|tasks)\b/i.test(raw)) {
    const items = raw.replace(/^(buy|shopping|checklist|todo|tasks)\s*:?\s*/i, "").split(/,|;|\n|\s+and\s+/i).map(text => title(text)).filter(Boolean);
    intent = { kind: "checklist", confidence: .95, data: { title: /^buy|shopping/i.test(raw) ? "Groceries" : "Checklist", items: items.slice(0, 100).map((text, index) => ({ id: "item-" + index, text, checked: false })) } };
  } else if (split) intent = { kind: "split", confidence: .99, data: { amount: Number(split[2]), people: Number(split[3]), currency: ({ "₹": "INR", "$": "USD", "£": "GBP", "€": "EUR" } as Record<string,string>)[split[1]] ?? options.currency ?? "USD" } };
  else if (convert && unit(convert[2]) && unit(convert[3])) intent = { kind: "convert", confidence: .99, data: { amount: Number(convert[1]), from: unit(convert[2])!, to: unit(convert[3])! } };
  else if (/\b(focus|timer|count\s*down)\b/i.test(raw) || /^\d+\s*(?:min|sec|hour|h\b|m\b|s\b)/i.test(raw)) {
    let seconds = 0; for (const match of raw.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|minutes?|mins?|m\b|seconds?|secs?|s\b)/gi)) seconds += Number(match[1]) * (/^h/i.test(match[2]) ? 3600 : /^m/i.test(match[2]) ? 60 : 1);
    intent = { kind: "timer", confidence: .92, data: { title: /\bfocus\b/i.test(raw) ? "Focus session" : "Timer", seconds: Math.min(86400, Math.max(0, Math.round(seconds))) } };
  } else if (/\bor\b|\|/i.test(raw) && /\?|^poll\b/i.test(raw)) {
    const options = raw.replace(/^poll\s*:?\s*/i, "").replace(/\s+for\s+.*$/i, "").replace(/\?$/, "").split(/\s+or\s+|\|/i).map(text => title(text)).filter(Boolean);
    intent = { kind: "poll", confidence: .88, data: { question: title(raw.replace(/^poll\s*:?\s*/i, "")) + "?", options: options.slice(0, 12).map((label, index) => ({ id: "choice-" + index, label, votes: 0 })) } };
  } else if (/\b(meeting|meet|dinner|lunch|breakfast|call|event|appointment)\b/i.test(raw)) {
    const withoutSchedule = stripSchedule(raw), location = withoutSchedule.match(/\s+at\s+(.+)$/i)?.[1] ?? "";
    const clean = withoutSchedule.replace(/\s+at\s+.+$/i, ""), attendeeText = clean.match(/\s+with\s+(.+)$/i)?.[1] ?? "";
    intent = { kind: "event", confidence: .91, data: { title: title(clean.replace(/\s+with\s+.+$/i, "")) || "Event", date, time, location, attendees: attendeeText.split(/,|\s+and\s+/i).map(name => title(name)).filter(Boolean) }, explanation: date ? "Relative dates use your local calendar. Check the event details." : "Choose a date and time before using this event." };
  } else if (/^(calculate|calc|what is)\b/i.test(raw) || /^[\d\s().%+*/-]+(?:\s+of\s+[\d\s().%+*/-]+)?$/i.test(raw) && /[+*/%()-]|\bof\b/.test(raw)) intent = { kind: "calculate", confidence: .95, data: { expression: raw.replace(/^(calculate|calc|what is)\s*:?\s*/i, "").replace(/\?$/, "") } };
  else intent = { kind: "note", confidence: .5, data: { title: title(raw.split("\n")[0]).slice(0, 80) || "Note", text: raw } };
  return !options.enabledKinds || options.enabledKinds.includes(intent.kind) ? intent : options.enabledKinds.includes("note") ? { kind: "note", confidence: .5, data: { title: "Note", text: raw }, explanation: "Choose an enabled card type to interpret this text." } : null;
}
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const string = (value: unknown): value is string => typeof value === "string" && value.length <= 10000;
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const list = (value: unknown, test: (value: unknown) => boolean): boolean => Array.isArray(value) && value.length <= 200 && value.every(test);
const uniqueIds = (value: unknown): boolean => Array.isArray(value) && value.every(item => record(item) && string(item.id) && item.id.length > 0) && new Set(value.map(item => item.id)).size === value.length;
export function isAdaptiveIntent(value: unknown): value is AdaptiveIntent {
  const intent = record(value), data = record(intent?.data);
  if (!intent || !data || !ADAPTIVE_KINDS.includes(intent.kind as AdaptiveKind) || !number(intent.confidence) || intent.confidence < 0 || intent.confidence > 1 || intent.explanation !== undefined && !string(intent.explanation)) return false;
  switch (intent.kind) {
    case "event": return ["title", "date", "time", "location"].every(key => string(data[key])) && list(data.attendees, string);
    case "reminder": return string(data.title) && string(data.due) && ["low", "normal", "high"].includes(data.priority as string) && typeof data.completed === "boolean";
    case "checklist": return string(data.title) && uniqueIds(data.items) && list(data.items, value => { const item = record(value); return Boolean(item && string(item.id) && string(item.text) && typeof item.checked === "boolean"); });
    case "timer": return string(data.title) && number(data.seconds) && data.seconds >= 0 && data.seconds <= 86400;
    case "color": return string(data.color) && parseColor(data.color) !== null && string(data.name);
    case "split": return number(data.amount) && data.amount >= 0 && number(data.people) && Number.isInteger(data.people) && data.people >= 1 && data.people <= 100000 && string(data.currency);
    case "convert": return number(data.amount) && typeof data.from === "string" && Object.prototype.hasOwnProperty.call(UNIT_INFO, data.from) && typeof data.to === "string" && Object.prototype.hasOwnProperty.call(UNIT_INFO, data.to);
    case "calculate": return string(data.expression);
    case "poll": return string(data.question) && uniqueIds(data.options) && (data.selection === undefined || string(data.selection) && Array.isArray(data.options) && data.options.some(option => record(option)?.id === data.selection)) && list(data.options, value => { const option = record(value); return Boolean(option && string(option.id) && string(option.label) && number(option.votes) && Number.isInteger(option.votes) && option.votes >= 0); });
    case "bookmark": return string(data.url) && string(data.title) && string(data.description);
    case "note": return string(data.title) && string(data.text);
    default: return false;
  }
}
