import { describe, expect, it } from "vitest";
import { accentTokens, contrastRatio, normalizeAccent, themeCss } from "../lib/theme";

describe("custom accent readability", () => {
  it("keeps labels readable on accents and hover colors, including midtone gaps", () => {
    const colors = ["#777777", "#808080", "#ff6a00", "#000000", "#ffffff"];
    for (let red = 0; red <= 255; red += 51) for (let green = 0; green <= 255; green += 51) for (let blue = 0; blue <= 255; blue += 51) colors.push("#" + [red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join(""));
    for (const color of colors) for (const dark of [false, true]) {
      const tokens = accentTokens(color, dark);
      expect(contrastRatio(tokens["--primary"], tokens["--on-primary"]), color).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(tokens["--primary-hover"], tokens["--on-primary"]), color).toBeGreaterThanOrEqual(4.5);
      for (const surface of dark ? ["#171717", "#1f1f1f"] : ["#f2f2f2", "#e5e5e5"]) {
        expect(contrastRatio(tokens["--primary-text"], surface), `${color} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it("rejects CSS injection and copies both palettes with the chosen appearance", () => {
    expect(normalizeAccent("red; background:url(example)")).toBe("#ff6a00");
    expect(normalizeAccent("#ABCDEF")).toBe("#abcdef");
    const css = themeCss("#2563eb", "terminal");
    expect(css).toContain('appearance="terminal"');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain("--primary: #2563eb");
  });
});
