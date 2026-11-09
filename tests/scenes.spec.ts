import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/scene-polish/confirmation";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 900, 1440]) {
  test(`scene components and 404 at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto("/a-page-on-a-chai-break");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is out for a chai break.");
    await expect(page.getByRole("img")).toHaveAccessibleName("Chai being poured into a glass");
    const home = page.getByRole("link", { name: "Take me home" });
    await expect(home).toHaveAttribute("href", "/"); await home.focus();
    expect(await home.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const slug of ["chai-break-404", "neon-sign-404", "pavilion-footer", "wall-switch"]) {
      await page.goto(`/components/${slug}?style=polished`);
      const live = page.getByTestId("live-demo"); await expect(live).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (slug === "chai-break-404") await expect(live.getByRole("slider")).toHaveCount(0);
      if (slug === "neon-sign-404") {
        await expect(live.locator(".neon-sign")).toHaveCount(1);
        await expect(live.locator('[data-off="true"]')).toHaveCount(0);
        await expect(live.locator(".neon-recovery h1")).toHaveText("This page is closed for the night.");
        await expect(live.getByText(/^(Small|Medium|Large)$/)).toHaveCount(0);
      }
      if (slug === "pavilion-footer") {
        const light = live.getByRole("button", { name: "Light the pavilion" }); await light.focus(); await light.press("Space");
        await expect(live.getByRole("button", { name: "Dim the pavilion" })).toHaveAttribute("aria-pressed", "true");
        await expect(live.getByRole("button", { name: "Send the birds" })).toHaveCount(0);
        await expect(live.locator(".pavilion-neighbor")).toHaveCount(3);
        const top = live.getByRole("link", { name: "Back to top" });
        const text = (await top.locator("span").boundingBox())!, arrow = (await top.locator("svg").boundingBox())!;
        expect(Math.abs(text.y + text.height / 2 - arrow.y - arrow.height / 2)).toBeLessThan(1);
      }
      if (slug === "wall-switch") {
        const button = live.getByRole("switch", { name: "Studio light" });
        await expect(button).toHaveAttribute("data-renderer", "webgl");
        await button.focus(); await button.press("Space"); await expect(button).toBeChecked();
        await expect(live.getByRole("status")).toHaveText("The light is on.");
        expect(await button.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
        await button.press("Space"); await expect(button).not.toBeChecked();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (process.env.SCENE_CAPTURE === "1") await live.screenshot({ path: `${evidence}/${slug}-${width}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test("neon flicker stops for reduced motion and the inspector selects pixel tubes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/neon-sign-404?style=polished");
  const sign = page.getByTestId("live-demo").locator(".neon-sign"); await sign.scrollIntoViewIfNeeded();
  await expect.poll(() => sign.locator('[data-off="true"]').count(), { timeout: 10000, intervals: [30] }).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(sign.locator('[data-off="true"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Pixel tubes" }).check(); await expect(sign).toHaveAttribute("data-pixel", "true");
});

test("chai enters the rim from above and eases back after a kettle drag", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/chai-break-404?style=polished");
  const scene = page.getByTestId("live-demo").locator(".chai-pour"); await scene.scrollIntoViewIfNeeded();
  const stream = scene.locator(".chai-stream"), tea = scene.locator(".chai-tea"), kettle = scene.locator(".chai-kettle");
  await expect.poll(() => stream.evaluate(el => getComputedStyle(el).opacity), { timeout: 6000 }).toBe("1");
  const geometry = await stream.evaluate(el => {
    const path = el as SVGPathElement, glass = el.parentElement!.querySelector(".chai-glass-hand")!;
    const rim = glass.querySelector("ellipse[cy='291']") as SVGEllipseElement;
    const center = new DOMPoint(rim.cx.baseVal.value, rim.cy.baseVal.value).matrixTransform(rim.getScreenCTM()!);
    const length = path.getTotalLength(), matrix = path.getScreenCTM()!;
    const endpoint = new DOMPoint(path.getPointAtLength(length).x, path.getPointAtLength(length).y).matrixTransform(matrix);
    const ys = Array.from({ length: 101 }, (_, i) => { const point = path.getPointAtLength(length * i / 100); return new DOMPoint(point.x, point.y).matrixTransform(matrix).y; });
    return { distance: Math.hypot(endpoint.x - center.x, endpoint.y - center.y), belowRim: Math.max(...ys) - center.y, behindGlass: Boolean(path.compareDocumentPosition(glass) & Node.DOCUMENT_POSITION_FOLLOWING) };
  });
  expect(geometry.distance).toBeLessThan(1); expect(geometry.belowRim).toBeLessThan(1); expect(geometry.behindGlass).toBe(true);
  const box = (await kettle.boundingBox())!, before = await kettle.getAttribute("transform");
  await page.mouse.move(box.x + box.width * .45, box.y + box.height * .6); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .45 + 60, box.y + box.height * .6 + 25, { steps: 8 });
  await expect.poll(() => kettle.getAttribute("transform")).not.toBe(before);
  const fillBefore = await tea.evaluate(el => (el as SVGGElement).transform.baseVal.consolidate()!.matrix.f);
  await page.mouse.up(); await page.waitForTimeout(30);
  const fillAfter = await tea.evaluate(el => (el as SVGGElement).transform.baseVal.consolidate()!.matrix.f);
  expect(Math.abs(fillAfter - fillBefore)).toBeLessThan(8);
  await expect(scene.getByRole("slider")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(stream).toHaveCSS("opacity", "0");
});

