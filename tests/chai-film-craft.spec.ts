import { expect, test } from '@playwright/test';

test.use({ deviceScaleFactor: 2 });
for (const width of [390, 1440]) {
  test(`chai releases after tilt, arrives before filling and retains the glass at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
    await page.goto('/chai-preview');
    const scene = page.locator('.chai-pour'), exterior = scene.locator('.chai-stream'), inside = scene.locator('.chai-interior-stream'), tea = scene.locator('.chai-tea');
    const volumeOffset = () => tea.evaluate(element => (element as SVGGElement).transform.baseVal.consolidate()!.matrix.f);
    await expect(scene).toHaveAttribute('data-motion', 'running');
    await page.clock.runFor(1600);
    await expect(exterior).toHaveCSS('opacity', '0'); await expect(inside).toHaveCSS('opacity', '0'); expect(await volumeOffset()).toBe(130);
    await page.clock.runFor(300);
    await expect(exterior).toHaveCSS('opacity', '1'); await expect(inside).toHaveCSS('opacity', '0'); expect(await volumeOffset()).toBe(130);
    expect(Number((await scene.locator('.chai-kettle').getAttribute('transform'))!.match(/rotate\(([^ ]+)/)![1])).toBeGreaterThanOrEqual(28);
    await page.clock.runFor(550); await expect(inside).toHaveCSS('opacity', '0.95'); expect(await volumeOffset()).toBeLessThan(130);
    const curvature = await exterior.evaluate(element => {
      const path = element as SVGPathElement, points = [0, .5, 1].map(t => path.getPointAtLength(path.getTotalLength() * t));
      return points.map(p => p.y);
    });
    expect(curvature[1]).toBeGreaterThan(curvature[0]); expect(curvature[2]).toBeGreaterThan(curvature[1]);
    await expect(scene.locator('.chai-kettle-grip')).toHaveCount(1);
    expect(await scene.locator('.chai-kettle-grip').evaluate(element => Boolean(element.closest('[data-kettle]')))).toBe(true);
    await page.clock.runFor(6000); await expect(scene).toHaveAttribute('data-poured', 'true');
    await expect(exterior).toHaveCSS('opacity', '0'); await expect(inside).toHaveCSS('opacity', '0');
    const retained = await volumeOffset(); await page.clock.runFor(13000); expect(await volumeOffset()).toBe(retained);
    const toran = (await page.locator('.chai-toran').boundingBox())!, main = (await page.locator('.chai-recovery').boundingBox())!;
    expect(toran.y).toBeGreaterThan(main.y); expect(toran.x).toBeGreaterThan(main.x);
  });

  test(`film uses a sharp DPR2 backing buffer and a higher-resolution shared atlas at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/components/endless-film');
    const stage = page.locator('.endless-film-stage'); await expect(stage).toHaveAttribute('data-renderer', 'webgl');
    const dimensions = await stage.locator('canvas').evaluate(element => {
      const canvas = element as HTMLCanvasElement, box = canvas.getBoundingClientRect();
      return { width: canvas.width, height: canvas.height, cssWidth: box.width, cssHeight: box.height };
    });
    expect(dimensions.width / dimensions.cssWidth).toBeGreaterThanOrEqual(1.95);
    expect(dimensions.height / dimensions.cssHeight).toBeGreaterThanOrEqual(1.95);
    expect(dimensions.width * dimensions.height).toBeLessThanOrEqual(2500000);
    const texture = (await stage.getAttribute('data-texture-size'))!.split('x').map(Number);
    expect(texture[0]).toBeGreaterThanOrEqual(640 * 12); expect(texture[1]).toBe(500);
  });
}
