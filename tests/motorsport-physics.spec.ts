import { expect, test, type Locator, type Page } from "@playwright/test";

/** Keep controls and previews together while sampling live motion. */
test.use({ viewport: { width: 1440, height: 1080 } });

const ui = {
  demo: "live-demo", editor: "Customize your livery", motionTab: "Motion",
  speed: "Speed", accelerate: "Accelerate", brake: "Brake to stop",
  lean: "Corner lean", wheelie: "Wheelie on launch",
  start: "Start sequence", restart: "Restart sequence", reset: "Reset lights",
  interval: "Light interval", progress: "Progress", progressVehicle: "Progress vehicle",
  advance: "Advance progress", startAgain: "Start again", progressName: "Pit lane preparation",
} as const;

const vehicles = [
  { slug: "open-wheel-car", host: ".open-wheel-car", radius: .34, maxSpeed: 70, pixelsPerMeter: 100 },
  { slug: "superbike", host: ".superbike", radius: .32, maxSpeed: 60, pixelsPerMeter: 200 },
] as const;

const cssNames = ["velocity", "acceleration", "travel", "wheel-angle", "body-pitch", "pitch", "wheel-blur", "wheel-spokes", "lean", "wheelie", "road-offset", "marking-offset", "background-offset", "far-background-offset"] as const;
type Telemetry = Record<typeof cssNames[number], number>;

async function telemetry(svg: Locator): Promise<Telemetry> {
  return svg.evaluate((element, names) => Object.fromEntries(names.map((name) => [name, Number.parseFloat((element as SVGElement).style.getPropertyValue(`--vehicle-${name}`))])) as Telemetry, [...cssNames]);
}

async function frames(svg: Locator, count = 40): Promise<Telemetry[]> {
  return svg.evaluate(async (element, { names, count }) => {
    const result: Record<string, number>[] = [];
    for (let frame = 0; frame < count; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      result.push(Object.fromEntries(names.map((name) => [name, Number.parseFloat((element as SVGElement).style.getPropertyValue(`--vehicle-${name}`))])));
    }
    return result as Telemetry[];
  }, { names: [...cssNames], count });
}

