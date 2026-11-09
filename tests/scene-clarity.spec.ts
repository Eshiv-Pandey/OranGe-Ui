import { expect, test } from '@playwright/test';

for (const width of [320, 390, 1440]) {
  test(`chai keeps the pour connected inside its glass and reserves copy at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 650 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/chai-preview');
    const scene = page.locator('.chai-pour'), stream = scene.locator('.chai-stream'), inside = scene.locator('.chai-interior-stream');
    await expect(stream).toHaveCSS('opacity', '1'); await expect(inside).toHaveCSS('opacity', '0.95');
    const geometry = await scene.evaluate(element => {
      const outside = element.querySelector('.chai-stream') as SVGPathElement, inside = element.querySelector('.chai-interior-stream') as SVGPathElement;
      const foam = element.querySelector('.chai-foam') as SVGGElement;
      const point = (path: SVGPathElement, end: boolean) => { const value = path.getPointAtLength(end ? path.getTotalLength() : 0); return new DOMPoint(value.x, value.y).matrixTransform(path.getScreenCTM()!); };
      const rim = point(outside, true), entry = point(inside, false), end = point(inside, true), surface = new DOMPoint(478, 0).matrixTransform(foam.getScreenCTM()!);
      return { join: Math.hypot(rim.x - entry.x, rim.y - entry.y), surface: Math.hypot(end.x - surface.x, end.y - surface.y), descent: end.y - entry.y, clipped: Boolean(inside.parentElement?.getAttribute('clip-path')) };
    });
    expect(geometry.join).toBeLessThan(1); expect(geometry.surface).toBeLessThan(1); expect(geometry.descent).toBeGreaterThan(10); expect(geometry.clipped).toBe(true);
    const main = (await page.locator('.chai-recovery').boundingBox())!, left = (await scene.locator('.chai-left-sleeve').boundingBox())!, right = (await scene.locator('.chai-right-sleeve').boundingBox())!;
    expect(left.x).toBeLessThanOrEqual(main.x); expect(left.y).toBeLessThanOrEqual(main.y);
    expect(right.x + right.width).toBeGreaterThanOrEqual(main.x + main.width); expect(right.y + right.height).toBeGreaterThanOrEqual(main.y + main.height);
    if (width < 650) {
      const glass = (await scene.locator('.chai-glass-wall').boundingBox())!, copy = (await page.locator('.chai-recovery-copy').boundingBox())!;
      expect(glass.y + glass.height).toBeLessThan(copy.y);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(inside).toHaveCSS('opacity', '0');
    const digits = await scene.locator('.chai-cloud-digit').evaluateAll(groups => groups.map(group => {
      const path = group.querySelector('path') as SVGPathElement, box = path.getBBox(), matrix = path.getScreenCTM()!, radius = 15.5 * Math.abs(matrix.a);
      return { left: new DOMPoint(box.x, 0).matrixTransform(matrix).x - radius, right: new DOMPoint(box.x + box.width, 0).matrixTransform(matrix).x + radius };
    }));
    expect(digits).toHaveLength(3);
    expect(digits[1].left - digits[0].right).toBeGreaterThan(6); expect(digits[2].left - digits[1].right).toBeGreaterThan(6);
  });

  test(`film keeps pure black and readable controls in both host palettes at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/components/endless-film');
    const film = page.locator('.endless-film');
    await expect(film.locator('.endless-film-stage')).toHaveAttribute('data-renderer', 'webgl');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.classList.remove('light', 'dark'); document.documentElement.classList.add(theme); }, theme);
      await expect(film).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect(film).toHaveCSS('color', 'rgb(242, 237, 221)');
      const selected = film.locator('.endless-film-picker button[aria-pressed="true"]');
      await expect(selected).toHaveCSS('border-top-color', 'rgb(242, 237, 221)');
      await selected.focus(); await expect(selected).toHaveCSS('outline-color', 'rgb(242, 237, 221)');
    }
  });
}
