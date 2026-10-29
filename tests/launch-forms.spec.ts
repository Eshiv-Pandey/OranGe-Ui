import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import type { ComponentRegistryItem } from "../lib/component-registry";

const formSlugs = ["label", "kbd", "form", "combobox", "calendar", "date-picker", "input-otp", "file-upload", "rating", "stepper"] as const;

async function openFormDemo(page: Page, slug: typeof formSlugs[number], appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`);
  const demo = page.getByTestId("live-demo");
  await expect(demo).toBeVisible();
  return demo;
}

test("native label focuses its input and keyboard hints use semantic elements", async ({ page }) => {
  const demo = await openFormDemo(page, "label", "pixel");
  await demo.locator("label[for]").click();
  const input = demo.getByRole("textbox", { name: "Work email", exact: true });
  await expect(input).toBeFocused(); await expect(input).toHaveAttribute("required", "");
  await input.fill("hello@example.com"); await expect(input).toHaveValue("hello@example.com");
  await openFormDemo(page, "kbd", "terminal");
  await expect(page.getByTestId("live-demo").locator("kbd")).toHaveText(["Ctrl", "K"]);
});

test("form validation focuses each invalid field and successful submit and reset update feedback", async ({ page }) => {
  const demo = await openFormDemo(page, "form");
  await demo.getByRole("button", { name: "Validate details", exact: true }).click();
  const name = demo.getByRole("textbox", { name: "Name", exact: true });
  await expect(name).toBeFocused(); await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(demo.getByText("Enter at least two characters.", { exact: true })).toBeVisible();
  await name.fill("Ada");
  await demo.getByRole("textbox", { name: "Email", exact: true }).fill("invalid");
  await demo.getByRole("button", { name: "Validate details", exact: true }).click();
  await expect(demo.getByRole("textbox", { name: "Email", exact: true })).toBeFocused();
  await expect(demo.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await demo.getByRole("textbox", { name: "Email", exact: true }).fill("ada@example.com");
  await demo.getByRole("button", { name: "Validate details", exact: true }).click();
  await expect(demo.getByRole("status")).toHaveText("Details validated for Ada.");
  await demo.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(name).toHaveValue(""); await expect(demo.getByRole("textbox", { name: "Email", exact: true })).toHaveValue("");
  await expect(demo.getByRole("status")).toHaveCount(0); await expect(demo.getByRole("alert")).toHaveCount(0);
});

test("combobox filters keywords, selects with the keyboard and restores focus and selected text", async ({ page }) => {
  const demo = await openFormDemo(page, "combobox", "neobrutalism"), input = demo.getByRole("combobox", { name: "Your role", exact: true });
  await expect(input).toHaveValue("Designer"); await input.click(); await input.fill("code");
  await expect(page.getByRole("option", { name: /Engineer/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Designer/ })).toHaveCount(0);
  await input.press("Enter"); await expect(input).toHaveValue("Engineer"); await expect(input).toBeFocused();
  await input.click(); await input.fill("no such role"); await expect(page.getByText("No matching options.", { exact: true })).toBeVisible();
  await input.press("Escape"); await expect(input).toHaveValue("Engineer"); await expect(page.getByRole("listbox")).toHaveCount(0);
  await demo.getByRole("button", { name: "Clear your role", exact: true }).click(); await expect(input).toHaveValue(""); await expect(input).toBeFocused();
  await input.press("ArrowDown"); await input.press("End"); await input.press("Enter"); await expect(input).toHaveValue("Operations");
});

test("calendar keyboard navigation crosses months with one day tab stop and selected grid state", async ({ page }) => {
  const demo = await openFormDemo(page, "calendar", "terminal");
  const day = demo.getByRole("button", { name: "Thursday, November 12, 2026", exact: true });
  await day.focus(); await day.press("PageDown");
  const december = demo.getByRole("button", { name: "Saturday, December 12, 2026", exact: true });
  await expect(december).toBeFocused(); await expect(demo.getByRole("heading", { name: "December 2026" })).toBeVisible();
  await december.press("Home"); await expect(demo.getByRole("button", { name: "Monday, December 7, 2026", exact: true })).toBeFocused();
  await page.keyboard.press("End"); await page.keyboard.press("Enter");
  await expect(demo.locator('[role="gridcell"][aria-selected="true"]')).toHaveText("13");
  await expect(demo.locator('.ui-calendar-grid button[tabindex="0"]')).toHaveCount(1);
});

test("date picker on mobile focuses the selected date, stays onscreen and restores trigger focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const demo = await openFormDemo(page, "date-picker", "retro-os");
  const trigger = demo.getByRole("button", { name: "Review date November 12, 2026", exact: true });
  await trigger.click();
  const selected = page.getByRole("button", { name: "Thursday, November 12, 2026", exact: true });
  await expect(selected).toBeFocused();
  const popup = page.locator(".ui-date-picker-popup"), bounds = await popup.boundingBox();
  expect(bounds).not.toBeNull(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await selected.press("ArrowRight"); await page.keyboard.press("Enter");
  const changed = demo.getByRole("button", { name: "Review date November 13, 2026", exact: true });
  await expect(changed).toBeFocused(); await expect(demo.locator("input")).toHaveValue("2026-11-13");
  await changed.click(); await page.keyboard.press("Escape"); await expect(changed).toBeFocused();
  await demo.getByRole("button", { name: "Clear review date", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Review date Choose a date", exact: true })).toBeFocused(); await expect(demo.locator("input")).toHaveValue("");
});

test("OTP accepts a real clipboard paste and native editing updates completion feedback", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const demo = await openFormDemo(page, "input-otp", "pixel"), input = demo.getByRole("textbox", { name: "Verification code", exact: true });
  await page.evaluate(() => navigator.clipboard.writeText("12-34 56")); await input.focus(); await page.keyboard.press("Control+V");
  await expect(input).toHaveValue("123456"); await expect(demo.getByRole("status")).toHaveText("All six digits entered.");
  await input.press("Backspace"); await expect(input).toHaveValue("12345"); await expect(demo.getByRole("status")).toHaveText("Waiting for six digits.");
  await expect(demo.locator("input")).toHaveCount(1); await expect(demo.locator(".ui-otp-cells")).toHaveAttribute("aria-hidden", "true");
});

test("file chooser and drag/drop share validation, retain accepted files and synchronize removal", async ({ page }) => {
  const demo = await openFormDemo(page, "file-upload"), input = demo.locator('input[type="file"]');
  await input.setInputFiles({ name: "brief.pdf", mimeType: "application/pdf", buffer: Buffer.from("sample document") });
  await expect(demo.getByText("brief.pdf", { exact: true })).toBeVisible();
  await input.setInputFiles({ name: "unsafe.exe", mimeType: "application/octet-stream", buffer: Buffer.from("sample") });
  await expect(demo.getByRole("alert")).toContainText("choose a supported file type"); await expect(demo.getByText("brief.pdf", { exact: true })).toBeVisible();
  await demo.locator(".ui-upload-zone").evaluate((zone) => {
    const data = new DataTransfer(); data.items.add(new File(["image sample"], "sketch.png", { type: "image/png", lastModified: 42 }));
    zone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  await expect(demo.getByText("sketch.png", { exact: true })).toBeVisible(); await expect(demo.getByRole("alert")).toHaveCount(0);
  expect(await input.evaluate((element) => Array.from((element as HTMLInputElement).files ?? []).map((file) => file.name))).toEqual(["brief.pdf", "sketch.png"]);
  await demo.getByRole("button", { name: "Remove brief.pdf", exact: true }).click();
  expect(await input.evaluate((element) => Array.from((element as HTMLInputElement).files ?? []).map((file) => file.name))).toEqual(["sketch.png"]);
  await demo.getByRole("button", { name: "Remove sketch.png", exact: true }).click();
  expect(await input.evaluate((element) => (element as HTMLInputElement).files?.length)).toBe(0);
  await expect(demo.getByRole("status")).toHaveText("0 files selected.");
});

test("rating uses native arrow selection and optional clear", async ({ page }) => {
  const demo = await openFormDemo(page, "rating", "neobrutalism"), three = demo.getByRole("radio", { name: "3 stars", exact: true });
  await expect(three).toBeChecked(); await three.focus(); await three.press("ArrowRight");
  await expect(demo.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked(); await expect(demo.locator(".ui-rating-value")).toHaveText("4/5");
  await demo.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(demo.locator('input[type="radio"]:checked')).toHaveCount(0); await expect(demo.locator(".ui-rating-value")).toHaveText("0/5");
});

test("step navigation moves focus before activation and exposes ordered current progress", async ({ page }) => {
  const demo = await openFormDemo(page, "stepper", "terminal"), current = demo.getByRole("button", { name: /Preferences/ });
  await expect(current).toHaveAttribute("aria-current", "step"); await current.focus(); await current.press("End");
  const review = demo.getByRole("button", { name: /Review/ }); await expect(review).toBeFocused(); await expect(current).toHaveAttribute("aria-current", "step");
  await review.press("Enter"); await expect(review).toHaveAttribute("aria-current", "step"); await expect(current).not.toHaveAttribute("aria-current", "step");
  await review.press("Home"); const first = demo.getByRole("button", { name: /Details/ }); await expect(first).toBeFocused(); await first.press("Space"); await expect(first).toHaveAttribute("aria-current", "step");
  await expect(demo.getByRole("listitem")).toHaveCount(3);
});

test("form install command copies the current registry URL and download includes its real source graph", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openFormDemo(page, "form", "terminal");
  await page.getByRole("button", { name: "Copy install command", exact: true }).click();
  const origin = new URL(page.url()).origin;
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`npx shadcn@latest add "${origin}/r/form.json?style=terminal"`);
  await expect(page.getByRole("status").filter({ hasText: "Install command copied." })).toBeVisible();
  await page.getByRole("tab", { name: "Source", exact: true }).click();
  await expect(page.getByRole("tabpanel").locator("code")).toContainText("export function Form");
  const downloadReady = page.waitForEvent("download"); await page.getByRole("link", { name: "Download source", exact: true }).click();
  const download = await downloadReady, file = await download.path(); expect(file).not.toBeNull();
  const source = unzipSync(await readFile(file!));
  expect(Object.keys(source)).toEqual(expect.arrayContaining(["components/ui/form.tsx", "styles/launch-forms.css", "styles/library-base.css", "public/fonts/geist-latin.woff2", "LICENSE"]));
  expect(strFromU8(source["README.md"])).toContain("zod"); expect(strFromU8(source["Example.tsx"])).toContain('appearance="terminal"');
});

test("every form registry response preserves the namespace, selected appearance and text licenses", async ({ request }) => {
  for (const [index, slug] of formSlugs.entries()) {
    const appearance = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"][index % 5];
    const response = await request.get(`/r/${slug}.json?style=${appearance}`); expect(response.status(), slug).toBe(200);
    const item = await response.json() as ComponentRegistryItem;
    expect(item.type).toBe("registry:item"); expect(item.meta.appearance).toBe(appearance);
    expect(item.files.every((file) => file.target.startsWith("~/orangeui/") && !file.target.includes("..") && file.type === "registry:file")).toBe(true);
    expect(item.files.some((file) => file.path.endsWith(".woff2"))).toBe(false);
    expect(item.files.find((file) => file.path === `orangeui/examples/${slug}.tsx`)?.content).toContain(`appearance="${appearance}"`);
    expect(item.files.find((file) => file.path === "orangeui/styles/library-base.css")?.content).toContain("data:font/woff2;base64,");
    expect(item.files.find((file) => file.path === "orangeui/licenses/OFL-Geist.txt")?.content).toContain("SIL OPEN FONT LICENSE");
    if (slug === "form") expect(item.dependencies).toContain("zod");
    if (slug === "combobox" || slug === "date-picker") expect(item.dependencies).toContain("radix-ui");
  }
});
