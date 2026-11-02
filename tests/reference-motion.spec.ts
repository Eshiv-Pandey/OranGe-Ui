import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { referenceCover } from "../components/landing/reference-scene-config";

const evidence = "out/iteration/landing-motion";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });
test.beforeEach(async ({ page }) => {
  page.on("console", (message) => { if (message.text().includes("Landscape renderer unavailable")) console.log(message.text()); });
});

async function movingFrame(canvas: Locator) {
  const png = await canvas.evaluate((node: HTMLCanvasElement) => new Promise<string>((resolve) => {
    // The renderer's already-queued callback paints first. Copy in the same
    // animation frame, before WebGL clears its non-preserved drawing buffer.
    // This avoids screenshot stabilization waits aliasing a full wind cycle,
    // and measures the landscape itself without HTML obscuring the flowers.
    requestAnimationFrame(() => {
      const copy = document.createElement("canvas"); copy.width = node.width; copy.height = node.height;
      copy.getContext("2d")!.drawImage(node, 0, 0);
      resolve(copy.toDataURL("image/png"));
    });
  }));
  return Buffer.from(png.slice(png.indexOf(",") + 1), "base64");
}

async function regionDifference(before: Buffer, after: Buffer, mask: string, width: number, height: number) {
  const [a, b, matte] = await Promise.all([
    sharp(before).removeAlpha().raw().toBuffer(), sharp(after).removeAlpha().raw().toBuffer(),
    sharp(`public/landing/${mask}.png`).removeAlpha().greyscale().raw().toBuffer(),
  ]);
  const cover = referenceCover(width, height);
  let pixels = 0, changed = 0, sum = 0, maximum = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const mx = Math.min(1198, Math.max(0, Math.floor(((x + .5) / width - .5) * cover.scale[0] * 1199 + cover.center[0] * 1199)));
    const my = Math.min(804, Math.max(0, Math.floor(((y + .5) / height - .5) * cover.scale[1] * 805 + (1 - cover.center[1]) * 805)));
    if (matte[my * 1199 + mx] < (mask === "reference-flowers-mask" ? 64 : 220)) continue;
    const i = (y * width + x) * 3;
    const differences = [Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])];
    const peak = Math.max(...differences);
    pixels++; if (peak > 12) changed++;
    sum += differences[0] + differences[1] + differences[2]; maximum = Math.max(maximum, peak);
  }
  return { pixels, changed, visibleFraction: changed / Math.max(1, pixels), mean: sum / Math.max(1, pixels * 3), maximum };
}

