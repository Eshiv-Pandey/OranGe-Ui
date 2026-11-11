import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

const evidence = "out/iteration/effects-fix";
declare global {
  interface Window { __shaderBlockingMs: number[]; __shaderLost?: WEBGL_lose_context }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__shaderBlockingMs = [];
    for (const Constructor of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const prototype = Constructor.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
      for (const name of ["compileShader", "linkProgram", "getShaderParameter", "getProgramParameter"]) {
        const original = prototype[name];
        prototype[name] = function (this: unknown, ...args: unknown[]) {
          const start = performance.now();
          const result = original.apply(this, args);
          window.__shaderBlockingMs.push(performance.now() - start);
          return result;
        };
      }
    }
  });
});

async function open(page: Page, slug: string, appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`, { waitUntil: "domcontentloaded" });
  const root = page.locator(`.${slug}`);
  await expect(root).toHaveAttribute("data-renderer", slug === "anime-fire" ? "webgl" : "webgl2");
  return root;
}

// Copy in the drawing task so non-preserved WebGL buffers cannot turn the
// animation/paused-frame checks into comparisons of two empty images.
async function pixels(root: Locator, kind: "webgl" | "webgl2") {
  return root.locator("canvas").evaluate((canvas: HTMLCanvasElement, kind) => {
    const gl = canvas.getContext(kind) as WebGLRenderingContext | WebGL2RenderingContext;
    gl.drawArrays(gl.TRIANGLES, 0, kind === "webgl" ? 6 : 3);
    const copy = document.createElement("canvas"); copy.width = copy.height = 48;
    const context = copy.getContext("2d")!;
    context.drawImage(canvas, 0, 0, 48, 48);
    const data = context.getImageData(0, 0, 48, 48).data, colors = new Set<string>();
    let hash = 2166136261, white = 0;
    for (let i = 0; i < data.length; i += 4) {
      hash = Math.imul(hash ^ data[i], 16777619);
      hash = Math.imul(hash ^ data[i + 1], 16777619);
      hash = Math.imul(hash ^ data[i + 2], 16777619);
      colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      if (data[i] > 180 && data[i + 1] > 180 && data[i + 2] > 180) white++;
    }
    return { hash: hash >>> 0, colors: colors.size, white, error: gl.getError(), pixels: canvas.width * canvas.height };
  }, kind);
}

async function range(page: Page, label: string, value: number) {
  const input = page.getByRole("slider", { name: label, exact: true });
  await input.evaluate((element: HTMLInputElement, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, String(value));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(String(value));
}

for (const width of [1366, 390]) test(`fire and clouds stay live, bounded and recoverable at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 850 });
  const errors: string[] = [], observations = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mkdir(evidence, { recursive: true });
  for (const slug of ["anime-fire", "drifting-clouds"]) {
    const kind = slug === "anime-fire" ? "webgl" : "webgl2", root = await open(page, slug);
    await page.mouse.move(1, 1);
    const before = await pixels(root, kind);
    expect(before.error).toBe(0); expect(before.colors).toBeGreaterThan(8); expect(before.white).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    expect((await pixels(root, kind)).hash).not.toBe(before.hash);
    expect(before.pixels).toBeLessThanOrEqual(slug === "anime-fire" ? 768_000 : 360_000);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (slug === "anime-fire") {
      const sound = await page.getByRole("button", { name: "Sound off, enable fire sound" }).boundingBox();
      const dock = await page.getByRole("tablist").first().boundingBox();
      expect(sound && dock && sound.y + sound.height <= dock.y).toBe(true);
      await page.getByRole("button", { name: "Sound off, enable fire sound" }).click();
      await expect(page.getByRole("button", { name: "Sound on, mute fire sound" })).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Sound on, mute fire sound" }).click();
    }
    if (process.env.ORANGEUI_CAPTURE !== "0") await page.screenshot({ path: `${evidence}/final-${slug}-${width}.png` });

    await page.emulateMedia({ reducedMotion: "reduce" });
    const still = await pixels(root, kind);
    await page.waitForTimeout(150);
    expect((await pixels(root, kind)).hash).toBe(still.hash);
    if (slug === "drifting-clouds") {
      await range(page, "Sky coverage", 0);
      const clear = await pixels(root, kind);
      expect(clear.hash).not.toBe(still.hash);
      await range(page, "Sky coverage", .6);
      const restored = await pixels(root, kind);
      await range(page, "Sun angle", 200);
      expect((await pixels(root, kind)).hash).not.toBe(restored.hash);
    } else {
      await range(page, "Flame height", .75);
      const taller = await pixels(root, kind);
      expect(taller.hash).not.toBe(still.hash);
      const fire = root.locator("canvas"); await fire.focus(); await fire.press("ArrowUp");
      expect((await pixels(root, kind)).hash).not.toBe(taller.hash);
    }
    await root.locator("canvas").evaluate((canvas: HTMLCanvasElement, kind) => {
      const gl = canvas.getContext(kind) as WebGLRenderingContext | WebGL2RenderingContext;
      window.__shaderLost = gl.getExtension("WEBGL_lose_context")!;
      window.__shaderLost!.loseContext();
    }, kind);
    await expect(root).toHaveAttribute("data-renderer", "fallback");
    await page.evaluate(() => window.__shaderLost!.restoreContext());
    await expect(root).toHaveAttribute("data-renderer", kind);
    expect((await pixels(root, kind)).error).toBe(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const blockingMs = await page.evaluate(() => Math.max(...window.__shaderBlockingMs));
    expect(blockingMs).toBeLessThan(2000);
    observations.push({ slug, width, blockingMs, before });
  }
  if (width === 1366) for (const slug of ["anime-fire", "drifting-clouds", "anime-fire", "drifting-clouds"]) {
    const name = slug === "anime-fire" ? "AnimeFire" : "DriftingClouds";
    await page.getByRole("link", { name, exact: true }).first().click();
    await expect(page.locator(`.${slug}`)).toHaveAttribute("data-renderer", slug === "anime-fire" ? "webgl" : "webgl2");
  }
  expect(errors).toEqual([]);
  await writeFile(`${evidence}/runtime-${width}.json`, JSON.stringify({ observations, errors }, null, 2));
});

test("all five appearances compile and high-DPR clouds respect the drawing budget", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const appearance of APPEARANCE_VALUES) for (const slug of ["anime-fire", "drifting-clouds"]) {
    const root = await open(page, slug, appearance);
    expect((await pixels(root, slug === "anime-fire" ? "webgl" : "webgl2")).error).toBe(0);
  }
  const highDpr = await context.browser()!.newContext({ viewport: { width: 2200, height: 1400 }, deviceScaleFactor: 3, reducedMotion: "reduce" });
  try {
    const large = await highDpr.newPage();
    await large.goto(new URL("/components/drifting-clouds?style=polished", page.url()).href);
    const root = large.locator(".drifting-clouds"); await expect(root).toHaveAttribute("data-renderer", "webgl2");
    await range(large, "Render scale", 1);
    expect((await pixels(root, "webgl2")).pixels).toBeLessThanOrEqual(360_000);
  } finally { await highDpr.close(); }
});
