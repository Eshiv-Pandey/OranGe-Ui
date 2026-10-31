import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CREATIVE_COMPONENTS } from "../lib/creative-components";
import { componentsInCollection } from "../lib/components";
import type { Appearance } from "../components/ui/appearance";

const evidence = process.env.ORANGEUI_EVIDENCE_DIR ?? "out/batch-2/browser";
type Observation = { slug: string; [key: string]: unknown };
declare global {
  interface Window {
    __creativeTest: { plays: number; audio: HTMLMediaElement[]; streams: MediaStream[]; copied: string[] };
    __creativeLostContext?: WEBGL_lose_context;
  }
}

test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__creativeTest = { plays: 0, audio: [], streams: [], copied: [] };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__creativeTest.plays++;
      if (!window.__creativeTest.audio.includes(this)) window.__creativeTest.audio.push(this);
      return play.call(this);
    };
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { window.__creativeTest.copied.push(text); } } });
    const getUserMedia = navigator.mediaDevices?.getUserMedia.bind(navigator.mediaDevices);
    if (getUserMedia) navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await getUserMedia(constraints); window.__creativeTest.streams.push(stream); return stream;
    };
  });
});

async function open(page: Page, slug: string) {
  const component = CREATIVE_COMPONENTS.find((item) => item.slug === slug)!;
  await page.goto(`/components/${slug}?style=${component.collection}`, { waitUntil: "networkidle" });
  const demo = page.getByTestId("live-demo");
  await expect(demo.locator(".creative-demo")).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  return demo;
}

async function changeRange(input: Locator, value: number) {
  await input.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(element, String(value));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(String(value));
}

async function saveDownload(page: Page, button: Locator, name: string) {
  const pending = page.waitForEvent("download");
  await button.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  const destination = `${evidence}/${name}`;
  await download.saveAs(destination);
  return destination;
}

