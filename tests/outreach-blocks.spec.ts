import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const slugs = ["dot-stats", "pulse-stats", "poster-stats", "poster-announcement", "reminder-announcement", "scene-announcement", "editorial-contact", "channel-contact", "signal-contact", "poster-contact", "collage-team", "flip-team", "character-team", "poster-team"];
for (const width of [1280, 390]) test(`outreach layouts at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const audit = []; await mkdir("out/outreach", { recursive: true });
  for (const slug of slugs) {
    await page.goto(`/preview/blocks/${slug}`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll<HTMLImageElement>(".orange-block img")].map(async image => { image.loading = "eager"; await image.decode().catch(() => {}); })); });
    expect(await page.locator(".orange-block img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `out/outreach/${slug}-${width}.png`, fullPage: true });
    if (width === 1280) await page.locator(".orange-block").screenshot({ path: `out/outreach/${slug}-thumbnail.png` });
    const results = await new AxeBuilder({ page }).include(".orange-block").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    audit.push({ slug, violations: results.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) });
  }
  await writeFile(`out/outreach/a11y-${width}.json`, JSON.stringify(audit, null, 2));
  expect(errors).toEqual([]); expect(audit.flatMap(row => row.violations.map(violation => `${row.slug}: ${violation.id}`))).toEqual([]);
});

test("announcement card stays fixed while backgrounds change, pause and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/preview/blocks/scene-announcement"); const root = page.locator(".oa-scene-root"), card = page.locator(".oa-scene-card"), backgrounds = page.locator(".oa-scene-backgrounds > div");
  await expect(root).toHaveAttribute("data-motion", "running"); const rect = await card.boundingBox();
  await expect(backgrounds.nth(1)).toHaveAttribute("data-active", "true", { timeout: 10000 }); expect(await card.boundingBox()).toEqual(rect);
  await page.getByRole("button", { name: "Pause backgrounds" }).click(); const active = await backgrounds.evaluateAll(elements => elements.map(element => element.getAttribute("data-active")));
  await page.waitForTimeout(6500); expect(await backgrounds.evaluateAll(elements => elements.map(element => element.getAttribute("data-active")))).toEqual(active);
  await page.screenshot({ path: "out/outreach/scene-announcement-active-1280.png", fullPage: true });
  await page.getByRole("button", { name: "Resume backgrounds" }).click();
  await page.evaluate(() => { const spacer = document.createElement("div"); spacer.style.height = "2000px"; document.body.append(spacer); window.scrollTo({ top: 1800, behavior: "instant" }); });
  await expect(root).toHaveAttribute("data-motion", "paused"); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await expect(root).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(root).toHaveAttribute("data-motion", "reduced");
  expect(await backgrounds.first().evaluate(element => getComputedStyle(element).opacity)).toBe("1");
  await expect(page.getByRole("button", { name: /backgrounds/ })).toHaveCount(0);
});

test("role cards flip on hover, keyboard focus and touch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/preview/blocks/flip-team");
  const card = page.getByRole("button", { name: /Avery Lane, Design director/ }), inner = card.locator(".ot-flip-inner");
  await card.hover(); await expect.poll(() => inner.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m11)).toBeLessThan(-.99);
  await page.mouse.move(0, 0); await card.focus(); await expect.poll(() => inner.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m11)).toBeLessThan(-.99);
  await page.screenshot({ path: "out/outreach/flip-team-role-1280.png", fullPage: true });
  await page.keyboard.press("Enter"); await expect(card).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" }); await card.click(); await expect(card).toHaveAttribute("aria-pressed", "false"); await card.click(); await expect(card).toHaveAttribute("aria-pressed", "true");
  expect(await inner.evaluate(element => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.screenshot({ path: "out/outreach/flip-team-role-390.png", fullPage: true });
});

test("statistics switch their data and contact submissions validate and recover without navigation", async ({ page }) => {
  await page.goto("/preview/blocks/pulse-stats"); await page.getByRole("button", { name: "This month" }).click(); await expect(page.getByText("96K", { exact: true })).toBeVisible();
  for (const slug of ["editorial-contact", "channel-contact", "signal-contact", "poster-contact"]) {
    await page.goto(`/preview/blocks/${slug}`); await page.getByRole("button", { name: "Send your message" }).click(); await expect(page.getByLabel("Your name")).toBeFocused();
    await page.getByLabel("Your name").fill("Avery"); await page.getByLabel("Email address").fill("avery@example.com"); await page.getByLabel("What are you thinking?").fill("A thoughtful new project.");
    await page.getByLabel("Callback result").selectOption("failure"); await page.getByRole("button", { name: "Send your message" }).click(); await expect(page.getByRole("alert")).toBeVisible();
    await page.getByLabel("Callback result").selectOption("success"); await page.getByRole("button", { name: "Send your message" }).click(); await expect(page.getByRole("status")).toHaveText("Message preview complete."); await expect(page).toHaveURL(new RegExp(`/preview/blocks/${slug}$`));
  }
});
