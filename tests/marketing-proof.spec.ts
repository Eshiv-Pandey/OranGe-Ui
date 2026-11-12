import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const slugs = ["stacked-testimonials", "collage-testimonials", "portrait-testimonials", "infinite-testimonials", "glass-pricing", "ticket-pricing", "folder-faq", "bubble-faq", "poster-faq", "accordion-faq"];
for (const width of [1280, 390]) test(`new blocks at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const audit = [];
  await mkdir("out/marketing-proof", { recursive: true });
  for (const slug of slugs) {
    await page.goto(`/preview/blocks/${slug}`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll<HTMLImageElement>(".orange-block img")].map(async image => { image.loading = "eager"; await image.decode().catch(() => {}); })); });
    expect(await page.locator(".orange-block img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `out/marketing-proof/${slug}-${width}.png`, fullPage: true });
    if (width === 1280) await page.locator(".orange-block").screenshot({ path: `out/marketing-proof/${slug}-thumbnail.png` });
    if (slug === "infinite-testimonials") {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "Pause motion" }).click();
      await page.screenshot({ path: `out/marketing-proof/${slug}-moving-${width}.png`, fullPage: true });
      if (width === 1280) await page.locator(".orange-block").screenshot({ path: `out/marketing-proof/${slug}-thumbnail.png` });
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    const results = await new AxeBuilder({ page }).include(".orange-block").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    audit.push({ slug, violations: results.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })) });
  }
  await writeFile(`out/marketing-proof/a11y-${width}.json`, JSON.stringify(audit, null, 2));
  expect(errors).toEqual([]);
  expect(audit.flatMap(row => row.violations.map(violation => `${row.slug}: ${violation.id}`))).toEqual([]);
});

test("four alternating tracks travel, pause, resume and become readable static lists", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/preview/blocks/infinite-testimonials");
  const root = page.locator(".mt-stream-root"), tracks = page.locator(".mt-stream-track");
  await expect(root).toHaveAttribute("data-motion", "running");
  expect(await page.locator(".mt-stream-row").evaluateAll(rows => rows.map(row => row.getAttribute("data-direction")))).toEqual(["left", "right", "left", "right"]);
  const positions = () => tracks.evaluateAll(elements => elements.map(element => new DOMMatrix(getComputedStyle(element).transform).m41));
  const start = await positions(); await page.waitForTimeout(350); const end = await positions();
  end.forEach((value, index) => expect(index % 2 ? value > start[index] : value < start[index]).toBe(true));
  expect(await page.locator(".mt-stream-row").evaluateAll(rows => rows.every(row => { const groups = row.querySelectorAll(".mt-stream-group"); return Math.abs(groups[0].getBoundingClientRect().width - groups[1].getBoundingClientRect().width) < 1; }))).toBe(true);
  await page.getByRole("button", { name: "Pause motion" }).click();
  expect(await tracks.evaluateAll(elements => elements.every(element => getComputedStyle(element).animationPlayState === "paused"))).toBe(true);
  await page.getByRole("button", { name: "Resume motion" }).click(); await page.mouse.move(0, 0);
  expect(await tracks.first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe("running");
  await page.locator(".mt-stream-viewport").hover();
  expect(await tracks.first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe("paused");
  await page.mouse.move(0, 0); await page.locator(".mt-stream-viewport").focus();
  expect(await tracks.first().evaluate(element => getComputedStyle(element).animationPlayState)).toBe("paused");
  await page.evaluate(() => { (document.activeElement as HTMLElement).blur(); const spacer = document.createElement("div"); spacer.style.height = "2000px"; document.body.append(spacer); window.scrollTo(0, 1800); });
  await expect(root).toHaveAttribute("data-motion", "paused");
  await page.evaluate(() => window.scrollTo(0, 0)); await expect(root).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(root).toHaveAttribute("data-motion", "reduced");
  expect(await tracks.first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  expect(await page.locator(".mt-stream-pill:visible").count()).toBe(12);
  await page.setViewportSize({ width: 390, height: 900 });
  expect(await page.locator(".mt-stream-pill:visible").evaluateAll(items => items.every(item => { const rect = item.getBoundingClientRect(); return rect.left >= 0 && rect.right <= window.innerWidth; }))).toBe(true);
});

test("FAQ summaries expand by keyboard and pricing callbacks stay on the page", async ({ page }) => {
  for (const slug of ["folder-faq", "bubble-faq", "poster-faq"]) {
    await page.goto(`/preview/blocks/${slug}`);
    const question = page.locator(".orange-block summary").last(); await question.focus(); await page.keyboard.press("Enter");
    await expect(question.locator("..")).toHaveAttribute("open", "");
    await page.keyboard.press("Space"); await expect(question.locator("..")).not.toHaveAttribute("open", "");
  }
  await page.goto("/preview/blocks/glass-pricing");
  await page.getByRole("button", { name: "Yearly" }).click(); await expect(page.getByText("$90.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Choose Studio" }).click();
  await expect(page.getByRole("button", { name: "Monthly" })).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("Studio selected with yearly billing.");
  await expect(page).toHaveURL(/\/preview\/blocks\/glass-pricing$/);
  await page.goto("/components/accordion"); await expect(page).toHaveURL(/\/blocks\/accordion-faq$/);
});
