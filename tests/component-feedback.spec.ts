import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const slugs = ["emberling", "bubble-wrap", "photo-garland", "journal-stack", "neon-pill-player", "island-player", "floating-dock", "liquid-metal", "alert", "sheet", "calendar", "audio-orb", "vinyl-player", "wave-player"];
const fields = new Set(["bubble-wrap", "bloom-trail", "draggable-cards", "photo-garland", "liquid-metal"]);
const captures = ".impeccable/review/component-feedback2";
async function open(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("[data-main-preview]").first()).toBeVisible();
  await expect(page.locator("[data-preview-pending]")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [1440, 390]) for (const theme of ["light", "dark"] as const) test(`feedback surfaces fill their stage at ${width} in ${theme}`, async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
  const errors: string[] = [], observations = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mkdir(captures, { recursive: true });
  for (const slug of slugs) {
    await open(page, slug);
    const stage = page.locator(".workspace-stage"), box = (await stage.boundingBox())!;
    if (slug === "neon-pill-player") { await page.getByRole("button", { name: "Expand music player" }).click(); await expect(page.locator(".neon-pill-player")).toHaveAttribute("data-expanded", "true"); }
    if (slug === "bubble-wrap") { const cell = (await page.locator(".bubble-cell").first().boundingBox())!; expect.soft(Math.abs(cell.width - cell.height), "packed bubbles have square layout slots").toBeLessThan(4); }
    if (slug === "liquid-metal") await expect(page.locator(".liquid-metal")).toHaveAttribute("data-renderer", "webgl2");
    await expect.poll(() => stage.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const geometry = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    const artwork = fields.has(slug) ? (await stage.locator(`.${slug}`).boundingBox())! : null;
    if (artwork) {
      expect.soft(artwork.width, `${slug} fills stage width`).toBeGreaterThanOrEqual(box.width - 3);
      expect.soft(artwork.height, `${slug} fills stage height`).toBeGreaterThanOrEqual(box.height - 3);
      expect.soft(Math.abs(artwork.y - box.y - 1), `${slug} starts at the top of its stage`).toBeLessThan(2);
      expect.soft(artwork.y + artwork.height, `${slug} stays inside its stage`).toBeLessThanOrEqual(box.y + box.height + 1);
    }
    const dock = (await stage.locator(".workspace-stage-toolbar").boundingBox())!;
    for (const element of await stage.locator(".emberling, .bloom-trail-footer, .draggable-cards-footer, .bubble-wrap-footer, .garland-caption").all()) {
      const bounds = (await element.boundingBox())!;
      expect.soft(bounds.x, `${slug} content fits on the left`).toBeGreaterThanOrEqual(box.x);
      expect.soft(bounds.x + bounds.width, `${slug} content fits on the right`).toBeLessThanOrEqual(box.x + box.width);
      expect.soft(bounds.y + bounds.height, `${slug} content clears the dock`).toBeLessThan(dock.y - 8);
    }
    expect.soft(geometry.scrollWidth, `${slug} page overflow`).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: `${captures}/${slug}-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
    await stage.screenshot({ path: `${captures}/${slug}-${theme}-${width}-preview.png`, animations: "disabled" });
    if (slug === "sheet") { await page.getByRole("button", { name: "Workspace preferences" }).click(); await page.getByRole("dialog").screenshot({ path: `${captures}/sheet-open-${theme}-${width}.png`, animations: "disabled" }); await page.getByRole("button", { name: "Close panel" }).click(); }
    const accessibility = await new AxeBuilder({ page }).include("[data-main-preview]").analyze();
    observations.push({ slug, geometry, stage: box, artwork, violations: accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })) });
  }
  await writeFile(`${captures}/observations-${theme}-${width}.json`, JSON.stringify({ observations, errors }, null, 2));
  expect(errors).toEqual([]);
  expect(observations.flatMap(({ slug, violations }) => violations.map((violation) => ({ slug, ...violation })))).toEqual([]);
});

test("flowers follow the pointer at both edges of the full field", async ({ page }) => {
  await open(page, "bloom-trail");
  await page.getByRole("button", { name: "Clear flowers", exact: true }).click();
  const field = page.locator(".bloom-trail-canvas"), box = (await field.boundingBox())!;
  await page.mouse.move(box.x + 18, box.y + 22);
  await page.mouse.move(box.x + box.width - 22, box.y + box.height - 190);
  const points = await page.locator(".bloom-trail-art > g").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("transform")!.match(/translate\(([-\d.]+) ([-\d.]+)\)/)!.slice(1).map(Number)));
  expect(points.some(([x, y]) => x < 25 && y < 30)).toBe(true);
  expect(points.some(([x, y]) => x > box.width - 30 && y > box.height - 200)).toBe(true);
});

test("cards can reach the upper field and stay inside it after release", async ({ page }) => {
  await open(page, "draggable-cards");
  const field = (await page.locator(".draggable-cards-stage").boundingBox())!;
  const card = page.locator(".draggable-card").last(), before = (await card.boundingBox())!;
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(field.x + field.width * .73, field.y + 24, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(550);
  const after = (await card.boundingBox())!;
  expect(after.y).toBeLessThan(before.y - 50);
  expect(after.y).toBeGreaterThanOrEqual(field.y - 1);
  expect(after.x + after.width).toBeLessThanOrEqual(field.x + field.width + 1);
  await card.press("Escape");
  await expect.poll(async () => Math.abs((await card.boundingBox())!.y - before.y)).toBeLessThan(1);
});

test("bubble wrap starts silent and makes an audible buffer on its first pop", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & { popEnergy: number[]; popContexts: AudioContext[] };
    target.popEnergy = []; target.popContexts = [];
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) { super(options); target.popContexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource(), start = source.start.bind(source);
        source.start = (when?: number, offset?: number, duration?: number) => {
          const data = source.buffer?.getChannelData(0);
          if (data) target.popEnergy.push(Math.sqrt(data.reduce((sum, value) => sum + value * value, 0) / data.length));
          if (duration === undefined) start(when ?? 0, offset ?? 0); else start(when ?? 0, offset ?? 0, duration);
        };
        return source;
      }
    };
  });
  await open(page, "bubble-wrap");
  const energies = () => page.evaluate(() => (window as typeof window & { popEnergy: number[] }).popEnergy);
  expect(await energies()).toEqual([]);
  const bubble = page.locator(".bubble-cell").first();
  await bubble.click(); await bubble.click();
  expect(await energies()).toHaveLength(1);
  expect((await energies())[0]).toBeGreaterThan(.1);
  expect(await page.evaluate(() => (window as typeof window & { popContexts: AudioContext[] }).popContexts[0].state)).toBe("running");
  await page.getByRole("checkbox", { name: "Pop sound", exact: true }).uncheck();
  await page.getByRole("button", { name: "Bubble 2", exact: true }).click();
  expect(await energies()).toHaveLength(1);
  await page.getByRole("button", { name: "Reset bubble wrap", exact: true }).click();
  await expect(page.locator('.bubble-cell[aria-pressed="true"]')).toHaveCount(0);
});

test("elemental contours move continuously and settle under reduced motion", async ({ page }) => {
  await open(page, "emberling");
  const fire = page.locator('.emberling[data-variant="ember"]'), shape = fire.locator(".emberling-shell");
  await expect(fire).toHaveAttribute("data-motion", "running");
  const initial = await shape.getAttribute("d");
  await page.waitForTimeout(350);
  expect(await shape.getAttribute("d")).not.toBe(initial);
  await expect(page.locator('.emberling[data-variant="water"]')).toBeVisible();
  await expect(page.locator('.emberling[data-variant="aqua"]')).toBeVisible();
  await page.getByRole("button", { name: "Change Fire expression", exact: true }).press("Enter");
  await expect(fire).toHaveAttribute("data-expression", "calm");
  await page.getByLabel("Body style", { exact: true }).selectOption("orb");
  await expect(fire).toHaveAttribute("data-shape", "orb");
  const material = fire.locator(".elemental-orb-layer .shader-canvas");
  await expect(material).toHaveAttribute("data-renderer", "webgl2");
  const flowing = await material.screenshot();
  await page.waitForTimeout(350);
  expect((await material.screenshot()).equals(flowing)).toBe(false);
  await page.locator(".emberling-figures").screenshot({ path: `${captures}/elemental-fluid-orbs.png` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(fire).toHaveAttribute("data-motion", "reduced");
  const still = await shape.getAttribute("d");
  await page.waitForTimeout(350);
  expect(await shape.getAttribute("d")).toBe(still);
});

for (const slug of ["island-player", "neon-pill-player"]) test(`${slug} meter follows real audio and stops after pause and mute`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, slug);
  const player = page.locator(`.${slug}`);
  if (slug === "neon-pill-player") await player.hover();
  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await player.getByRole("slider", { name: "Track progress", exact: true }).inputValue())).toBeGreaterThan(.5);
  const bars = () => player.locator(".creative-equalizer i").evaluateAll((elements) => elements.map((element) => Number((element as HTMLElement).style.getPropertyValue("--bar"))));
  const samples = [];
  for (let frame = 0; frame < 6; frame++) { samples.push(await bars()); await page.waitForTimeout(160); }
  await mkdir(captures, { recursive: true });
  await player.screenshot({ path: `${captures}/${slug}-playing.png` });
  await writeFile(`${captures}/${slug}-audio.json`, JSON.stringify({ samples, currentTime: await player.getByRole("slider", { name: "Track progress", exact: true }).inputValue() }, null, 2));
  expect(new Set(samples.map((sample) => sample.join(","))).size).toBeGreaterThan(3);
  expect(Math.max(...samples.flat())).toBeGreaterThan(.35);
  await player.getByRole("button", { name: "Mute", exact: true }).click();
  await page.waitForTimeout(800);
  const muted = await bars(); await page.waitForTimeout(220);
  expect((await bars()).every((value, index) => Math.abs(value - muted[index]) < .01)).toBe(true);
  await player.getByRole("button", { name: "Unmute", exact: true }).click();
  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await page.waitForTimeout(800);
  const paused = await bars(); await page.waitForTimeout(220);
  expect((await bars()).every((value, index) => Math.abs(value - paused[index]) < .01)).toBe(true);
});

test("human avatar randomization changes the actual portrait and its seed", async ({ page }) => {
  await open(page, "human-avatar");
  const portrait = page.locator(".human-avatar-hero svg"), seed = page.getByRole("textbox", { name: "Avatar seed", exact: true });
  const beforeSeed = await seed.inputValue(), beforeHair = await portrait.getAttribute("data-hair");
  await page.getByRole("button", { name: "Randomize avatar", exact: true }).click();
  await expect(seed).not.toHaveValue(beforeSeed);
  await expect(portrait).not.toHaveAttribute("data-hair", beforeHair!);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("human-avatar.svg");
});

test("dock magnifies with separate layout slots and keyboard navigation", async ({ page }) => {
  await open(page, "floating-dock");
  const items = page.locator(".floating-dock li"), palette = page.getByRole("button", { name: "Palette", exact: true });
  const before = (await palette.boundingBox())!.width;
  await palette.hover(); await page.waitForTimeout(600);
  expect((await palette.boundingBox())!.width).toBeGreaterThan(before + 12);
  const boxes = await items.evaluateAll((nodes) => nodes.map((node) => ({ x: node.getBoundingClientRect().x, right: node.getBoundingClientRect().right })));
  for (let index = 0; index < boxes.length - 1; index++) expect(boxes[index].right).toBeLessThan(boxes[index + 1].x);
  await palette.focus(); await palette.press("ArrowRight");
  const music = page.getByRole("button", { name: "Music", exact: true });
  await expect(music).toBeFocused(); await music.press("Enter");
  await expect(music).toHaveAttribute("aria-pressed", "true");
});

test("garland stays transparent and every clip meets its wire", async ({ page }) => {
  await open(page, "photo-garland");
  await expect(page.locator(".photo-garland")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  const gaps = await page.locator(".garland-row").evaluateAll((rows) => rows.flatMap((row) => {
    const path = row.querySelector<SVGPathElement>('path[vector-effect="non-scaling-stroke"]')!;
    return Array.from(row.querySelectorAll<HTMLElement>(".garland-photo")).map((photo) => {
      const targetX = photo.offsetLeft / row.clientWidth * 1000;
      let start = 0, end = path.getTotalLength();
      for (let step = 0; step < 24; step++) { const middle = (start + end) / 2; if (path.getPointAtLength(middle).x < targetX) start = middle; else end = middle; }
      return Math.abs((photo.offsetTop - 12) / 80 * 100 - path.getPointAtLength((start + end) / 2).y);
    });
  }));
  expect(Math.max(...gaps)).toBeLessThan(2);
});

for (const slug of ["vinyl-player", "wave-player"]) test(`${slug} plays, seeks, changes tracks and exposes its real controls`, async ({ page }) => {
  await open(page, slug);
  const player = page.locator(`.${slug}`), slider = player.getByRole("slider", { name: "Track progress" });
  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(.5);
  await slider.focus(); await slider.press("ArrowRight");
  const title = await player.locator(slug === "vinyl-player" ? ".vinyl-copy > strong" : ".wave-main strong").textContent();
  await player.getByRole("button", { name: "Next track", exact: true }).click();
  await expect(player.locator(slug === "vinyl-player" ? ".vinyl-copy > strong" : ".wave-main strong")).not.toHaveText(title!);
  if (slug === "wave-player") {
    await player.getByRole("button", { name: "Add to favourites" }).click();
    await expect(player.getByRole("button", { name: "Remove from favourites" })).toHaveAttribute("aria-pressed", "true");
    await player.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(player.getByRole("button", { name: "Unmute", exact: true })).toHaveAttribute("aria-pressed", "true");
    await player.getByRole("button", { name: "Choose audio output for This device" }).click();
    await expect(player.getByRole("status")).toContainText("output");
  }
  await player.getByRole("button", { name: "Pause", exact: true }).click();
});

test("orb moves at rest, reads actual audio energy, and respects pause", async ({ page }) => {
  await page.addInitScript(() => {
    const original = AnalyserNode.prototype.getByteFrequencyData;
    (window as typeof window & { orbReads: number; orbPeak: number }).orbReads = 0;
    (window as typeof window & { orbReads: number; orbPeak: number }).orbPeak = 0;
    AnalyserNode.prototype.getByteFrequencyData = function(array) {
      original.call(this, array);
      const state = window as typeof window & { orbReads: number; orbPeak: number };
      state.orbReads++; state.orbPeak = Math.max(state.orbPeak, ...array);
    };
  });
  await open(page, "audio-orb");
  const orb = page.locator(".audio-orb .shader-canvas");
  await expect(orb).toHaveAttribute("data-renderer", "webgl2");
  const quiet = await orb.screenshot(); await page.waitForTimeout(400);
  expect((await orb.screenshot()).equals(quiet)).toBe(false);
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { orbPeak: number }).orbPeak)).toBeGreaterThan(50);
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.waitForTimeout(200);
  const reads = await page.evaluate(() => (window as typeof window & { orbReads: number }).orbReads);
  await page.waitForTimeout(200); expect(await page.evaluate(() => (window as typeof window & { orbReads: number }).orbReads)).toBe(reads);
  await page.getByRole("checkbox", { name: "Pause orb animation" }).check(); await page.waitForTimeout(100);
  const still = await orb.screenshot(); await page.waitForTimeout(300);
  expect((await orb.screenshot()).equals(still)).toBe(true);
});

test("garland adds photographs without collisions between rows", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await open(page, "photo-garland");
    await expect(page.locator(".garland-photo")).toHaveCount(12);
    const rows = await page.locator(".garland-row").evaluateAll((rows) => rows.map((row) => Array.from(row.querySelectorAll(".garland-photo")).map((photo) => { const r = photo.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; })));
    for (let i = 0; i < rows.length - 1; i++) expect(Math.max(...rows[i].map((r) => r.bottom))).toBeLessThan(Math.min(...rows[i + 1].map((r) => r.top)));
  }
});

test("sheet spacing and neutral focus remain usable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("orangeui-accent", "#e11d48"));
  await open(page, "sheet");
  await page.getByRole("button", { name: "Workspace preferences" }).click();
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible();
  await panel.screenshot({ path: `${captures}/sheet-open.png` });
  await expect(panel.locator(".ui-overlay-body")).toHaveCSS("gap", "28px");
  await panel.getByRole("button", { name: "Close panel" }).click();
  await open(page, "input");
  const input = page.getByRole("textbox").first(); await input.focus();
  const color = await input.evaluate((element) => getComputedStyle(element).outlineColor);
  expect(color).not.toBe("rgb(225, 29, 72)");
});
