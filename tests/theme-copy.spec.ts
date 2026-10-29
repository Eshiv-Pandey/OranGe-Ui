import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { contrastRatio, themeCss } from "../lib/theme";

// Exercise the copied stylesheet against real base tokens in a clean consumer,
// without the application's inline accent store masking cascade failures.
let tokens = "";
test.beforeAll(async () => { tokens = await readFile("styles/tokens.css", "utf8"); });

const cases = [
  { label: "system dark", system: "dark", explicit: undefined, dark: true },
  { label: "explicit light over dark system", system: "dark", explicit: "light", dark: false },
  { label: "explicit dark over light system", system: "light", explicit: "dark", dark: true },
  { label: "system light", system: "light", explicit: undefined, dark: false },
] as const;

for (const entry of cases) {
  test(`copied theme CSS preserves its accent and readable text under ${entry.label}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: entry.system });
    const copied = themeCss("#2563eb", "polished");
    await page.setContent(`<html${entry.explicit ? ` data-theme="${entry.explicit}"` : ""}><head><style>${tokens}</style><style>${copied}</style><style>body { background: var(--surface-soft); } button { background: var(--primary); color: var(--on-primary); } a { color: var(--primary-text); }</style></head><body><button type="button">Continue</button><a href="#example">Read the example</a></body></html>`);
    const colors = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const token = (name: string) => root.getPropertyValue(name).trim();
      return {
        accent: token("--primary"), foreground: token("--on-primary"),
        text: token("--primary-text"), focus: token("--focus"), surface: token("--surface-soft"),
        buttonBackground: getComputedStyle(document.querySelector("button")!).backgroundColor,
        hasInlineAccent: document.documentElement.style.getPropertyValue("--primary") !== "",
      };
    });
    expect(colors.hasInlineAccent).toBe(false);
    expect(colors.accent).toBe("#2563eb");
    expect(colors.buttonBackground).toBe("rgb(37, 99, 235)");
    expect(colors.surface).toBe(entry.dark ? "#171717" : "#f2f2f2");
    expect(colors.focus).toBe(colors.text);
    expect(contrastRatio(colors.text, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.foreground, colors.accent)).toBeGreaterThanOrEqual(4.5);
  });
}