async function imagePixels(page: Page, path: string) {
  const bytes = await readFile(path);
  return page.evaluate(async (source) => {
    const image = new Image(); image.src = "data:image/png;base64," + source; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visible = 0; const colors = new Set<string>();
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3]) { visible++; if (i % 32 === 0) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`); }
    return { width: canvas.width, height: canvas.height, visible, colors: colors.size };
  }, bytes.toString("base64"));
}

for (const width of [1366, 380]) for (const theme of ["light", "dark"] as const) test(`creative layout and accessibility ${width} ${theme}`, async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width, height: width === 380 ? 844 : 900 });
  await page.addInitScript((theme) => localStorage.setItem("orangeui-palette", theme), theme);
  await page.emulateMedia({ colorScheme: theme });
  const folder = `${evidence}/${width}-${theme}`; await mkdir(folder, { recursive: true });
  const observations: Observation[] = [], errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const component of CREATIVE_COMPONENTS) await test.step(component.name, async () => {
      const demo = await open(page, component.slug);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { name: component.name, exact: true })).toBeVisible();
      await expect(demo.locator(".creative-demo")).toHaveAttribute("data-theme", theme);
      await expect(demo.locator("[data-appearance]").first()).toHaveAttribute("data-appearance", component.collection!);
      await expect(demo.locator("[data-main-preview]")).toHaveCount(1);
      const geometry = await demo.evaluate((element) => {
        const primary = element.querySelector("[data-main-preview]")!, rect = primary.getBoundingClientRect();
        return { width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, overflow: document.documentElement.scrollWidth > innerWidth, previewOverflow: primary.scrollWidth > primary.clientWidth + 1 };
      });
      expect.soft(geometry.overflow, component.slug + " document overflow").toBe(false);
      expect.soft(geometry.previewOverflow, component.slug + " preview overflow").toBe(false);
      expect.soft(geometry.left, component.slug + " preview left").toBeGreaterThanOrEqual(0);
      expect.soft(geometry.right, component.slug + " preview right").toBeLessThanOrEqual(width);
      const violations = (await new AxeBuilder({ page }).include('[data-testid="live-demo"]').analyze()).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
      expect.soft(violations, component.slug + " accessibility").toEqual([]);
      const control = demo.locator('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]').filter({ visible: true }).first();
      await control.focus({ timeout: 30_000 });
      const focus = await page.evaluate(() => {
        const element = document.activeElement!, style = getComputedStyle(element);
        return { insideDemo: Boolean(element.closest('[data-testid="live-demo"]')), style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect.soft(focus.insideDemo, component.slug + " focus enters the demo").toBe(true);
      expect.soft(focus.style, component.slug + " keyboard focus").not.toBe("none");
      expect.soft(focus.width, component.slug + " keyboard focus width").toBeGreaterThan(0);
      await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: `${folder}/${component.slug}.png`, animations: "disabled" });
      await demo.locator("[data-main-preview]").screenshot({ path: `${folder}/${component.slug}-preview.png`, animations: "disabled" });
      await expect(page.getByRole("link", { name: "Download source", exact: true })).toHaveAttribute("href", `/api/components/${component.slug}?style=${component.collection}`);
      expect.soft(await page.title(), component.slug + " title").toContain(component.name);
      observations.push({ slug: component.slug, collection: component.collection, geometry, violations, focus });
    });
    expect(errors).toEqual([]);
  } finally {
    await writeFile(`${folder}/report.json`, JSON.stringify({ buildId: (await readFile(".next/BUILD_ID", "utf8")).trim(), width, theme, errors, observations }, null, 2));
  }
});

test("creative collection search, navigation, copy and source routes", async ({ page, request }) => {
  test.setTimeout(300_000);
  for (const appearance of ["pixel", "retro-os", "polished"] as Appearance[]) {
    await page.goto(`/components?style=${appearance}`);
    await expect(page.locator(".component-tile")).toHaveCount(componentsInCollection(appearance).length);
    for (const component of CREATIVE_COMPONENTS.filter((item) => item.collection === appearance)) {
      const input = page.getByRole("searchbox", { name: "Search all components" });
      await input.fill(component.name);
      await expect(page.locator(".component-tile")).toHaveCount(1);
      await expect(page.locator(".component-tile a")).toHaveAttribute("href", `/components/${component.slug}?style=${appearance}`);
    }
  }
  for (const component of CREATIVE_COMPONENTS) {
    await open(page, component.slug);
    await page.getByRole("button", { name: "Copy install command", exact: true }).click();
    expect(await page.evaluate(() => window.__creativeTest.copied.at(-1))).toContain(`/r/${component.slug}.json?style=${component.collection}`);
    await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
    expect(await page.evaluate(() => window.__creativeTest.copied.at(-1))).toContain(component.name);
    await page.getByRole("tab", { name: "Usage", exact: true }).click();
    await expect(page.locator("#example-panel code")).toContainText("<" + component.name);
    await page.getByRole("button", { name: "Copy code", exact: true }).click();
    expect(await page.evaluate(() => window.__creativeTest.copied.at(-1))).toContain("<" + component.name);
    const zip = await request.get(`/api/components/${component.slug}?style=${component.collection}`);
    expect(zip.ok()).toBe(true); expect(zip.headers()["content-type"]).toContain("zip");
    const registry = await request.get(`/r/${component.slug}.json?style=${component.collection}`);
    expect(registry.ok()).toBe(true);
    const item = await registry.json(); expect(item.name).toBe("orangeui-" + component.slug);
    expect(item.files.some((file: { path: string }) => /AGENTS|USER_INSTRUCTIONS|reference-images|\.env/.test(file.path))).toBe(false);
  }
});

test("season picker replaces the whole settled tree", async ({ page }) => {
  const demo = await open(page, "season-tree"), canvas = demo.locator("canvas");
  const states: string[] = [];
  for (const button of await demo.locator(".season-tree-picker button").all()) {
    await button.click(); await expect(button).toHaveAttribute("aria-pressed", "true");
    states.push(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()));
  }
  expect(new Set(states).size).toBe(5);
});

for (const slug of ["retro-player", "island-player", "glass-player", "neon-pill-player"]) test(`real playback, seeking, track changes and cleanup ${slug}`, async ({ page }) => {
  const demo = await open(page, slug);
  if (slug === "neon-pill-player") await demo.locator(".neon-cover-button").focus();
  expect(await page.evaluate(() => window.__creativeTest.plays)).toBe(0);
  const progress = demo.getByRole("slider", { name: "Track progress", exact: true });
  await expect(progress).toBeEnabled();
  await demo.getByRole("button", { name: "Play", exact: true }).first().click();
  await expect(demo.getByRole("button", { name: "Pause", exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__creativeTest.audio.find((audio) => audio.tagName === "AUDIO")?.currentTime ?? 0)).toBeGreaterThan(0.15);
  await changeRange(progress, 8);
  await expect.poll(() => page.evaluate(() => window.__creativeTest.audio.find((audio) => audio.tagName === "AUDIO")?.currentTime ?? 0)).toBeGreaterThanOrEqual(8);
  await demo.getByRole("button", { name: "Next track", exact: true }).click();
  await expect(demo).toContainText("Blue hour");
  await demo.getByRole("button", { name: "Mute", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Unmute", exact: true })).toHaveAttribute("aria-pressed", "true");
  await demo.getByRole("button", { name: "Pause", exact: true }).first().click();
  await page.getByRole("tab", { name: "Usage", exact: true }).click();
  expect(await page.evaluate(() => window.__creativeTest.audio.filter((audio) => audio.tagName === "AUDIO").every((audio) => audio.paused && !audio.getAttribute("src")))).toBe(true);
});

test("neon touch expansion preserves playback until an explicit play tap", async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 844 });
  const demo = await open(page, "neon-pill-player"), pill = demo.locator(".neon-pill-player");
  await page.getByRole("heading", { name: "NeonPillPlayer", exact: true }).click();
  await expect(pill).toHaveAttribute("data-expanded", "false");
  const session = await page.context().newCDPSession(page);
  const rect = (await demo.locator(".neon-cover-button").boundingBox())!;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, id: 1 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(pill).toHaveAttribute("data-expanded", "true");
  expect(await page.evaluate(() => window.__creativeTest.plays)).toBe(0);
  await demo.getByRole("button", { name: "Play", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.getByRole("heading", { name: "NeonPillPlayer", exact: true }).click();
  await expect(pill).toHaveAttribute("data-expanded", "false");
});

test("glass player controlled like and share fallback", async ({ page }) => {
  const demo = await open(page, "glass-player");
  await demo.getByRole("button", { name: "Like track", exact: true }).click();
  await expect(demo.getByRole("checkbox", { name: "Liked", exact: true })).toBeChecked();
  await demo.getByRole("checkbox", { name: "Liked", exact: true }).uncheck();
  await expect(demo.getByRole("button", { name: "Like track", exact: true })).toHaveAttribute("aria-pressed", "false");
  await demo.getByRole("button", { name: "Share track", exact: true }).click();
  await expect(demo).toContainText("Link copied.");
  expect(await page.evaluate(() => window.__creativeTest.copied.at(-1))).toBe(page.url());
});

test("camera denied and missing states retain demo capture", async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied in verification", "NotAllowedError"); }; });
  const demo = await open(page, "retro-camera");
  await demo.getByRole("button", { name: /Enable camera/ }).click();
  await expect(demo).toContainText("Camera permission denied.");
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("No test camera", "NotFoundError"); }; });
  await demo.getByRole("button", { name: /Enable camera/ }).click();
  await expect(demo).toContainText("No camera is available here.");
  await demo.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Review photo 1", exact: true })).toBeVisible();
  const path = await saveDownload(page, demo.getByRole("link", { name: "Download selected photo" }), "camera-demo.png");
  const pixels = await imagePixels(page, path); expect(pixels.visible).toBeGreaterThan(1000); expect(pixels.colors).toBeGreaterThan(20);
});

test("camera real test stream, zoom, filter, capture, flip and track cleanup", async ({ page }) => {
  const demo = await open(page, "retro-camera");
  expect(await page.evaluate(() => window.__creativeTest.streams.length)).toBe(0);
  await demo.getByRole("button", { name: /Enable camera/ }).click();
  await expect(demo).toContainText("Live camera");
  await expect.poll(() => demo.locator("video").evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2);
  await demo.getByRole("button", { name: "Zoom in" }).click();
  await expect(demo.locator(".camera-screen-hud")).toContainText("1.3×");
  await demo.getByRole("combobox", { name: "Photo filter", exact: true }).selectOption("mono");
  await demo.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Review photo 1", exact: true })).toBeVisible();
  await expect(demo.locator(".retro-camera-stage")).toHaveAttribute("data-layout", "stacked");
  await demo.getByRole("checkbox", { name: "Show both sides" }).uncheck();
  await demo.getByRole("button", { name: "Flip to front", exact: true }).click();
  await expect(demo.locator(".retro-camera-stage")).toHaveAttribute("data-view", "front");
  await expect(demo.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
  await demo.getByRole("button", { name: "Flip to back", exact: true }).click();
  await demo.getByRole("button", { name: "Delete selected photo" }).click();
  await expect(demo.locator(".camera-gallery")).toHaveCount(0);
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(demo).toContainText("Camera stopped while hidden.");
  expect(await page.evaluate(() => window.__creativeTest.streams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
  await demo.getByRole("button", { name: /Enable camera/ }).click();
  await expect(demo).toContainText("Live camera");
  await page.getByRole("tab", { name: "Usage", exact: true }).click();
  expect(await page.evaluate(() => window.__creativeTest.streams.length)).toBe(2);
  expect(await page.evaluate(() => window.__creativeTest.streams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
});

test("stamp editor exports standalone artwork and a four-stamp sheet", async ({ page }) => {
  const demo = await open(page, "custom-stamp");
  await demo.locator("summary").click();
  await demo.getByLabel("Title", { exact: true }).fill("GARDEN CLUB");
  await demo.getByLabel("Country", { exact: true }).fill("INDIA");
  await demo.getByRole("combobox", { name: "Perforation", exact: true }).selectOption("square");
  await demo.getByRole("checkbox", { name: "Add postmark" }).check();
  const svgPath = await saveDownload(page, demo.getByRole("button", { name: "SVG", exact: true }), "stamp.svg");
  const svg = await readFile(svgPath, "utf8"); expect(svg).toContain("GARDEN CLUB"); expect(svg).toContain("data:font/woff2;base64"); expect(svg).toContain("data:image/svg+xml");
  const png = await imagePixels(page, await saveDownload(page, demo.getByRole("button", { name: "PNG", exact: true }), "stamp.png"));
  expect(png).toMatchObject({ width: 480, height: 720 }); expect(png.colors).toBeGreaterThan(20);
  await demo.getByRole("checkbox", { name: "Stamp sheet", exact: true }).check();
  const sheet = await readFile(await saveDownload(page, demo.getByRole("button", { name: "SVG", exact: true }), "stamp-sheet.svg"), "utf8");
  const stampTitles = await page.evaluate((markup) => [...new DOMParser().parseFromString(markup, "image/svg+xml").querySelectorAll("text")].filter((element) => element.textContent === "GARDEN CLUB").length, sheet);
  expect(stampTitles).toBe(4);
  const sheetPng = await imagePixels(page, await saveDownload(page, demo.getByRole("button", { name: "PNG", exact: true }), "stamp-sheet.png"));
  expect(sheetPng).toMatchObject({ width: 992, height: 1472 });
});

for (const slug of ["hindi-text", "hinglish-text"]) test(`mixed script editing, transliteration, wrapping and exports ${slug}`, async ({ page }) => {
  const demo = await open(page, slug);
  await demo.getByRole("textbox", { name: "Your words", exact: true }).fill("namaste भारत\ngood वक्त");
  await demo.getByRole("checkbox", { name: "Roman to Hindi", exact: true }).check();
  await expect(demo.locator(".styled-text-output")).toHaveAttribute("aria-label", /नमस्ते भारत/);
  const path = await saveDownload(page, demo.getByRole("button", { name: "SVG", exact: true }), slug + ".svg");
  const svg = await readFile(path, "utf8"); expect(svg).toContain("नमस्ते भारत"); expect(svg).toContain("data:font/woff2;base64"); expect(svg).not.toContain("/fonts/");
  const png = await imagePixels(page, await saveDownload(page, demo.getByRole("button", { name: "PNG", exact: true }), slug + ".png"));
  expect(png.width).toBe(720); expect(png.visible).toBeGreaterThan(1000); expect(png.colors).toBeGreaterThan(20);
  await demo.getByRole("textbox", { name: "Your words", exact: true }).fill("अंतरराष्ट्रीयकरण".repeat(10));
  await expect.poll(() => demo.locator(".styled-text-output text").count()).toBeGreaterThan(2);
});

test("frosted glass preserves visible frost and text through fractional canvas resizes", async ({ page }) => {
  const folder = "out/batch-2/final-audit";
  await mkdir(folder, { recursive: true });
  const observations: Observation[] = [];
  const pixels = (canvas: Locator) => canvas.evaluate((element: HTMLCanvasElement) => {
    const data = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data;
    let opaque = 0, clear = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] >= 250) opaque++;
      if (data[index] <= 5) clear++;
    }
    return { opaque: opaque / (data.length / 4), clear: clear / (data.length / 4) };
  });
  try {
    for (const width of [1366, 380]) for (const theme of ["light", "dark"] as const) {
      await page.setViewportSize({ width, height: width === 380 ? 844 : 900 });
      await page.addInitScript((value) => localStorage.setItem("orangeui-palette", value), theme);
      await page.emulateMedia({ colorScheme: theme });
      const demo = await open(page, "frosted-glass"), stage = demo.locator(".frosted-glass-stage"), canvas = stage.locator(":scope > canvas");
      await expect.poll(async () => (await pixels(canvas)).opaque).toBeGreaterThan(0.6);
      const initial = await pixels(canvas);
      expect(initial.clear).toBeGreaterThan(0.01);
      const backingWidth = await canvas.evaluate((element: HTMLCanvasElement) => element.width);
      await stage.evaluate((element) => {
        const dpr = Math.min(2, devicePixelRatio || 1), physicalWidth = Math.round(element.getBoundingClientRect().width * dpr);
        (element as HTMLElement).style.width = (physicalWidth - 0.125) / dpr + "px";
      });
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width)).toBe(backingWidth);
      const resized = await pixels(canvas);
      expect(resized.opaque).toBeGreaterThan(0.6);
      expect(resized.clear).toBeGreaterThan(0.01);
      await demo.locator("[data-main-preview]").screenshot({ path: `${folder}/frosted-glass-${width}-${theme}.png`, animations: "disabled" });
      expect((await pixels(canvas)).opaque).toBeGreaterThan(0.6);
      observations.push({ slug: "frosted-glass", width, theme, initial, resized, backingWidth });
    }
  } finally {
    await writeFile(`${folder}/frosted-glass-report.json`, JSON.stringify({ buildId: (await readFile(".next/BUILD_ID", "utf8")).trim(), observations }, null, 2));
  }
});

test("frosted glass pointer, multiple touch paths, keyboard clearing and reset", async ({ page }) => {
  const demo = await open(page, "frosted-glass"), canvas = demo.locator(".frosted-glass-stage > canvas");
  const initial = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
  await canvas.scrollIntoViewIfNeeded();
  const rect = (await canvas.boundingBox())!;
  await page.mouse.move(rect.x + rect.width * 0.2, rect.y + rect.height * 0.2); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height * 0.3, { steps: 12 }); await page.mouse.up();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).not.toBe(initial);
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: rect.x + 30, y: rect.y + 50, id: 1 }, { x: rect.x + 150, y: rect.y + 50, id: 2 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: rect.x + 70, y: rect.y + 100, id: 1 }, { x: rect.x + 190, y: rect.y + 100, id: 2 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await canvas.focus(); await canvas.press("Space");
  const alpha = await canvas.evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data;
    let sum = 0; for (let index = 3; index < pixels.length; index += 4) sum += pixels[index]; return sum;
  });
  expect(alpha).toBe(0); await canvas.press("r");
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).toBe(initial);
  await canvas.press("ArrowRight");
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).not.toBe(initial);
});

test.describe("animated renderer lifecycle", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const slug of ["anime-fire", "grain-gradient"]) test(`WebGL pixels, context restoration, visibility and reduced motion ${slug}`, async ({ page }) => {
    const demo = await open(page, slug), root = demo.locator("." + slug), canvas = root.locator("canvas");
    await expect(root).toHaveAttribute("data-renderer", "webgl");
    await expect(canvas).toHaveAttribute("data-motion", "running");
    const samples = await canvas.evaluate((element: HTMLCanvasElement) => {
      const gl = element.getContext("webgl")!, pixels = new Uint8Array(element.width * element.height * 4);
      gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const colors = new Set<string>();
      for (let y = 0; y < element.height; y += Math.max(1, Math.floor(element.height / 32))) for (let x = 0; x < element.width; x += Math.max(1, Math.floor(element.width / 32))) {
        const i = (y * element.width + x) * 4; colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      }
      return { colors: colors.size, dpr: element.width / element.getBoundingClientRect().width };
    });
    expect(samples.colors).toBeGreaterThan(4); expect(samples.dpr).toBeLessThanOrEqual(2.01);
    await canvas.evaluate((element: HTMLCanvasElement) => { window.__creativeLostContext = element.getContext("webgl")!.getExtension("WEBGL_lose_context")!; window.__creativeLostContext.loseContext(); });
    await expect(root).toHaveAttribute("data-renderer", "fallback");
    await page.evaluate(() => window.__creativeLostContext!.restoreContext());
    await expect(root).toHaveAttribute("data-renderer", "webgl");
    await page.locator(".component-pagination").scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute("data-motion", "paused");
    await canvas.scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute("data-motion", "running");
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(canvas).toHaveAttribute("data-motion", "paused");
    const clock = await canvas.evaluate((element) => element.style.getPropertyValue("--motion-clock"));
    await page.waitForTimeout(150);
    expect(await canvas.evaluate((element) => element.style.getPropertyValue("--motion-clock"))).toBe(clock);
    await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect(canvas).toHaveAttribute("data-motion", "running");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-motion", "reduced");
    const still = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()); await page.waitForTimeout(150);
    expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).toBe(still);
  });
  test("keychain drag and keyboard motion, plus card tilt and spring return", async ({ page, context }) => {
    let demo = await open(page, "swing-keychain");
    const canvas = demo.locator("canvas");
    await expect(canvas).toHaveAttribute("data-motion", "running");
    const before = await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    await canvas.focus(); await canvas.press("ArrowRight"); await page.waitForTimeout(150);
    expect(await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())).not.toBe(before);
    const rect = (await canvas.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height * 0.65); await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height * 0.3, { steps: 12 }); await page.mouse.up();
    demo = await open(page, "tilt-stamp-3d"); const card = demo.locator(".tilt-stamp-card");
    await card.focus(); await card.press("ArrowRight");
    await expect.poll(() => card.evaluate((element) => Math.abs(parseFloat((element as HTMLElement).style.getPropertyValue("--tilt-y"))))).toBeGreaterThan(1);
    await card.press("Home");
    await expect.poll(() => card.evaluate((element) => Math.abs(parseFloat((element as HTMLElement).style.getPropertyValue("--tilt-y"))))).toBeLessThan(0.05);
    await context.grantPermissions(["accelerometer", "gyroscope"]);
    await demo.getByRole("button", { name: "Use device tilt", exact: true }).click();
    await expect(demo.getByRole("button", { name: "Motion on", exact: true })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { beta: 35, gamma: 15 })));
    await expect.poll(() => card.evaluate((element) => Math.abs(parseFloat((element as HTMLElement).style.getPropertyValue("--tilt-y"))))).toBeGreaterThan(1);
    await demo.getByRole("button", { name: "Motion on", exact: true }).click();
  });
});

test("CSS shader fallback and gradient controls remain exportable without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  let demo = await open(page, "anime-fire"); await expect(demo.locator(".anime-fire")).toHaveAttribute("data-renderer", "fallback");
  await expect(demo.locator(".anime-fire-fallback")).toBeVisible();
  demo = await open(page, "grain-gradient"); await expect(demo.locator(".grain-gradient")).toHaveAttribute("data-renderer", "fallback");
  await demo.getByRole("combobox", { name: "Palette", exact: true }).selectOption("holi");
  await demo.getByRole("checkbox", { name: "Edit color points" }).check();
  const point = demo.getByRole("button", { name: /^Color point 1\./ });
  const left = await point.evaluate((element) => (element as HTMLElement).style.left);
  await point.focus(); await point.press("ArrowRight");
  expect(await point.evaluate((element) => (element as HTMLElement).style.left)).not.toBe(left);
  const png = await imagePixels(page, await saveDownload(page, demo.getByRole("button", { name: "Save image" }), "gradient-fallback.png"));
  expect(png).toMatchObject({ width: 1000, height: 800 }); expect(png.colors).toBeGreaterThan(20);
});

test.describe("high density canvas sizing", () => {
  test.use({ deviceScaleFactor: 3, viewport: { width: 380, height: 844 } });
  test("caps WebGL and frost backing stores at two device pixels", async ({ page }) => {
    expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
    for (const slug of ["anime-fire", "grain-gradient", "frosted-glass"]) {
      const demo = await open(page, slug);
      const canvas = demo.locator(slug === "frosted-glass" ? ".frosted-glass-stage > canvas" : "." + slug + " canvas");
      const ratio = await canvas.evaluate((element: HTMLCanvasElement) => element.width / element.getBoundingClientRect().width);
      expect(ratio).toBeGreaterThanOrEqual(1.99); expect(ratio).toBeLessThanOrEqual(2.01);
    }
  });
});
