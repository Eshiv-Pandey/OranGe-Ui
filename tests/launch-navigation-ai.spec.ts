import { expect, test, type Locator, type Page } from "@playwright/test";

// The shared launch config owns the server, appearance matrix and browser lifecycle.
test.use({ viewport: { width: 1366, height: 768 } });

async function openDemo(page: Page, slug: string) {
  await page.goto(`/components/${slug}?style=polished`);
  const demo = page.getByTestId("live-demo");
  await expect(demo).toBeVisible();
  return demo;
}

async function chooseOption(page: Page, trigger: Locator, option: string) {
  await trigger.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("navigation menu exposes current destinations, disabled links and keyboard dismissal", async ({ page }) => {
  const demo = await openDemo(page, "navigation-menu");
  const trigger = demo.getByRole("button", { name: "Workspace", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(demo.getByRole("link", { name: /^Members/ })).toHaveAttribute("aria-disabled", "true");
  await demo.getByRole("link", { name: /^Activity/ }).click();
  await expect(demo.locator(".demo-feedback")).toHaveText("Activity selected in this preview.");
  await trigger.focus();
  await trigger.press("Escape");
  await trigger.press("Enter");
  await expect(demo.getByRole("link", { name: /^Activity/ })).toHaveAttribute("aria-current", "page");
  await trigger.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("navbar actions and mobile navigation update the demo and restore focus", async ({ page }) => {
  let demo = await openDemo(page, "navbar");
  await demo.getByRole("button", { name: "Account", exact: true }).click();
  await expect(demo.locator(".demo-feedback")).toHaveText("Account selected in this preview.");
  await page.setViewportSize({ width: 390, height: 844 });
  demo = page.getByTestId("live-demo");
  const trigger = demo.getByRole("button", { name: "Open main navigation", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Main navigation", exact: true });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("navigation", { name: "Main navigation mobile", exact: true })).toBeVisible();
  await sheet.getByRole("link", { name: /^Activity/ }).click();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(demo.locator(".demo-feedback")).toHaveText("Activity selected in this preview.");
});

test("sidebar collapse preserves named links and mobile selection closes its sheet", async ({ page }) => {
  const demo = await openDemo(page, "sidebar");
  await demo.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
  await expect(demo.locator(".ui-sidebar")).toHaveAttribute("data-collapsed", "true");
  await expect(demo.getByRole("link", { name: /^Overview/ })).toHaveAttribute("aria-current", "page");
  await expect(demo.getByRole("button", { name: "Workspace settings", exact: true })).toHaveCount(0);
  await demo.getByRole("button", { name: "Expand sidebar", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Workspace settings", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = demo.getByRole("button", { name: "Navigation", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Studio navigation", exact: true });
  await sheet.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(demo.locator(".demo-feedback")).toHaveText("Settings selected in this preview.");
});

test("context menu supports Shift+F10, enabled action keys and Escape focus return", async ({ page }) => {
  const demo = await openDemo(page, "context-menu");
  const trigger = demo.getByRole("button", { name: /^Studio notes/ });
  await trigger.focus();
  await trigger.press("Shift+F10");
  const menu = page.getByRole("menu", { name: "Project actions", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Share", exact: true })).toHaveAttribute("aria-disabled", "true");
  await menu.getByRole("menuitem", { name: "Rename", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Duplicate", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(demo.locator(".demo-feedback")).toHaveText("Duplicate selected in this preview.");
  await expect(trigger).toBeFocused();
  await trigger.press("Shift+F10");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("hover card exposes a supplementary description on keyboard focus", async ({ page }) => {
  const demo = await openDemo(page, "hover-card");
  const trigger = demo.getByRole("link", { name: "Jamie Reed", exact: true });
  await trigger.focus();
  const card = page.getByRole("note");
  await expect(card).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription(/Design systems engineer/);
  await page.keyboard.press("Tab");
  await expect(card).toBeHidden();
});

test("scroll area scrolls its named viewport with native keyboard keys", async ({ page }) => {
  const demo = await openDemo(page, "scroll-area");
  const region = demo.getByRole("region", { name: "Recent workspace activity", exact: true });
  await region.focus();
  await region.press("End");
  await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await region.press("Home");
  await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBe(0);
});

test("carousel keys, boundary controls and manual loop preserve inactive slide semantics", async ({ page }) => {
  const demo = await openDemo(page, "carousel");
  const viewport = demo.locator(".ui-carousel-viewport");
  await viewport.focus();
  await viewport.press("ArrowRight");
  await expect(demo.locator(".ui-carousel-status")).toHaveText("2 / 3");
  await expect(demo.locator(".ui-carousel-slide").first()).toHaveAttribute("inert", "");
  await expect(demo.locator(".ui-carousel-slide").nth(1)).toHaveAttribute("aria-hidden", "false");
  await viewport.press("End");
  await expect(demo.getByRole("button", { name: "Next slide", exact: true })).toBeDisabled();
  await demo.getByRole("switch", { name: "Loop slides", exact: true }).click();
  await demo.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(demo.locator(".ui-carousel-status")).toHaveText("1 / 3");
});

test("code block keeps display controls separate from the exact clipboard fallback", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new DOMException("Clipboard denied for this test", "NotAllowedError"); } } }));
  const demo = await openDemo(page, "code-block");
  await demo.getByRole("button", { name: "Copy code", exact: true }).click();
  const fallback = demo.getByRole("textbox", { name: "Code to copy", exact: true });
  await expect(fallback).toBeVisible();
  await expect(fallback).toBeFocused();
  const original = await fallback.inputValue();
  expect(original).toContain('const palette = ["orange", "mint", "sky"];');
  expect(original.endsWith("\n")).toBe(true);
  expect(await fallback.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(original.length);
  await demo.getByRole("switch", { name: "Line numbers", exact: true }).click();
  await expect(demo.locator(".ui-code-line-number")).toHaveCount(0);
  await demo.getByRole("switch", { name: "Wrap long lines", exact: true }).click();
  await expect(demo.locator(".ui-code-block")).toHaveAttribute("data-wrap", "true");
  await expect(fallback).toHaveValue(original);
});

test("chat message streams text, preserves stopped content and can reset and complete", async ({ page }) => {
  const demo = await openDemo(page, "chat-message");
  const message = demo.getByRole("article", { name: "Workspace helper", exact: true });
  const content = message.locator(".ui-chat-content");
  await demo.getByRole("button", { name: "Start response", exact: true }).click();
  await expect(content).toHaveAttribute("aria-busy", "true");
  await expect(content).toContainText("smallest useful");
  await demo.getByRole("button", { name: "Stop response", exact: true }).click();
  await expect(message.getByRole("status")).toHaveText("Response stopped");
  const partial = await content.innerText();
  await page.waitForTimeout(250);
  await expect(content).toHaveText(partial);
  await expect(content).not.toHaveAttribute("aria-live");
  await expect(content).not.toHaveAttribute("aria-busy");
  await demo.getByRole("button", { name: "Reset response", exact: true }).click();
  await expect(message.getByRole("status")).toHaveText("Ready to preview");
  await demo.getByRole("button", { name: "Start response", exact: true }).click();
  await expect(message.getByRole("status")).toHaveText("Response complete", { timeout: 10_000 });
  await expect(content).toContainText("viewport shrinks.");
});

test("prompt composer preserves composition and newlines and exposes send, stop, files and models", async ({ page }) => {
  const demo = await openDemo(page, "prompt-input");
  const input = demo.getByRole("textbox", { name: "Your message", exact: true });
  await input.fill("First line");
  await input.dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true });
  await expect(input).toHaveValue("First line");
  await expect(demo.getByRole("button", { name: "Stop response", exact: true })).toHaveCount(0);
  await input.press("Shift+Enter");
  await input.pressSequentially("Second line");
  await expect(input).toHaveValue("First line\nSecond line");
  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(demo.locator(".launch-submitted-text")).toContainText("Submitted to the local preview: First line", { timeout: 4000 });
  await input.fill("A second request");
  await input.press("Enter");
  await demo.getByRole("button", { name: "Stop response", exact: true }).click();
  await expect(demo.locator(".launch-submitted-text")).toHaveText("Response stopped in this preview.");
  await demo.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("Local attachment preview") });
  await expect(demo.getByText("notes.txt", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Remove notes.txt", exact: true }).click();
  await expect(demo.getByText("notes.txt", { exact: true })).toHaveCount(0);
  const model = demo.getByRole("combobox", { name: "Response model", exact: true });
  await model.focus();
  await model.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(model).toContainText("Reason");
});

test("tool details expose named input/output, error recovery and controlled status changes", async ({ page }) => {
  const demo = await openDemo(page, "tool-call-card");
  const trigger = demo.getByRole("button", { name: /^Search component files / });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(demo.getByRole("region", { name: "Search component files input", exact: true })).toContainText("theme tokens");
  await expect(demo.getByRole("region", { name: "Search component files output", exact: true })).toContainText("tokens.css");
  await chooseOption(page, demo.getByRole("combobox", { name: "Tool state", exact: true }), "Failed");
  await expect(demo.getByRole("alert")).toHaveText("The source is unavailable. Try the example again.");
  await demo.getByRole("button", { name: "Retry search", exact: true }).click();
  await expect(demo.locator(".ui-tool-state")).toHaveText("Running");
  await expect(demo.getByRole("alert")).toHaveCount(0);
});

test("agent status announces explicit waiting and error labels without fabricated progress", async ({ page }) => {
  const demo = await openDemo(page, "agent-status");
  await chooseOption(page, demo.getByRole("combobox", { name: "Agent state", exact: true }), "Waiting");
  await expect(demo.getByRole("status")).toContainText("Waiting for input");
  await chooseOption(page, demo.getByRole("combobox", { name: "Agent state", exact: true }), "Error");
  await expect(demo.getByRole("status")).toContainText("Needs attention");
  await expect(demo.getByRole("progressbar")).toHaveCount(0);
});

test("thinking indicator respects its control and live reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const demo = await openDemo(page, "thinking-indicator");
  const indicator = demo.locator(".ui-thinking-indicator");
  await indicator.scrollIntoViewIfNeeded();
  await expect(indicator).toHaveAttribute("data-motion", "running");
  await demo.getByRole("switch", { name: "Animate indicator", exact: true }).click();
  await expect(indicator).toHaveAttribute("data-motion", "paused");
  await expect(indicator).toHaveText("Thinking paused");
  await demo.getByRole("switch", { name: "Animate indicator", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(indicator).toHaveAttribute("data-motion", "reduced");
  expect(await indicator.locator(".ui-thinking-dots > span").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

test("model picker preserves rich disabled choices and selection focus", async ({ page }) => {
  const demo = await openDemo(page, "model-picker");
  const trigger = demo.getByRole("combobox", { name: "Model", exact: true });
  await trigger.click();
  await expect(page.getByRole("option", { name: /Studio/ })).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("option", { name: /Reason/ }).click();
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText("Reason");
  await expect(demo.locator(".demo-feedback")).toHaveText("Reason selected.");
});

test("Markdown editor renders GFM and shared code blocks while omitting executable content", async ({ page }) => {
  const demo = await openDemo(page, "markdown");
  await demo.getByRole("tab", { name: "Source", exact: true }).click();
  await demo.getByRole("textbox", { name: "Markdown source", exact: true }).fill('## Preview\n\nA **clear** result.\n\n| Name | Count |\n| --- | --- |\n| Files | 3 |\n\n```ts\nconst count = 3;\n```\n\n<script>alert("bad")</script>\n\n[Unsafe](javascript:alert%281%29)');
  await demo.getByRole("tab", { name: "Preview", exact: true }).click();
  const result = demo.getByRole("region", { name: "Rendered markdown", exact: true });
  await expect(result.getByRole("heading", { name: "Preview", exact: true })).toBeVisible();
  await expect(result.getByRole("region", { name: "Table in message", exact: true })).toBeAttached();
  await expect(result.getByRole("region", { name: "Source code", exact: true })).toContainText("const count = 3;");
  await expect(result.locator("script")).toHaveCount(0);
  await expect(result.locator('a[href^="javascript:"]')).toHaveCount(0);
});
