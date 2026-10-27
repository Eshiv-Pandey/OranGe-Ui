import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

type StoryEntry = { id: string; title: string; name: string; type: string };
type StoryObservation = {
  id: string;
  palette: "light" | "dark";
  rendered: boolean;
  violations: Array<{ id: string; impact: string | null | undefined; targets: string[][] }>;
  keyboardControls: number;
  keyboardVisited: number;
  keyboardFocusFailures: number;
  keyboardOrderValid: boolean;
  fonts: Array<{ family: string; faces: number; loaded: boolean }>;
  error?: string;
};

const focusableSelector = "a[href], button, input, select, textarea, summary, [tabindex], [contenteditable='true']";

test("all indexed component stories are accessible in both palettes", async ({ page, request }) => {
  test.setTimeout(900_000);
  const origin = "http://127.0.0.1:6006";
  const indexResponse = await request.get(`${origin}/index.json`);
  expect(indexResponse.ok(), "Storybook index must be available").toBe(true);
  const index = await indexResponse.json() as { entries: Record<string, StoryEntry> };
  const stories = Object.values(index.entries).filter((entry) => entry.type === "story").sort((a, b) => a.id.localeCompare(b.id));
  expect(stories.length, "The check must cover the actual component collection").toBeGreaterThanOrEqual(20);
  expect(new Set(stories.filter((entry) => entry.title.startsWith("Library/")).map((entry) => entry.title)).size).toBe(32);

  const observations: StoryObservation[] = [];
  try {
    for (const palette of ["light", "dark"] as const) {
      for (const story of stories) {
        const observation: StoryObservation = { id: story.id, palette, rendered: false, violations: [], keyboardControls: 0, keyboardVisited: 0, keyboardFocusFailures: 0, keyboardOrderValid: true, fonts: [] };
        try {
          const url = new URL("/iframe.html", origin);
          url.searchParams.set("id", story.id);
          url.searchParams.set("viewMode", "story");
          url.searchParams.set("globals", `palette:${palette}`);
          await page.goto(url.href);
          const surface = page.locator("#storybook-root .story-surface");
          await expect(surface, `${story.id} must render the ${palette} palette`).toHaveAttribute("data-theme", palette);
          await expect(surface.locator(".ui, .pixel-button, .pixel-field, .stat-card").first(), `${story.id} must render component markup`).toBeVisible();
          await expect(page.locator(".sb-errordisplay, .sb-nopreview, .sb-error-display").filter({ visible: true })).toHaveCount(0);
          await page.evaluate(() => document.fonts.ready);
          observation.fonts = await surface.evaluate(async (element) => {
            const style = getComputedStyle(element);
            return Promise.all(["--font-body", "--font-display"].map(async (variable) => {
              const family = style.getPropertyValue(variable).trim().replace(/^["']|["']$/g, "");
              const faces = await document.fonts.load(`400 16px "${family}"`, "Small details. Solid foundations.");
              return { family, faces: faces.length, loaded: faces.length > 0 && faces.every((face) => face.status === "loaded") };
            }));
          });
          expect(observation.fonts.map((font) => font.family)).toEqual(["Geist", "Pixelify Sans"]);
          expect(observation.fonts.every((font) => font.loaded), `${story.id} (${palette}) loads both font files`).toBe(true);
          observation.rendered = true;

          const result = await new AxeBuilder({ page }).include("#storybook-root").analyze();
          observation.violations = result.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            targets: violation.nodes.map((node) => node.target.map(String)),
          }));
          expect.soft(observation.violations, `${story.id} (${palette}) accessibility including color contrast`).toEqual([]);

          const expectedFocus = await page.evaluate((selector) => {
            const root = document.getElementById("storybook-root")!;
            return Array.from(root.querySelectorAll<HTMLElement>(selector)).flatMap((element, index) => {
              const rect = element.getBoundingClientRect();
              return element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[hidden], [aria-hidden='true']") && rect.width > 0 && rect.height > 0 ? [index] : [];
            });
          }, focusableSelector);
          observation.keyboardControls = expectedFocus.length;
          const visited: number[] = [];
          for (let step = 0; step < expectedFocus.length; step++) {
            await page.keyboard.press("Tab");
            const focused = await page.evaluate(({ selector, expectedIndex }) => {
              const root = document.getElementById("storybook-root")!;
              const active = document.activeElement;
              const elements = Array.from(root.querySelectorAll(selector));
              const expected = elements[expectedIndex];
              // Roving-focus groups transfer their entry tab stop to an enabled child.
              // Arrow-key navigation within those groups is covered in library.spec.ts.
              const redirected = expected?.matches('[role="radiogroup"], [role="tablist"], [role="toolbar"], [role="group"][data-orientation]') && expected.contains(active) && active instanceof HTMLElement && active.tabIndex >= 0 && !active.matches(":disabled");
              const index = redirected ? expectedIndex : elements.indexOf(active!);
              let outlineVisible = false;
              for (let element = active; element && root.contains(element); element = element.parentElement) {
                const style = getComputedStyle(element);
                if (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0 && style.outlineColor !== "transparent" && style.outlineColor !== "rgba(0, 0, 0, 0)") outlineVisible = true;
              }
              return { index, focusVisible: Boolean(active?.matches(":focus-visible")), outlineVisible };
            }, { selector: focusableSelector, expectedIndex: expectedFocus[step] });
            visited.push(focused.index);
            if (!focused.focusVisible || !focused.outlineVisible) observation.keyboardFocusFailures++;
            expect.soft(focused.focusVisible, `${story.id} (${palette}) control ${step + 1} receives keyboard focus`).toBe(true);
            expect.soft(focused.outlineVisible, `${story.id} (${palette}) control ${step + 1} has a visible focus outline`).toBe(true);
          }
          observation.keyboardVisited = new Set(visited.filter((index) => index >= 0)).size;
          observation.keyboardOrderValid = visited.length === expectedFocus.length && visited.every((index, position) => index === expectedFocus[position]);
          expect.soft(visited, `${story.id} (${palette}) visits every enabled control once without a trap`).toEqual(expectedFocus);
          if (story.title === "Library/ToggleGroup") {
            const alignment = surface.getByRole("radiogroup", { name: "Text alignment" });
            await alignment.getByRole("radio", { name: "Left", exact: true }).focus();
            await page.keyboard.press("ArrowRight");
            await expect(alignment.getByRole("radio", { name: "Center", exact: true })).toBeFocused();
            await page.keyboard.press("Space");
            await expect(alignment.getByRole("radio", { name: "Center", exact: true })).toBeChecked();
            await expect(alignment.getByRole("radio", { name: "Left", exact: true })).not.toBeChecked();
            await page.keyboard.press("Tab");
            const formatting = surface.getByRole("toolbar", { name: "Text formatting" });
            await expect(formatting.getByRole("button", { name: "Bold", exact: true })).toBeFocused();
            await page.keyboard.press("ArrowRight");
            const italic = formatting.getByRole("button", { name: "Italic", exact: true });
            await expect(italic).toBeFocused();
            await page.keyboard.press("Space");
            await expect(italic).toHaveAttribute("aria-pressed", "true");
            await expect(formatting.getByRole("button", { name: "Bold", exact: true })).toHaveAttribute("aria-pressed", "true");
            await page.keyboard.press("Space");
            await expect(italic).toHaveAttribute("aria-pressed", "false");
            await page.keyboard.press("Shift+Tab");
            await expect(alignment.getByRole("radio", { name: "Center", exact: true })).toBeFocused();
          }
        } catch (error) {
          observation.error = error instanceof Error ? error.message : String(error);
          expect.soft(observation.error, `${story.id} (${palette}) completed rendering and verification`).toBeUndefined();
        } finally {
          observations.push(observation);
        }
      }
    }
  } finally {
    await mkdir("out", { recursive: true });
    await writeFile("out/storybook-a11y.json", JSON.stringify({
      storyCount: stories.length,
      palettes: ["light", "dark"],
      expectedChecks: stories.length * 2,
      completedChecks: observations.length,
      renderedChecks: observations.filter((item) => item.rendered).length,
      passedChecks: observations.filter((item) => item.rendered && !item.error && item.violations.length === 0 && item.keyboardFocusFailures === 0 && item.keyboardOrderValid).length,
      errorCount: observations.filter((item) => item.error).length,
      violationCount: observations.reduce((count, item) => count + item.violations.length, 0),
      keyboardControlCount: observations.reduce((count, item) => count + item.keyboardControls, 0),
      keyboardVisitedCount: observations.reduce((count, item) => count + item.keyboardVisited, 0),
      keyboardFocusFailureCount: observations.reduce((count, item) => count + item.keyboardFocusFailures, 0),
      loadedFontChecks: observations.reduce((count, item) => count + item.fonts.filter((font) => font.loaded).length, 0),
      stories: observations,
    }, null, 2) + "\n");
  }
  expect(observations).toHaveLength(stories.length * 2);
  expect(observations.every((item) => item.rendered && !item.error), "Every indexed story must render and complete its check").toBe(true);
});
