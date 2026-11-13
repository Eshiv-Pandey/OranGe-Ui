import { describe, expect, it } from "vitest";
import { isAdaptiveIntent, parseAdaptiveInput, validDate } from "../components/ui/adaptive/parser";
import { calculateExpression, convertUnit, parseColor, safeBookmarkUrl } from "../components/ui/adaptive/math";
import { ADAPTIVE_EXAMPLES } from "../components/ui/adaptive/samples";

const now = new Date(2026, 10, 6, 12);
describe("offline adaptive interpretation", () => {
  for (const [kind, text] of Object.entries(ADAPTIVE_EXAMPLES)) it("recognizes the " + kind + " example", () => {
    const intent = parseAdaptiveInput(text, { now });
    expect(intent?.kind).toBe(kind); expect(isAdaptiveIntent(intent)).toBe(true);
  });
  it("extracts local schedule, location and attendees without guessing missing event times", () => {
    expect(parseAdaptiveInput("dinner with Priya and Sam next Friday 8pm at Riverside", { now })?.data).toEqual({ title: "Dinner", date: "2026-11-13", time: "20:00", location: "Riverside", attendees: ["Priya", "Sam"] });
    expect(parseAdaptiveInput("meeting tomorrow", { now })?.data).toMatchObject({ date: "2026-11-07", time: "" });
    expect(parseAdaptiveInput("remind me to pay rent tomorrow urgent", { now })?.data).toMatchObject({ due: "2026-11-07T09:00", priority: "high" });
  });
  it.each([["12am", "00:00"], ["12pm", "12:00"], ["23:45", "23:45"], ["13pm", ""], ["8:99pm", ""]])("parses %s", (input, time) => {
    expect(parseAdaptiveInput("meeting tomorrow " + input, { now })?.data).toMatchObject({ time });
  });
  it("handles month boundaries and disabled intent sets", () => {
    expect(parseAdaptiveInput("meeting tomorrow", { now: new Date(2026, 11, 31) })?.data).toMatchObject({ date: "2027-01-01" });
    expect(parseAdaptiveInput("orange", { enabledKinds: ["note"] })?.kind).toBe("note");
    expect(parseAdaptiveInput("orange", { enabledKinds: [] })).toBeNull();
    expect(parseAdaptiveInput("orange", { enabledKinds: ["event"] })).toBeNull();
    expect(parseAdaptiveInput("  ")).toBeNull();
    expect(validDate("2026-02-29")).toBe(false); expect(validDate("2028-02-29")).toBe(true);
  });
  it("leaves invalid zero-person splits editable instead of changing the count", () => {
    expect(parseAdaptiveInput("split 30 between 0")?.data).toMatchObject({ people: 0 });
  });
  it("rejects malformed classifier results and duplicate IDs", () => {
    const poll = { kind: "poll", confidence: .9, data: { question: "Which?", options: [{ id: "a", label: "A", votes: 0 }, { id: "a", label: "B", votes: 0 }] } };
    expect(isAdaptiveIntent(poll)).toBe(false);
    expect(isAdaptiveIntent({ ...poll, data: { ...poll.data, options: [{ id: "a", label: "A", votes: 0 }], selection: "missing" } })).toBe(false);
    expect(isAdaptiveIntent({ kind: "convert", confidence: .9, data: { amount: 1, from: "constructor", to: "km" } })).toBe(false);
    expect(isAdaptiveIntent({ kind: "timer", confidence: .9, data: { title: "Timer", seconds: Infinity } })).toBe(false);
    expect(isAdaptiveIntent({ kind: "note", confidence: 2, data: { title: "Note", text: "Draft" } })).toBe(false);
  });
});
describe("bounded calculations and values", () => {
  it.each([["18% of 3450", 621], ["(48 + 12) / 3", 20], ["-2 * (3 + .5)", -7], ["8 × 3 ÷ 2", 12]])("calculates %s", (input, value) => expect(calculateExpression(input).value).toBe(value));
  it.each(["1 / 0", "2 ** 3", "alert(1)", "2 +", "(".repeat(25) + "1" + ")".repeat(25), "1".repeat(201)])("rejects %s", input => expect(calculateExpression(input).error).toBeTruthy());
  it("converts each family and rejects mixed families", () => {
    expect(convertUnit(5, "mi", "km").value).toBeCloseTo(8.04672);
    expect(convertUnit(1, "kg", "g").value).toBe(1000);
    expect(convertUnit(32, "f", "c").value).toBe(0);
    expect(convertUnit(0, "c", "k").value).toBe(273.15);
    expect(convertUnit(1, "kg", "km").value).toBeNull();
  });
  it("normalizes colors and only opens web URLs", () => {
    expect(parseColor("#aBc")).toBe("#aabbcc"); expect(parseColor("minecraft diamond")).toBe("#4aedd9");
    expect(parseColor("constructor")).toBeNull(); expect(parseColor("#12")).toBeNull();
    expect(safeBookmarkUrl("example.com/design")).toBe("https://example.com/design");
    for (const url of ["javascript:alert(1)", "data:text/html,hi", "file:///private", "not a URL"]) expect(safeBookmarkUrl(url)).toBeNull();
  });
});
