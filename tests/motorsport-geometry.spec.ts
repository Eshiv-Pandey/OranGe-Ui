import { expect, test, type Locator, type Page } from "@playwright/test";

async function openVehicle(page: Page, slug: "open-wheel-car" | "superbike") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`/components/${slug}?style=polished`);
  const editor = page.getByTestId("live-demo").getByRole("region", { name: "Customize your livery", exact: true });
  await expect(editor).toBeVisible();
  await editor.getByRole("tab", { name: "Motion", exact: true }).click();
  const svg = editor.locator(".artwork-customizer-artwork svg.motorsport-vehicle").first();
  await expect(svg).toHaveAttribute("data-motion", "running");
  await editor.getByRole("button", { name: "Brake to stop", exact: true }).click();
  await expect.poll(() => svg.evaluate((element) => parseFloat((element as SVGSVGElement).style.getPropertyValue("--vehicle-speed")))).toBeLessThan(.005);
  return { editor, svg };
}

async function sampleGeometry(svg: Locator, kind: "car" | "bike", duration = 900) {
  return svg.evaluate(async (element, settings) => {
    const root = element as SVGSVGElement;
    const samples: { bodyY: number; pitch: number; frontWing: number; rearWing: number; fork: number; shock: string; tuck: number; wheelie: number; frontMatrix: string; errors: number[]; headInside: boolean; blurInside: boolean; blur: number }[] = [];
    const started = performance.now();
    await new Promise<void>((resolve) => {
      function frame() {
        const style = root.style;
        const number = (name: string) => parseFloat(style.getPropertyValue(`--vehicle-${name}`)) || 0;
        const point = (node: SVGGraphicsElement, x: number, y: number) => new DOMPoint(x, y).matrixTransform(node.getScreenCTM()!);
        const distance = (a: DOMPoint, b: DOMPoint) => Math.hypot(a.x - b.x, a.y - b.y);
        const errors: number[] = [];
        if (settings.kind === "car") {
          const body = root.querySelector<SVGGElement>(".car-sprung-body")!;
          for (const [name, x, y, axle] of [["front-upper", 425, 174, 491], ["front-lower", 412, 204, 491], ["rear-upper", 211, 166, 151], ["rear-lower", 215, 204, 151]] as const) {
            const link = root.querySelector<SVGPathElement>(`.car-${name}-link`)!;
            const start = link.getPointAtLength(0), end = link.getPointAtLength(link.getTotalLength());
            errors.push(distance(point(link, start.x, start.y), point(body, x, y)), distance(point(link, end.x, end.y), point(root, axle, 190)));
          }
        } else {
          const rider = root.querySelector<SVGGElement>(".bike-rider")!;
          const arm = root.querySelector<SVGPathElement>(".bike-rider-arm")!, torso = root.querySelector<SVGPathElement>(".bike-rider-torso")!;
          const grip = arm.getPointAtLength(arm.getTotalLength()), hip = torso.getPointAtLength(0);
          errors.push(distance(point(arm, grip.x, grip.y), point(rider, 434, 106)), distance(point(torso, hip.x, hip.y), point(rider, 267, 108)));
          const lower = root.querySelector<SVGGElement>(".bike-fork-lower")!, assembly = root.querySelector<SVGGElement>(".bike-wheelie")!;
          errors.push(distance(point(lower, 480, 160), point(assembly, 480, 160)));
        }
        const bounds = root.getBoundingClientRect(), head = root.querySelector<SVGGElement>(".bike-rider-head")?.getBoundingClientRect();
        // Check actual filter spread remains within the tire envelope: radius + half stroke + 3 sigma.
        const blurInside = [...root.querySelectorAll<SVGGElement>(".vehicle-wheel")].every((wheel) => {
          const tire = wheel.querySelector<SVGCircleElement>("circle")!;
          return [...wheel.querySelectorAll<SVGCircleElement>(".vehicle-wheel-blur circle")].every((circle) => {
            const filter = circle.getAttribute("filter"), id = filter?.match(/#([^)]*)/)?.[1];
            const sigma = id ? Number(root.querySelector(`[id="${id}"] feGaussianBlur`)?.getAttribute("stdDeviation") ?? 0) : 0;
            const outer = circle.r.baseVal.value + Number(circle.getAttribute("stroke-width") ?? 0) / 2 + sigma * 3;
            return outer <= tire.r.baseVal.value + .05;
          });
        });
        samples.push({ bodyY: number("body-y"), pitch: number("pitch"), frontWing: number("front-wing"), rearWing: number("rear-wing"), fork: number("fork-compression"), shock: root.querySelector(".bike-rear-shock")?.getAttribute("transform") ?? "", tuck: number("rider-tuck"), wheelie: number("wheelie"), frontMatrix: getComputedStyle(root.querySelector(".bike-fork-upper") ?? root).transform, errors, headInside: !head || head.top >= bounds.top - 1 && head.bottom <= bounds.bottom + 1 && head.left >= bounds.left - 1 && head.right <= bounds.right + 1, blurInside, blur: number("wheel-blur") });
        if (performance.now() - started >= settings.duration) resolve(); else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return samples;
  }, { kind, duration });
}

test("car wishbones remain on wheel centers while the body pitches and wings flex", async ({ page }) => {
  const { editor, svg } = await openVehicle(page, "open-wheel-car");
  await editor.getByRole("button", { name: "Accelerate", exact: true }).click();
  const accelerating = await sampleGeometry(svg, "car", 1300);
  expect(accelerating.length).toBeGreaterThan(3);
  expect(Math.max(...accelerating.flatMap((sample) => sample.errors))).toBeLessThan(.05);
  expect(Math.max(...accelerating.map((sample) => Math.abs(sample.pitch)))).toBeGreaterThan(.05);
  expect(Math.max(...accelerating.map((sample) => Math.abs(sample.frontWing)))).toBeGreaterThan(.01);
  expect(Math.max(...accelerating.map((sample) => Math.abs(sample.rearWing)))).toBeGreaterThan(.01);
  expect(accelerating.every((sample) => sample.blurInside)).toBe(true);
  await expect.poll(() => svg.evaluate((element) => parseFloat((element as SVGSVGElement).style.getPropertyValue("--vehicle-wheel-blur")))).toBeGreaterThan(.3);
  await editor.getByRole("button", { name: "Brake to stop", exact: true }).click();
  const braking = await sampleGeometry(svg, "car");
  expect(Math.max(...braking.flatMap((sample) => sample.errors))).toBeLessThan(.05);
  expect(braking.every((sample) => sample.blurInside)).toBe(true);
});

test("bike fork, shock and rider joints stay connected through launch and braking", async ({ page }) => {
  const { editor, svg } = await openVehicle(page, "superbike");
  await editor.getByRole("checkbox", { name: "Wheelie on launch", exact: true }).check();
  await editor.getByRole("button", { name: "Accelerate", exact: true }).click();
  const launching = await sampleGeometry(svg, "bike", 1500);
  expect(launching.length).toBeGreaterThan(3);
  expect(Math.max(...launching.map((sample) => sample.wheelie))).toBeGreaterThan(.1);
  // The launch physics stays below 20 degrees; this tests rendered launch poses, not a fabricated override.
  expect(Math.max(...launching.map((sample) => sample.wheelie))).toBeLessThanOrEqual(20);
  expect(launching.every((sample) => sample.headInside && sample.blurInside)).toBe(true);
  expect(Math.max(...launching.flatMap((sample) => sample.errors))).toBeLessThan(.05);
  expect(new Set(launching.map((sample) => sample.shock)).size).toBeGreaterThan(1);
  expect(Math.max(...launching.map((sample) => sample.tuck))).toBeGreaterThan(.1);
  await editor.getByRole("button", { name: "Brake to stop", exact: true }).click();
  const braking = await sampleGeometry(svg, "bike", 1100);
  expect(Math.max(...braking.map((sample) => sample.fork))).toBeGreaterThan(.05);
  expect(new Set(braking.map((sample) => sample.frontMatrix)).size).toBeGreaterThan(1);
  expect(Math.max(...braking.flatMap((sample) => sample.errors))).toBeLessThan(.05);
  expect(braking.every((sample) => sample.headInside && sample.blurInside)).toBe(true);
});