test("full-page chai reveals a steam 404 only after the glass fills", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/chai-steam-recovery-check");
  const scene = page.locator(".chai-pour-fullscreen"), cloud = scene.locator(".chai-cloud-404"), main = page.locator(".chai-recovery");
  await expect(cloud).toHaveCSS("opacity", "0");
  const canvas = (await scene.boundingBox())!, pageBounds = (await main.boundingBox())!;
  expect(canvas.width).toBeCloseTo(pageBounds.width, 0); expect(canvas.height).toBeCloseTo(pageBounds.height, 0);
  await expect(scene).toHaveAttribute("data-poured", "true", { timeout: 11000 }); await expect(cloud).toHaveCSS("opacity", "1");
  await expect(main.locator(".chai-stall-sign")).toHaveText("चाय");
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(cloud).toHaveCSS("opacity", "1");
});

test("pavilion eases pointer movement, flies birds automatically and keeps lights usable with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/pavilion-footer?style=polished");
  const live = page.getByTestId("live-demo"), scene = live.locator(".pavilion-footer-scene"), art = live.locator(".pavilion-building");
  await scene.scrollIntoViewIfNeeded(); const box = (await scene.boundingBox())!;
  await page.mouse.move(box.x + box.width * .9, box.y + box.height * .4);
  await expect.poll(() => art.getAttribute("transform")).not.toBe("translate(0.000 0.000)");
  await expect.poll(async () => Math.abs(await art.evaluate(el => (el as SVGGElement).transform.baseVal.consolidate()!.matrix.e) - 3.2)).toBeLessThan(.05);
  await page.mouse.move(box.x - 12, box.y);
  await expect.poll(() => art.evaluate(el => { const matrix = (el as SVGGElement).transform.baseVal.consolidate()!.matrix; return Math.hypot(matrix.e, matrix.f); })).toBeLessThan(.001);
  const bird = live.locator(".pavilion-bird").first(), wing = bird.locator(".pavilion-bird-near-wing");
  await expect(live.getByRole("button", { name: "Send the birds" })).toHaveCount(0);
  const flight = await bird.getAttribute("transform"), flap = await wing.getAttribute("transform");
  await page.waitForTimeout(220); expect(await bird.getAttribute("transform")).not.toBe(flight); expect(await wing.getAttribute("transform")).not.toBe(flap);
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(live.locator(".pavilion-footer")).toHaveAttribute("data-flight", "reduced");
  const resting = await bird.getAttribute("transform"); await page.waitForTimeout(160); await expect(bird).toHaveAttribute("transform", resting!);
  await expect(art).toHaveAttribute("transform", "translate(0 0)");
  await live.getByRole("button", { name: "Light the pavilion" }).press("Space");
  await expect(live.locator(".pavilion-footer")).toHaveAttribute("data-lit", "true");
});

test("wall switch paints different rocker states and recovers from context loss", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/components/wall-switch?style=polished");
  const button = page.getByTestId("live-demo").getByRole("switch", { name: "Studio light" }), canvas = button.locator("canvas");
  await expect(button).toHaveAttribute("data-renderer", "webgl");
  const off = await canvas.screenshot(); await button.press("Space"); await page.waitForTimeout(450);
  expect(Buffer.compare(off, await canvas.screenshot())).not.toBe(0);
  await canvas.evaluate(el => {
    const context = (el as HTMLCanvasElement).getContext("webgl2")!;
    (window as unknown as { switchContext: WEBGL_lose_context }).switchContext = context.getExtension("WEBGL_lose_context")!;
    (window as unknown as { switchContext: WEBGL_lose_context }).switchContext.loseContext();
  });
  await expect(button).toHaveAttribute("data-renderer", "fallback");
  await expect(button.locator(".wall-switch-recess")).toBeVisible(); await button.press("Space"); await expect(button).not.toBeChecked();
  await page.evaluate(() => (window as unknown as { switchContext: WEBGL_lose_context }).switchContext.restoreContext());
  await expect(button).toHaveAttribute("data-renderer", "webgl");
  await page.goto("/components/wall-switch?style=terminal"); await expect(button.locator("canvas")).toHaveCount(0);
  await button.press("Space"); await expect(button).toBeChecked();
});