for (const size of [{ width: 1199, height: 805 }, { width: 390, height: 844 }]) {
  test(`visible landscape motion, fixed person and exact pause at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/", { waitUntil: "networkidle" });
    const scene = page.locator(".reference-background"), canvas = scene.locator("canvas");
    await expect(scene).toHaveAttribute("data-renderer", "webgl2");
    await expect(canvas).toHaveAttribute("data-motion", "running");
    await page.mouse.move(0, 0);
    const first = await movingFrame(canvas);
    const firstCaptured = Date.now();
    await page.waitForTimeout(1600);
    const second = await movingFrame(canvas);
    const secondElapsed = (Date.now() - firstCaptured) / 1000;
    await page.waitForTimeout(1600);
    const third = await movingFrame(canvas);
    const thirdElapsed = (Date.now() - firstCaptured) / 1000;
    const observations = [];
    for (const [index, frame] of [second, third].entries()) {
      const person = await regionDifference(first, frame, "reference-person-silhouette", size.width, size.height);
      const clouds = await regionDifference(first, frame, "reference-clouds-mask", size.width, size.height);
      const flowers = await regionDifference(first, frame, "reference-flowers-mask", size.width, size.height);
      expect(person.pixels).toBeGreaterThan(1000); expect(person.maximum).toBe(0);
      observations.push({ elapsedSeconds: [secondElapsed, thirdElapsed][index], person, clouds, flowers });
    }
    // A changing grain pixel is not evidence of visible motion. Require a
    // sizeable part of both mattes to change by more than 12 channel levels.
    await writeFile(`${evidence}/motion-${size.width}.json`, JSON.stringify(observations, null, 2));
    await writeFile(`${evidence}/motion-${size.width}-a.png`, first);
    await writeFile(`${evidence}/motion-${size.width}-b.png`, third);
    expect(Math.max(...observations.map((o) => o.clouds.visibleFraction))).toBeGreaterThan(.04);
    expect(Math.max(...observations.map((o) => o.flowers.visibleFraction))).toBeGreaterThan(.12);

    await page.getByRole("button", { name: "Pause scene motion" }).click();
    await expect(canvas).toHaveAttribute("data-motion", "paused");
    const paused = await canvas.screenshot(); await page.waitForTimeout(500);
    expect((await canvas.screenshot()).equals(paused)).toBe(true);
    await page.getByRole("button", { name: "Play scene: resume motion" }).focus();
    await page.keyboard.press("Enter");
    await expect(canvas).toHaveAttribute("data-motion", "running");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-motion", "reduced");
    await expect(page.getByRole("button", { name: "Still scene: reduced motion enabled" })).toBeDisabled();
    const still = await canvas.screenshot(); await page.waitForTimeout(300);
    expect((await canvas.screenshot()).equals(still)).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(canvas).toHaveAttribute("data-motion", "running");
    const timing = await canvas.evaluate(async (node: HTMLCanvasElement) => {
      const frames: number[] = [];
      await new Promise<void>((resolve) => {
        const sample = (now: number) => { frames.push(now); if (frames.length < 61) requestAnimationFrame(sample); else resolve(); };
        requestAnimationFrame(sample);
      });
      const gl = node.getContext("webgl2")!, debug = gl.getExtension("WEBGL_debug_renderer_info");
      const intervals = frames.slice(1).map((time, index) => time - frames[index]).sort((a, b) => a - b);
      return { width: node.width, height: node.height, backend: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        callbackFps: 60_000 / (frames[60] - frames[0]), medianMs: intervals[30], p95Ms: intervals[57],
        limitation: "Headless Chromium callback timing; not a physical display or mobile hardware benchmark." };
    });
    await writeFile(`${evidence}/timing-${size.width}.json`, JSON.stringify(timing, null, 2));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `${evidence}/page-${size.width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("moving mist never imports terrain pixels into the sky", async ({ page }) => {
  await page.setViewportSize({ width: 1199, height: 805 });
  await page.addInitScript(() => {
    const times = new WeakSet<WebGLUniformLocation>();
    const prototype = WebGL2RenderingContext.prototype;
    const get = prototype.getUniformLocation, set = prototype.uniform1f;
    prototype.getUniformLocation = function (program, name) {
      const location = get.call(this, program, name);
      if (location && name === "uTime") times.add(location);
      return location;
    };
    // Exercise the longer source offsets late in the advection cycle.
    prototype.uniform1f = function (location, value) { set.call(this, location, value + (location && times.has(location) ? 8 : 0)); };
  });
  const matte = await sharp("public/landing/reference-clouds-mask.png").greyscale().raw().toBuffer();
  // A blue sky and red hill make source-layer leakage unambiguous. This uses
  // the actual shipping masks, shader and renderer, without moving sparkles.
  const plate = Buffer.alloc(1199 * 805 * 3);
  for (let pixel = 0; pixel < matte.length; pixel++) {
    const sky = matte[pixel] > 190;
    plate[pixel * 3] = sky ? 40 : 210;
    plate[pixel * 3 + 1] = sky ? 100 : 40;
    plate[pixel * 3 + 2] = sky ? 180 : 35;
  }
  const fixture = await sharp(plate, { raw: { width: 1199, height: 805, channels: 3 } }).png().toBuffer();
  await page.route("**/landing/reference-scene.png", (route) => route.fulfill({ contentType: "image/png", body: fixture }));
  await page.goto("/");
  const canvas = page.locator(".reference-canvas");
  await expect(page.locator(".reference-background")).toHaveAttribute("data-renderer", "webgl2");
  const samples = [];
  for (let frame = 0; frame < 3; frame++) {
    const pixels = await sharp(await movingFrame(canvas)).removeAlpha().raw().toBuffer();
    let leaked = 0;
    for (let y = 150; y < 590; y++) for (let x = 0; x < 1199; x++) {
      const i = y * 1199 + x;
      if (matte[i] === 255 && pixels[i * 3] > pixels[i * 3 + 2] + 40) leaked++;
    }
    samples.push(leaked);
    await page.waitForTimeout(700);
  }
  await writeFile(`${evidence}/terrain-boundary.json`, JSON.stringify({ leakedRedTerrainPixels: samples }, null, 2));
  expect(samples).toEqual([0, 0, 0]);
});

test("large displays stay within the render budget and survive context restoration", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 2200, height: 1400 }, deviceScaleFactor: 3, reducedMotion: "no-preference" });
  try {
    const page = await context.newPage(); await page.goto(baseURL!);
    const scene = page.locator(".reference-background"), canvas = scene.locator("canvas");
    await expect(scene).toHaveAttribute("data-renderer", "webgl2");
    expect(await canvas.evaluate((node: HTMLCanvasElement) => node.width * node.height)).toBeLessThanOrEqual(1_600_000);
    await canvas.evaluate((node: HTMLCanvasElement) => {
      const extension = node.getContext("webgl2")!.getExtension("WEBGL_lose_context")!;
      extension.loseContext(); setTimeout(() => extension.restoreContext(), 300);
    });
    await expect(scene).toHaveAttribute("data-renderer", "fallback");
    await expect(scene).toHaveAttribute("data-renderer", "webgl2");
    await expect(canvas).toHaveAttribute("data-motion", "running");
  } finally { await context.close(); }
});

test("static scene and navigation survive unavailable WebGL and disabled JavaScript", async ({ browser, baseURL }) => {
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({ javaScriptEnabled, viewport: { width: 390, height: 844 } });
    try {
      if (javaScriptEnabled) await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
          return kind === "webgl2" ? null : Reflect.apply(original, this, [kind, ...args]);
        } as typeof original;
      });
      const page = await context.newPage(); await page.goto(baseURL!);
      await expect(page.locator(".reference-background")).toHaveAttribute("data-renderer", "fallback");
      await expect(page.locator(".reference-static")).toHaveCSS("background-image", /reference-scene\.png/);
      await expect(page.getByRole("link", { name: "Get Started", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: /scene/i })).toBeHidden();
      await page.getByRole("link", { name: "Pricing", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free to build with.");
    } finally { await context.close(); }
  }
});
