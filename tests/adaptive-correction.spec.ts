import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { ADAPTIVE_EXAMPLES } from "../components/ui/adaptive/samples";

const evidence = ".impeccable/review/adaptive-cleanup/correction-after";
const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"];
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));
async function open(page: Page, width: number, height: number, theme: string, appearance: string) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.goto(`/components/adaptive-input?style=${appearance}`, { waitUntil: "networkidle" });
  await expect(page.getByTestId("live-demo").locator(".adaptive-prompt textarea")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function reachable(page: Page) {
  const bounds = await page.evaluate(() => {
    const view = document.querySelector(".workspace-view")!;
    view.scrollTop = 0;
    const prompt = document.querySelector('[data-testid="live-demo"] .adaptive-prompt')!.getBoundingClientRect();
    const stage = view.getBoundingClientRect();
    const dock = document.querySelector(".workspace-stage-toolbar")!.getBoundingClientRect();
    return { promptTop: prompt.top, stageTop: stage.top, stageBottom: stage.bottom, dockTop: dock.top, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  expect(bounds.promptTop).toBeGreaterThanOrEqual(bounds.stageTop);
  expect(bounds.stageBottom).toBeLessThanOrEqual(bounds.dockTop - 8);
  expect(bounds.overflow).toBeLessThanOrEqual(1);
  const end = await page.evaluate(() => {
    const view = document.querySelector(".workspace-view")!;
    view.scrollTop = view.scrollHeight;
    const caption = document.querySelector('[data-testid="live-demo"] .adaptive-demo-caption')!.getBoundingClientRect();
    const dock = document.querySelector(".workspace-stage-toolbar")!.getBoundingClientRect();
    return { captionBottom: caption.bottom, dockTop: dock.top };
  });
  expect(end.captionBottom).toBeLessThanOrEqual(end.dockTop - 8);
  await page.evaluate(() => { document.querySelector(".workspace-view")!.scrollTop = 0; window.scrollTo(0, 0); });
}

for (const theme of ["light", "dark"]) test(`actual preview remains reachable at short and narrow sizes in ${theme}`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const [width, height] of [[320, 740], [390, 844], [768, 900], [1440, 900], [1536, 781]]) {
    for (const appearance of width === 390 || width === 1536 ? appearances : ["polished", "terminal"]) {
      await open(page, width, height, theme, appearance);
      await reachable(page);
      if (appearance === "terminal") await page.screenshot({ path: `${evidence}/workspace-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
    }
  }
  expect(errors).toEqual([]);
});

for (const [width, height, theme, appearance] of [[1536, 781, "dark", "terminal"], [390, 844, "light", "polished"]] as const) {
  test(`custom request and every type work through the real workspace at ${width}px`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await open(page, width, height, theme, appearance);
    const live = page.getByTestId("live-demo"), prompt = live.getByLabel("Describe what you need", { exact: true });
    const picker = live.getByLabel("Card type", { exact: true }), examples = page.getByRole("combobox", { name: "Load example", exact: true });
    const raw = "breakfast with Subham, Eshiv, Ravi at delhi hatt, India at 6pm";
    await prompt.fill(raw);
    await expect(examples).toHaveValue("custom");
    await expect(live.getByLabel("Event title", { exact: true })).toHaveValue("Breakfast");
    await expect(live.getByLabel("Location", { exact: true })).toHaveValue("delhi hatt, India");
    await expect(live.getByLabel("Attendees", { exact: true })).toHaveValue("Subham, Eshiv, Ravi");
    await expect(live.getByLabel("Time", { exact: true })).toHaveValue("18:00");
    const fields: Record<string, string> = { reminder: "Task", checklist: "List title", timer: "Session title", color: "Color value", split: "Bill amount", convert: "Amount", calculate: "Expression", poll: "Question", bookmark: "URL" };
    for (const kind of Object.keys(ADAPTIVE_EXAMPLES)) {
      await picker.selectOption(kind);
      await expect(live.locator(".adaptive-input")).toHaveAttribute("data-intent", kind);
      await expect(prompt).toHaveValue(raw);
      if (fields[kind]) {
        await expect(live.getByLabel(fields[kind], { exact: true })).toHaveValue("");
        await expect(live.getByRole("button", { name: "Use card", exact: true })).toBeDisabled();
      }
      if (kind === "checklist") await expect(live.locator(".adaptive-list li")).toHaveCount(0);
      if (kind === "note") await expect(live.getByRole("textbox", { name: "Note text", exact: true })).toHaveValue(raw);
      await reachable(page);
    }
    await picker.selectOption("checklist");
    await live.getByLabel("List title", { exact: true }).fill("Breakfast prep");
    await live.getByLabel("New item", { exact: true }).fill("Book a table");
    await live.getByLabel("New item", { exact: true }).press("Enter");
    await live.getByLabel("Item 1", { exact: true }).fill("Confirm the booking");
    await live.getByLabel("Complete Confirm the booking", { exact: true }).check();
    await picker.selectOption("event"); await picker.selectOption("checklist");
    await expect(live.getByLabel("List title", { exact: true })).toHaveValue("Breakfast prep");
    await expect(live.getByLabel("Item 1", { exact: true })).toHaveValue("Confirm the booking");
    await reachable(page);
    await page.screenshot({ path: `${evidence}/manual-checklist-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
    await live.getByRole("button", { name: "Use card", exact: true }).click();
    await prompt.press("Escape"); await expect(prompt).toHaveValue(""); await expect(picker).toHaveValue("auto");
    await live.getByRole("button", { name: "Edit saved Checklist", exact: true }).click();
    await expect(examples).toHaveValue("saved");
    await expect(live.getByLabel("Item 1", { exact: true })).toHaveValue("Confirm the booking");
    await prompt.fill("5 miles in km");
    await expect(picker).toHaveValue("auto"); await expect(examples).toHaveValue("custom");
    await expect(live.locator(".adaptive-input")).toHaveAttribute("data-intent", "convert");
    await expect(live.getByLabel("Amount", { exact: true })).toHaveValue("5");
    await expect(live.getByRole("combobox", { name: "From unit", exact: true })).toHaveValue("mi");
    await expect(live.locator(".adaptive-conversion-result")).toContainText("8.0467");
    await prompt.press("Enter");
    await expect(live.getByRole("button", { name: "Edit saved Unit converter", exact: true })).toBeVisible();
    await reachable(page);
    await page.screenshot({ path: `${evidence}/saved-conversion-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
    for (const [kind, sample] of Object.entries(ADAPTIVE_EXAMPLES)) {
      await examples.selectOption(kind);
      await expect(prompt).toHaveValue(sample);
      await expect(live.locator(".adaptive-input")).toHaveAttribute("data-intent", kind);
      await expect(examples).toHaveValue(kind);
    }
    await page.getByRole("checkbox", { name: "Simulated async classifier", exact: true }).check();
    await prompt.fill("orange"); await prompt.fill("5 miles in km");
    await expect(live.locator(".adaptive-input")).toHaveAttribute("data-classifier", "ready");
    await expect(live.locator(".adaptive-input")).toHaveAttribute("data-intent", "convert");
    await prompt.fill("25 min focus"); await prompt.press("Escape");
    await expect(live.locator(".adaptive-input")).toHaveAttribute("data-intent", "empty");
    await expect(picker).toHaveValue("auto");
    expect(errors).toEqual([]);
  });
}
