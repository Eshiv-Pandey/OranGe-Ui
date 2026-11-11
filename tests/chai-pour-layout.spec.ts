import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 320, height: 844 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1535, height: 773 }, { width: 1920, height: 768 }]) {
  test(`chai falls from above its glass without covering recovery copy at ${viewport.width}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/chai-preview');
    const scene = page.locator('.chai-pour');
    await expect(scene).toHaveAttribute('data-motion', 'running');
    await page.clock.runFor(3500);
    await expect(scene.locator('.chai-interior-stream')).toHaveCSS('opacity', '0.95');
    const jet = await scene.evaluate(element => {
      const outside = element.querySelector('.chai-stream') as SVGPathElement;
      const inside = element.querySelector('.chai-interior-stream') as SVGPathElement;
      const kettle = element.querySelector('.chai-kettle') as SVGGElement;
      const point = (path: SVGPathElement, t: number) => {
        const p = path.getPointAtLength(path.getTotalLength() * t);
        return new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM()!);
      };
      const start = point(outside, 0), end = point(outside, 1), entry = point(inside, 0);
      const mouth = new DOMPoint(335, 198).matrixTransform(kettle.getScreenCTM()!);
      return { drop: end.y - start.y, run: end.x - start.x, join: Math.hypot(end.x - entry.x, end.y - entry.y), mouth: Math.hypot(start.x - mouth.x, start.y - mouth.y) };
    });
    expect(jet.drop).toBeGreaterThan(80);
    expect(jet.drop / jet.run).toBeGreaterThan(.85);
    expect(jet.join).toBeLessThan(1); expect(jet.mouth).toBeLessThan(1);
    const kettle = (await scene.locator('.chai-kettle').boundingBox())!, copy = (await page.locator('.chai-recovery-copy').boundingBox())!;
    const hand = (await scene.locator('.chai-kettle-grip').boundingBox())!, main = (await page.locator('.chai-recovery').boundingBox())!, sleeve = (await scene.locator('.chai-left-sleeve').boundingBox())!;
    expect(hand.y).toBeGreaterThanOrEqual(main.y);
    expect(sleeve.x).toBeLessThanOrEqual(main.x); expect(sleeve.y).toBeLessThanOrEqual(main.y);
    const overlap = Math.max(0, Math.min(kettle.x + kettle.width, copy.x + copy.width) - Math.max(kettle.x, copy.x)) * Math.max(0, Math.min(kettle.y + kettle.height, copy.y + copy.height) - Math.max(kettle.y, copy.y));
    expect(overlap).toBe(0); expect(errors).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: testInfo.outputPath('pour.png'), fullPage: true });
    await page.clock.runFor(6000); await expect(scene).toHaveAttribute('data-poured', 'true');
    await page.screenshot({ path: testInfo.outputPath('settled.png'), fullPage: true });
  });
}
