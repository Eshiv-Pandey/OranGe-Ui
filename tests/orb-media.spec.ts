import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/orb-media-corrections/after";
const slugs = ["audio-orb", "mascot-avatar", "flowing-water", "film-strip", "github-graph"];
const photo = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500"><rect width="500" height="500" fill="#e57f51"/><rect x="500" width="500" height="500" fill="#68bea2"/><rect x="1000" width="500" height="500" fill="#748cc9"/></svg>');
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));
async function open(page: Page, slug: string, width: number, theme: string, motion = "reduce") {
  await page.setViewportSize({ width, height: width === 1536 ? 781 : 1000 });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.emulateMedia({ reducedMotion: motion as "reduce" | "no-preference" });
  await page.goto(`/components/${slug}?style=polished`);
  await expect(page.getByTestId("live-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}
async function upload(page: Page) {
  await page.getByLabel("Use your photos", { exact: true }).setInputFiles({ name: "1500x500.svg", mimeType: "image/svg+xml", buffer: photo });
  const frame = page.getByTestId("live-demo").locator(".film-frame");
  await expect(frame).toHaveCount(1);
  await expect.poll(() => frame.locator("img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1500);
  const bounds = await frame.evaluate(element => { const image = element.querySelector("img")!; return { frame: (element as HTMLElement).offsetHeight, image: image.offsetHeight, ratio: image.offsetWidth / image.offsetHeight }; });
  expect(bounds.frame - bounds.image).toBeLessThan(45);
  expect(bounds.frame).toBeLessThan(150);
  expect(bounds.ratio).toBeCloseTo(3, 1);
}
for (const width of [320, 390, 768, 1440, 1536]) for (const theme of ["light", "dark"]) test(`corrected previews at ${width}px in ${theme}`, async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const slug of slugs) {
    await open(page, slug, width, theme);
    if (slug === "audio-orb") {
      await expect(page.locator(".audio-orb .shader-canvas")).toHaveAttribute("data-renderer", "webgl2");
      const pixels = await page.locator(".audio-orb canvas").evaluate(element => {
        window.dispatchEvent(new Event("resize"));
        const canvas = element as HTMLCanvasElement, gl = canvas.getContext("webgl2")!;
        const sample = (x: number) => { const pixel = new Uint8Array(4); gl.readPixels(Math.round(canvas.width * x), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); return [...pixel]; };
        return { alpha: gl.getContextAttributes()?.alpha, outside: sample(.01), inside: sample(.15), center: sample(.5) };
      });
      expect(pixels.alpha).toBe(true);
      expect(pixels.outside).toEqual([0, 0, 0, 0]);
      expect(pixels.inside[3]).toBe(255);
      expect(pixels.center[3]).toBe(255);
      await expect(page.locator(".audio-orb-eyes")).toBeHidden();
    }
    if (slug === "mascot-avatar") {
      const character = page.getByRole("combobox", { name: "Character", exact: true });
      const state = page.getByRole("combobox", { name: "Chat state", exact: true });
      const boxes = await Promise.all([character.boundingBox(), state.boundingBox()]);
      expect(boxes[0]!.y + boxes[0]!.height).toBeLessThan(boxes[1]!.y);
      expect(boxes[0]!.width).toBeGreaterThan(180);
      await character.selectOption("puddle-puff"); await state.selectOption("talking");
      await expect(page.getByTestId("live-demo").locator(".mascot-avatar")).toHaveAttribute("data-state", "talking");
      await character.focus(); await expect(character).toBeFocused();
    }
    if (slug === "flowing-water") await expect(page.getByRole("checkbox", { name: "Click ripples", exact: true })).toBeChecked();
    if (slug === "film-strip") { await upload(page); await page.locator(".film-frame").click(); await expect(page.getByText("Selected: 1500x500", { exact: true })).toBeVisible(); }
    if (slug === "github-graph") {
      await expect(page.locator(".github-graph-demo-art .github-graph")).toHaveCSS("--gh-intensity", "1.1");
      await expect(page.locator(".github-graph-demo-art .github-graph")).toHaveCSS("--gh-enter-duration", `${480 / 1.75}ms`);
    }
    await noOverflow(page);
    if ((width === 390 && theme === "light") || (width === 1536 && theme === "dark")) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
    }
  }
  expect(errors).toEqual([]);
});

test("orb playback and microphone drive live energy, with a recoverable fallback", async ({ page }) => {
  await open(page, "audio-orb", 390, "dark", "no-preference");
  const orb = page.locator(".audio-orb");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause music", exact: true })).toBeVisible();
  await expect.poll(() => orb.evaluate(element => Number((element as HTMLElement).style.getPropertyValue("--orb-energy")))).toBeGreaterThan(.001);
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await expect.poll(() => orb.evaluate(element => Number((element as HTMLElement).style.getPropertyValue("--orb-energy")))).toBeLessThan(.001);
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop listening", exact: true })).toBeVisible();
  await expect.poll(() => orb.evaluate(element => Number((element as HTMLElement).style.getPropertyValue("--orb-energy")))).toBeGreaterThan(.001);
  await page.getByRole("button", { name: "Stop listening", exact: true }).click();
  await expect(orb).toHaveAttribute("data-audio-active", "false");
  const contextLoss = await page.locator(".audio-orb canvas").evaluateHandle(element => (element as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!);
  await contextLoss.evaluate(extension => extension.loseContext());
  await expect(orb.locator(".shader-canvas")).toHaveAttribute("data-renderer", "fallback");
  await expect(orb.locator(".audio-orb-eyes rect")).toHaveCount(2);
  await expect(orb.locator(".audio-orb-eyes")).toBeVisible();
  await expect(orb.locator(".audio-orb-eyes ellipse,.audio-orb-eyes path")).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: `${evidence}/audio-orb-fallback-390-dark.png`, fullPage: true });
  await contextLoss.evaluate(extension => extension.restoreContext());
  await expect(orb.locator(".shader-canvas")).toHaveAttribute("data-renderer", "webgl2");
  await expect(orb.locator(".audio-orb-eyes")).toBeHidden();
  await contextLoss.dispose();
});

test("water click ripple is active immediately and can be disabled", async ({ page }) => {
  // Observe actual ripple uniforms sent to the GPU, independently of ambient motion.
  await page.addInitScript(() => {
    const locations = new WeakSet<WebGLUniformLocation>();
    const prototype = WebGL2RenderingContext.prototype;
    const getLocation = prototype.getUniformLocation, send = prototype.uniform4fv;
    prototype.getUniformLocation = function(program, name) {
      const location = getLocation.call(this, program, name);
      if (location && name === "uRipples") locations.add(location);
      return location;
    };
    prototype.uniform4fv = function(location, values, offset, length) {
      if (location && locations.has(location)) document.querySelector(".flowing-water")?.setAttribute("data-test-ripples", JSON.stringify(Array.from(values)));
      send.call(this, location, values, offset, length);
    };
  });
  await open(page, "flowing-water", 1440, "light", "no-preference");
  const scene = page.locator(".flowing-water");
  await expect(scene).toHaveAttribute("data-renderer", "webgl2");
  await expect(page.getByRole("checkbox", { name: "Click ripples", exact: true })).toBeChecked();
  const canvas = scene.locator("canvas");
  const rippleCount = () => scene.evaluate(element => (JSON.parse(element.getAttribute("data-test-ripples") ?? "[]") as number[]).filter((value, index) => index % 4 === 3 && value === 1).length);
  await expect.poll(rippleCount).toBe(0);
  await canvas.click({ position: { x: 200, y: 200 } });
  await expect.poll(rippleCount).toBe(1);
  await page.getByRole("checkbox", { name: "Click ripples", exact: true }).uncheck();
  await expect(page.getByRole("checkbox", { name: "Click ripples", exact: true })).not.toBeChecked();
  await expect.poll(rippleCount).toBe(0);
  await canvas.click({ position: { x: 120, y: 120 } });
  await expect.poll(rippleCount).toBe(0);
});