async function openVehicle(page: Page, vehicle: typeof vehicles[number]) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/components/${vehicle.slug}?style=polished`);
  const editor = page.getByTestId(ui.demo).getByRole("region", { name: ui.editor, exact: true });
  await expect(editor).toBeVisible();
  await editor.getByRole("tab", { name: ui.motionTab, exact: true }).click();
  const svg = editor.locator(`.artwork-customizer-artwork ${vehicle.host}`);
  await svg.scrollIntoViewIfNeeded();
  await expect(svg).toHaveAttribute("data-motion", "running");
  await expect.poll(async () => (await telemetry(svg)).velocity, { timeout: 20_000 }).toBeGreaterThan(0);
  return { editor, svg };
}

async function activate(editor: Locator, name: string) {
  const button = editor.getByRole("button", { name, exact: true });
  await button.focus();
  await button.press("Enter");
}

function assertWheelPhase(frame: Telemetry, radius: number) {
  const expected = ((frame.travel / radius * 180 / Math.PI) % 360 + 360) % 360;
  const error = Math.abs(((frame["wheel-angle"] - expected + 540) % 360) - 180);
  // CSS rounds travel to five decimals before it is read back.
  expect(error).toBeLessThan(.005);
}

function assertTrackPhase(frame: Telemetry, pixelsPerMeter: number) {
  for (const [name, factor, period] of [["road-offset", 1, 160], ["marking-offset", 1, 240], ["background-offset", .12, 640], ["far-background-offset", .045, 640]] as const) {
    const expected = -(frame.travel * pixelsPerMeter * factor % period);
    const error = Math.abs(((frame[name] - expected + period * 1.5) % period) - period / 2);
    expect(error).toBeLessThan(.002);
  }
}

for (const vehicle of vehicles) {
  test(`${vehicle.slug}: keyboard throttle and brake drive physical travel, wheel phase and suspension`, async ({ page }) => {
    const { editor, svg } = await openVehicle(page, vehicle);
    await activate(editor, ui.brake);
    await svg.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await telemetry(svg)).velocity, { timeout: 15_000 }).toBe(0);
    const start = await telemetry(svg);
    const wheelBefore = await svg.locator(".vehicle-wheel-rotor").first().evaluate((element) => getComputedStyle(element).transform);
    await activate(editor, ui.accelerate);
    await svg.scrollIntoViewIfNeeded();
    const accelerating = await frames(svg);
    expect(accelerating.some((frame) => frame.acceleration > 0)).toBe(true);
    expect(accelerating.some((frame) => frame["body-pitch"] < -.01)).toBe(true);
    expect(accelerating.at(-1)!.travel).toBeGreaterThan(start.travel);
    for (let index = 0; index < accelerating.length; index++) {
      const frame = accelerating[index];
      expect(Object.values(frame).every(Number.isFinite)).toBe(true);
      expect(frame.velocity).toBeGreaterThanOrEqual(0);
      expect(frame.velocity).toBeLessThanOrEqual(vehicle.maxSpeed);
      expect(frame["wheel-blur"] + frame["wheel-spokes"]).toBeCloseTo(1, 4);
      assertWheelPhase(frame, vehicle.radius);
      assertTrackPhase(frame, vehicle.pixelsPerMeter);
      if (index) expect(frame.travel).toBeGreaterThanOrEqual(accelerating[index - 1].travel);
    }
    expect(await svg.locator(".vehicle-wheel-rotor").first().evaluate((element) => getComputedStyle(element).transform)).not.toBe(wheelBefore);
    await expect.poll(async () => (await telemetry(svg)).velocity, { timeout: 10_000 }).toBeGreaterThan(vehicle.maxSpeed * .45);
    await expect.poll(() => svg.locator(".vehicle-wheel-blur").first().evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
    expect(await svg.locator(".vehicle-wheel-crisp").first().evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(0);
    const trackErrors = await svg.evaluate((element) => ["road", "markings", "background", "far-background"].map((name) => {
      const attribute = name === "markings" ? "marking" : name;
      const expected = parseFloat((element as SVGElement).style.getPropertyValue(`--vehicle-${attribute}-offset`));
      return Math.abs(new DOMMatrix(getComputedStyle(element.querySelector(`.vehicle-${name}`)!).transform).e - expected);
    }));
    expect(Math.max(...trackErrors)).toBeLessThan(.002);
    await activate(editor, ui.brake);
    await svg.scrollIntoViewIfNeeded();
    const braking = await frames(svg);
    expect(braking.some((frame) => frame.acceleration < 0)).toBe(true);
    expect(braking.some((frame) => frame["body-pitch"] > .01)).toBe(true);
    await expect.poll(async () => (await telemetry(svg)).velocity, { timeout: 15_000 }).toBe(0);
    const stopped = await frames(svg, 8);
    expect(stopped.at(-1)!.travel).toBe(stopped[0].travel);
    expect(stopped.at(-1)!["wheel-angle"]).toBe(stopped[0]["wheel-angle"]);
    await editor.getByRole("slider", { name: ui.speed, exact: true }).press("End");
    await expect(editor.getByRole("slider", { name: ui.speed, exact: true })).toHaveValue("1");
  });

  test(`${vehicle.slug}: offscreen pauses travel and reduced motion holds a neutral pose`, async ({ page }) => {
    const { editor, svg } = await openVehicle(page, vehicle);
    await expect.poll(async () => (await telemetry(svg)).velocity).toBeGreaterThan(2);
    // Documentation extends below the demo; use actual scrolling and the real observer.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(svg).toHaveAttribute("data-motion", "paused");
    const paused = await telemetry(svg);
    await page.waitForTimeout(300);
    expect(await telemetry(svg)).toEqual(paused);
    await svg.scrollIntoViewIfNeeded();
    await expect(svg).toHaveAttribute("data-motion", "running");
    await expect.poll(async () => (await telemetry(svg)).travel).toBeGreaterThan(paused.travel);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(svg).toHaveAttribute("data-motion", "reduced");
    const reduced = await telemetry(svg);
    expect(reduced.velocity).toBe(0);
    expect(reduced.pitch).toBe(0);
    expect(reduced.lean).toBe(0);
    expect(reduced.wheelie).toBe(0);
    expect(reduced["wheel-blur"]).toBe(0);
    await activate(editor, ui.accelerate);
    await page.waitForTimeout(300);
    expect(await telemetry(svg)).toEqual(reduced);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await svg.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await telemetry(svg)).travel).toBeGreaterThan(reduced.travel);
  });
}

test("superbike: keyboard lean controls and one launch wheelie articulate the bike", async ({ page }) => {
  const { editor, svg } = await openVehicle(page, vehicles[1]);
  const lean = editor.getByRole("slider", { name: ui.lean, exact: true });
  await lean.press("End");
  await expect(lean).toHaveValue("1");
  await svg.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await telemetry(svg)).lean).toBeGreaterThan(20);
  await lean.press("Home");
  await expect(lean).toHaveValue("-1");
  await svg.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await telemetry(svg)).lean).toBeLessThan(-20);
  await activate(editor, ui.brake);
  await svg.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await telemetry(svg)).velocity, { timeout: 15_000 }).toBe(0);
  await editor.getByRole("checkbox", { name: ui.wheelie, exact: true }).check();
  await activate(editor, ui.accelerate);
  await svg.scrollIntoViewIfNeeded();
  const launch = await frames(svg, 60);
  expect(launch.some((frame) => frame.wheelie > 1)).toBe(true);
  expect(launch.every((frame) => frame.pitch <= frame["body-pitch"] + .001)).toBe(true);
  await expect.poll(async () => (await telemetry(svg)).wheelie, { timeout: 10_000 }).toBeLessThan(.1);
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`race start lights: complete all five discrete lights with ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/components/race-start-lights?style=polished");
    const demo = page.getByTestId(ui.demo), lights = demo.locator(".race-start-lights");
    await lights.scrollIntoViewIfNeeded();
    await expect(lights).toHaveAttribute("data-phase", "idle");
    await expect(demo.getByRole("button", { name: ui.reset, exact: true })).toBeDisabled();
    await activate(demo, ui.start);
    for (let lit = 1; lit <= 5; lit++) await expect(lights.locator('[data-lit="true"]')).toHaveCount(lit, { timeout: 2_000 });
    await expect(lights).toHaveAttribute("data-phase", "ready");
    await expect(lights).toHaveAttribute("data-phase", "go", { timeout: 2_000 });
    await expect(lights.locator('[data-lit="true"]')).toHaveCount(0);
    await expect(lights.getByRole("status")).toHaveText("Go");
    if (reducedMotion === "reduce") await expect(lights).toHaveAttribute("data-motion", "reduced");
    await activate(demo, ui.restart);
    await expect(lights.locator('[data-lit="true"]')).toHaveCount(1);
    await activate(demo, ui.reset);
    await expect(lights).toHaveAttribute("data-phase", "idle");
    await expect(lights.locator('[data-lit="true"]')).toHaveCount(0);
  });
}

