import { expect, test } from '@playwright/test';
import { warmPixelCount } from './png-colors';

for (const width of [320, 390, 1440]) {
  test(`pavilion lamps change the painted architecture at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/components/pavilion-footer');
    const live = page.getByTestId('live-demo'), artwork = live.locator('.pavilion-footer-scene > svg');
    await expect(live.locator('footer')).toHaveAttribute('data-flight', 'reduced');
    const off = await artwork.screenshot();
    await live.getByRole('button', { name: 'Light the pavilion' }).press('Space');
    const on = await artwork.screenshot();
    expect(warmPixelCount(on), 'Warm light must reach the painted arches').toBeGreaterThan(warmPixelCount(off) + 100);
    await live.getByRole('button', { name: 'Dim the pavilion' }).press('Space');
    expect(warmPixelCount(await artwork.screenshot())).toBeLessThan(warmPixelCount(on) / 10);
  });
}

test('film wheel feed changes the photograph pixels in both directions while automatic feed is paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/components/endless-film');
  const film = page.locator('.endless-film'), stage = film.locator('.endless-film-stage'), canvas = film.locator('canvas');
  await expect(stage).toHaveAttribute('data-renderer', 'webgl');
  await film.getByRole('button', { name: 'Pause film', exact: true }).click();
  const beforePhase = Number(await film.getAttribute('data-phase')), before = await canvas.screenshot();
  await stage.hover(); await page.mouse.wheel(0, 180);
  await expect.poll(async () => Number(await film.getAttribute('data-phase'))).toBeGreaterThan(beforePhase + 100);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  const forward = Number(await film.getAttribute('data-phase'));
  await page.mouse.wheel(0, -80);
  await expect.poll(async () => Number(await film.getAttribute('data-phase'))).toBeLessThan(forward - 40);
  await film.getByRole('button', { name: 'Next photo', exact: true }).click();
  await expect(film.getByRole('status')).toContainText('Take the long way');
  await film.getByRole('button', { name: 'Select Off the clock', exact: true }).click();
  await expect(film.getByRole('status')).toContainText('Off the clock');
});

test('film follows its preview scroll and keeps manual access through reduced motion and context loss', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/components/endless-film');
  const film = page.locator('.endless-film'), stage = film.locator('.endless-film-stage');
  await expect(stage).toHaveAttribute('data-renderer', 'webgl');
  await film.getByRole('button', { name: 'Next photo', exact: true }).click();
  const before = await film.getAttribute('data-phase');
  const scrolled = await film.evaluate(element => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (getComputedStyle(parent).overflowY === 'auto' && parent.scrollHeight > parent.clientHeight + 80) { parent.scrollTop += 60; return true; }
    }
    window.scrollBy(0, 60); return window.scrollY > 0;
  });
  expect(scrolled, 'The gallery must be tested in an actual scrollable preview or page').toBe(true);
  await expect.poll(() => film.getAttribute('data-phase')).not.toBe(before);
  const canLose = await film.locator('canvas').evaluate(canvas => {
    const element = canvas as HTMLCanvasElement & { filmContextExtension?: WEBGL_lose_context };
    element.filmContextExtension = element.getContext('webgl2')?.getExtension('WEBGL_lose_context') ?? undefined;
    element.filmContextExtension?.loseContext(); return Boolean(element.filmContextExtension);
  });
  expect(canLose).toBe(true);
  await expect(stage).toHaveAttribute('data-renderer', 'fallback');
  await expect(film.locator('.endless-film-fallback')).toBeVisible();
  await film.getByRole('button', { name: 'Next photo', exact: true }).click();
  await expect(film.getByRole('status')).toContainText('Stay a while');
  await film.locator('canvas').evaluate(canvas => (canvas as HTMLCanvasElement & { filmContextExtension?: WEBGL_lose_context }).filmContextExtension?.restoreContext());
  await expect(stage).toHaveAttribute('data-renderer', 'webgl');
});

test('vertical touch gestures scroll the page from the film instead of being trapped by scrubbing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await page.goto('/components/endless-film');
  const film = page.locator('.endless-film'), stage = film.locator('.endless-film-stage');
  await expect(stage).toHaveAttribute('data-renderer', 'webgl');
  await stage.scrollIntoViewIfNeeded();
  const positions = () => film.evaluate(element => { const offsets = [window.scrollY]; for (let parent = element.parentElement; parent; parent = parent.parentElement) offsets.push(parent.scrollTop); return offsets; });
  const before = await positions(), bounds = (await stage.boundingBox())!, x = bounds.x + bounds.width / 2, y = Math.min(700, bounds.y + bounds.height * .7);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 8; step++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 12 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await positions()).some((offset, index) => offset > before[index] + 20)).toBe(true);
});
