import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blocks } from "../lib/blocks";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
const captures = path.resolve(".impeccable/review/blocks");
test("catalogue search, navigation and preview controls preserve form state", async ({ page }) => {
  await page.goto("/blocks"); await expect(page.getByRole("heading", { name: "Blocks for good pages." })).toBeVisible();
  await page.getByLabel("Search blocks").fill("auth"); await expect(page.locator(".block-card")).toHaveCount(5); await page.locator('.block-card[href="/blocks/auth-panel"]').click();
  await page.getByLabel(/^Email address/).fill("alex@example.com"); await page.getByRole("button", { name: "Phone", exact: true }).click(); await expect(page.getByLabel(/^Email address/)).toHaveValue("alex@example.com");
  await page.getByLabel(/[Pp]alette/).selectOption("dark"); await expect(page.getByLabel(/^Email address/)).toHaveValue("alex@example.com");
  await page.getByRole("button", { name: "Usage", exact: true }).click(); await expect(page.locator(".block-code-view")).toContainText("AuthPanel"); await page.getByRole("button", { name: "Source", exact: true }).click(); await expect(page.getByLabel("Source file")).toBeVisible(); await expect(page.locator(".block-code-view")).toContainText("AuthPanelProps");
  await page.getByRole("button", { name: "Preview", exact: true }).click(); await expect(page.getByLabel(/^Email address/)).toHaveValue("alex@example.com");
  await page.getByRole("button", { name: "Reset block preview" }).click(); await expect(page.getByLabel(/^Email address/)).toHaveValue("");
});
test("registry and download routes work in the production build without private traces", async ({ request }) => {
  for (const block of blocks) {
    const response = await request.get(`/api/blocks/${block.slug}`); expect(response.status(), block.slug).toBe(200); expect(response.headers()["content-type"]).toContain("application/zip"); expect((await response.body()).length).toBeGreaterThan(10000);
  }
  const response = await request.get("/r/block-auth-panel.json"); const item = await response.json(); expect(response.status()).toBe(200); expect(item.type).toBe("registry:block"); expect(item.files.some((file: { path: string }) => file.path.endsWith("auth.tsx"))).toBe(true);
  expect((await request.get("/api/blocks/unknown")).status()).toBe(404); expect((await request.get("/r/block-auth-panel.json?style=terminal")).status()).toBe(400);
  const filename = path.resolve(".next/server/app/api/blocks/[slug]/route.js.nft.json"); const trace = JSON.parse(await readFile(filename, "utf8"));
  const files: string[] = trace.files.map((file: string) => path.relative(process.cwd(), path.resolve(path.dirname(filename), file)).replaceAll("\\", "/"));
  expect(files.some(file => /^(out\/|references\/|\.git\/|\.env)|USER_INSTRUCTIONS|AGENTS\.md|CONTRIBUTION_RULES/.test(file))).toBe(false);
  for (const file of ["components/ui/blocks/auth.tsx", "styles/blocks.css", "public/photos/keepsakes/forest.jpg", "public/photos/keepsakes/NOTICE.md"]) expect(files).toContain(file);
});
test("auth demo recovers from service failure and supports signup and verification", async ({ page }) => {
  await page.goto("/preview/blocks/auth-panel"); await page.getByLabel("Callback result").selectOption("failure"); await page.getByLabel(/^Email address/).fill("alex@example.com"); await page.getByLabel(/^Password/).fill("long-enough"); await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click(); await expect(page.locator(".block-demo").getByRole("alert")).toContainText("demo error");
  await page.getByLabel("Callback result").selectOption("success"); await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click(); await expect(page.getByText("Demo complete.", { exact: false })).toBeVisible();
  await page.getByLabel("Auth flow").selectOption("verify"); await page.getByLabel(/^Email address/).fill("alex@example.com"); await page.getByLabel(/^Verification code/).fill("123456"); await page.getByRole("button", { name: "Verify code" }).click(); await expect(page.getByText("Demo complete.", { exact: false })).toBeVisible();
});
test("desktop and phone renders have loaded assets, keyboard access and no horizontal overflow", async ({ page }) => {
  await mkdir(captures, { recursive: true });
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const slug of ["catalogue", ...blocks.map(block => block.slug)]) {
      await page.goto(slug === "catalogue" ? "/blocks" : `/preview/blocks/${slug}`); await page.evaluate(async () => { await document.fonts.ready; document.querySelectorAll("img").forEach(image => { image.loading = "eager"; }); await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); expect(overflow, `${slug} at ${viewport.name}`).toBe(false);
      expect(await page.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0)), slug).toBe(true);
      await page.screenshot({ path: path.join(captures, `${slug}-${viewport.name}.png`), fullPage: true });
      if (slug === "catalogue" && viewport.name === "desktop") { await page.getByRole("button", { name: "All examples", exact: true }).click(); for (const block of blocks) await page.locator(`.block-card[href="/blocks/${block.slug}"]`).screenshot({ path: path.join(captures, `card-${block.slug}.png`) }); }
      if (["editorial-hero", "product-hero", "studio-landing", "studio-workspace", "pricing-section", "testimonials", "bento-overview", "focus-widget"].includes(slug)) {
        await page.getByLabel(/[Pp]alette/).selectOption("dark"); await page.screenshot({ path: path.join(captures, `${slug}-dark-${viewport.name}.png`), fullPage: true });
      }
    }
    await page.goto("/blocks/auth-panel"); await page.evaluate(() => document.fonts.ready); expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), "detail page overflow").toBe(false); await page.screenshot({ path: path.join(captures, `detail-${viewport.name}.png`), fullPage: true });
    if (viewport.name === "desktop") { await page.getByRole("button", { name: "Source", exact: true }).click(); await expect(page.getByLabel("Source file")).toBeVisible(); await page.screenshot({ path: path.join(captures, "source-desktop.png"), fullPage: true }); }
  }
  await page.goto("/preview/blocks/site-header"); await page.getByRole("button", { name: "Open navigation", exact: true }).click(); await expect(page.getByRole("link", { name: "Our approach" })).toBeVisible(); await page.getByRole("link", { name: "Our approach" }).focus(); await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
  for (const slug of ["auth-panel", "workspace-overview", "settings", "file-upload"]) {
    await page.goto(`/preview/blocks/${slug}`); const result = await new AxeBuilder({ page }).include(".block-demo").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(result.violations, `${slug} accessibility`).toEqual([]);
    await page.getByLabel(/[Pp]alette/).selectOption("dark"); await page.screenshot({ path: path.join(captures, `${slug}-dark-mobile.png`), fullPage: true }); const dark = await new AxeBuilder({ page }).include(".block-demo").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(dark.violations, `${slug} dark accessibility`).toEqual([]);
  }
});
test("review corrections preserve preview composition, dark anchor contrast and readable mobile props", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/blocks/auth-panel");
  const embedded = await page.locator(".ob-auth").evaluate(element => {
    const art = element.querySelector(".ob-auth-art")!.getBoundingClientRect(), heading = element.querySelector(".ob-auth-art-copy h2")!.getBoundingClientRect();
    return { width: element.getBoundingClientRect().width, offset: heading.top - art.top };
  });
  await page.setViewportSize({ width: Math.round(embedded.width), height: 1000 }); await page.goto("/preview/blocks/auth-panel");
  const standalone = await page.locator(".ob-auth").evaluate(element => element.querySelector(".ob-auth-art-copy h2")!.getBoundingClientRect().top - element.querySelector(".ob-auth-art")!.getBoundingClientRect().top);
  expect(Math.abs(embedded.offset - standalone)).toBeLessThan(2);
  for (const slug of ["editorial-hero", "product-hero", "studio-landing"]) {
    await page.goto(`/preview/blocks/${slug}`); await page.getByLabel(/[Pp]alette/).selectOption("dark");
    const result = await new AxeBuilder({ page }).include(".orange-block").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(result.violations, `${slug} dark contrast`).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/blocks/auth-panel");
  const props = page.getByRole("region", { name: "AuthPanel props" }); expect(await props.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await props.focus(); await page.keyboard.press("ArrowRight"); await expect.poll(() => props.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await props.locator("tbody th code").first().evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
});