test("race start lights: offscreen time does not advance the countdown", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/race-start-lights?style=polished");
  const demo = page.getByTestId(ui.demo), lights = demo.locator(".race-start-lights");
  await demo.getByRole("slider", { name: ui.interval, exact: true }).press("End");
  await expect(demo.getByRole("slider", { name: ui.interval, exact: true })).toHaveValue("1500");
  await activate(demo, ui.start);
  await lights.scrollIntoViewIfNeeded();
  await expect(lights.locator('[data-lit="true"]')).toHaveCount(1);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(lights).toHaveAttribute("data-motion", "paused");
  const pausedCount = await lights.locator('[data-lit="true"]').count();
  await page.waitForTimeout(1700);
  await expect(lights.locator('[data-lit="true"]')).toHaveCount(pausedCount);
  await lights.scrollIntoViewIfNeeded();
  await expect(lights.locator('[data-lit="true"]')).toHaveCount(pausedCount + 1, { timeout: 2_000 });
});

test("race progress: keyboard endpoints preserve values and keep both vehicles inside the stage", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/race-progress?style=polished");
  const demo = page.getByTestId(ui.demo);
  const slider = demo.getByRole("slider", { name: ui.progress, exact: true });
  const progress = demo.getByRole("progressbar", { name: ui.progressName, exact: true });
  await expect(progress).toHaveAttribute("aria-valuenow", "42");
  for (const vehicle of ["car", "bike"]) {
    await demo.getByRole("combobox", { name: ui.progressVehicle, exact: true }).selectOption(vehicle);
    await expect(demo.locator(".race-progress-vehicle")).toHaveAttribute("data-vehicle", vehicle);
    for (const [key, value] of [["Home", 0], ["End", 100]] as const) {
      await slider.press(key);
      await expect(progress).toHaveAttribute("aria-valuenow", String(value));
      await expect(progress).toHaveAttribute("aria-valuetext", `${value}% complete`);
      const bounds = await progress.evaluate((stage) => {
        const rect = stage.getBoundingClientRect(), icon = stage.querySelector(".race-progress-vehicle-art")!.getBoundingClientRect();
        return { start: icon.left - rect.left, end: rect.right - icon.right };
      });
      expect(bounds.start).toBeGreaterThanOrEqual(-1);
      expect(bounds.end).toBeGreaterThanOrEqual(-1);
    }
  }
  await expect(demo.getByRole("button", { name: ui.advance, exact: true })).toBeDisabled();
  await activate(demo, ui.startAgain);
  await expect(progress).toHaveAttribute("aria-valuenow", "0");
  await activate(demo, ui.advance);
  await expect(progress).toHaveAttribute("aria-valuenow", "20");
});
