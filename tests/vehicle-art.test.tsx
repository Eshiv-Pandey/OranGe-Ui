import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareSvgExport } from "../components/ui/svg-export";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { OpenWheelCar } from "../components/ui/open-wheel-car";
import { Superbike } from "../components/ui/superbike";
import { OPEN_WHEEL_GEOMETRY, openWheelCarToSvgString } from "../components/ui/open-wheel-car-art";
import { SUPERBIKE_GEOMETRY, bikeRiderArmPath, bikeRiderTorsoPath, superbikeToSvgString } from "../components/ui/superbike-art";
import { generateVehicleConfig, normalizeVehicleConfig, vehicleColor } from "../components/ui/vehicle-art";
import { updateBikeJoints, updateCarJoints } from "../components/ui/vehicle-render-motion";
import { createVehicleMotion, getVehicleMotionFrame } from "../components/ui/vehicle-motion";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
});

function normalizedBody(svg: string) {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
  let markup = document.documentElement.innerHTML;
  ids.sort((a, b) => b.length - a.length).forEach((id, index) => { markup = markup.replaceAll(id, `local-${index}`); });
  return markup;
}

describe("original vehicle artwork", () => {
  it("generates deterministic livery identities and validates saved inputs", () => {
    const sample = generateVehicleConfig("velocity");
    expect(generateVehicleConfig("velocity")).toEqual(sample);
    expect(generateVehicleConfig("another")).not.toEqual(sample);
    expect(vehicleColor(" #aBc ", "#000000")).toBe("#aabbcc");
    expect(normalizeVehicleConfig({ version: 2 })).toEqual(generateVehicleConfig());
    const value = normalizeVehicleConfig({ number: '\"><script>bad</script>', tireCompound: "outside", livery: { base: "url(https://example.com)", accent: "#AbC", stripe: '" onload="bad', pattern: "bad" } });
    expect(value.livery.accent).toBe("#aabbcc");
    expect(openWheelCarToSvgString(value)).not.toMatch(/<script|onload=|example.com/);
    expect(normalizeVehicleConfig({ number: 247 }).number).toBe("247");
  });

  it("keeps geometry scales, rolling radii and wheelbases physically consistent", () => {
    for (const geometry of [OPEN_WHEEL_GEOMETRY, SUPERBIKE_GEOMETRY]) {
      expect(geometry.frontAxle.y + geometry.wheelRadius).toBe(geometry.ground);
      expect(geometry.rearAxle.y + geometry.wheelRadius).toBe(geometry.ground);
      expect((geometry.frontAxle.x - geometry.rearAxle.x) / geometry.pixelsPerMeter).toBe(geometry.wheelbase);
    }
    expect(OPEN_WHEEL_GEOMETRY.wheelRadius / OPEN_WHEEL_GEOMETRY.pixelsPerMeter).toBe(.34);
    expect(SUPERBIKE_GEOMETRY.wheelRadius / SUPERBIKE_GEOMETRY.pixelsPerMeter).toBe(.32);
  });

  it("exports valid self-contained SVG in every appearance and theme", () => {
    for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) for (const render of [openWheelCarToSvgString, superbikeToSvgString]) {
      const svg = render(generateVehicleConfig("export"), 640, { appearance, theme });
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");
      expect(document.querySelector("parsererror")).toBeNull();
      const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect([...svg.matchAll(/url\(#([^)]*)\)/g)].every((match) => ids.includes(match[1]))).toBe(true);
      expect(svg).not.toMatch(/var\(|<animate|<script|<image|currentColor/);
    }
  });

  it("matches settled component geometry to its portable helper", () => {
    const config = generateVehicleConfig("same-in-export");
    for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) {
      expect(normalizedBody(prepareSvgExport(renderToStaticMarkup(<OpenWheelCar config={config} speed={0} appearance={appearance} theme={theme} />)))).toBe(normalizedBody(openWheelCarToSvgString(config, 640, { appearance, theme })));
      expect(normalizedBody(prepareSvgExport(renderToStaticMarkup(<Superbike config={config} speed={0} appearance={appearance} theme={theme} />)))).toBe(normalizedBody(superbikeToSvgString(config, 640, { appearance, theme })));
    }
  });

  it("keeps spoke texture entirely inside the fading crisp layer", () => {
    const svg = superbikeToSvgString(generateVehicleConfig("wet"));
    const document = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(document.querySelectorAll(".vehicle-wheel")).toHaveLength(2);
    for (const wheel of document.querySelectorAll(".vehicle-wheel")) {
      expect(wheel.querySelector(".vehicle-wheel-rotor")?.closest(".vehicle-wheel-crisp")).not.toBeNull();
      expect(wheel.querySelector(".vehicle-wheel-blur")?.getAttribute("opacity")).toBe("0");
    }
  });

  it("can omit the track without changing the stationary vehicle", () => {
    const svg = openWheelCarToSvgString(generateVehicleConfig(), 320, { track: false });
    expect(svg).toContain('width="320" height="130"');
    expect(svg).not.toContain('class="vehicle-road"');
    expect(svg).toContain('class="car-sprung-body"');
    expect(svg).toContain('class="vehicle-wheel');
  });

  it("isolates definitions and uses static reduced-motion images when mounted", () => {
    const { container } = render(<><OpenWheelCar speed={1} /><Superbike speed={1} wheelie /></>);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("data-motion", "reduced");
      expect(svg.style.getPropertyValue("--vehicle-speed")).toBe("0.00000");
      expect(svg.style.getPropertyValue("--vehicle-wheel-blur")).toBe("0.00000");
    }
  });
});

describe("articulated joint updates", () => {
  it("keeps the rider's grip and hips fixed while shoulders tuck", () => {
    expect(bikeRiderArmPath(0)).toMatch(/434 106$/);
    expect(bikeRiderArmPath(1)).toMatch(/434 106$/);
    expect(bikeRiderArmPath(0)).not.toBe(bikeRiderArmPath(1));
    expect(bikeRiderTorsoPath(0)).toMatch(/^M267 108/);
    expect(bikeRiderTorsoPath(1)).toMatch(/^M267 108/);
    expect(bikeRiderArmPath(Number.NaN)).toBe(bikeRiderArmPath(0));
  });

  it("keeps suspension wheel ends anchored while the car body pitches", () => {
    const { container } = render(<OpenWheelCar speed={0} />);
    const svg = container.querySelector("svg")!;
    const frame = { ...getVehicleMotionFrame(createVehicleMotion()), pitch: -4, bodyY: 3 };
    const original = svg.querySelector(".car-front-upper-link")!.getAttribute("d");
    updateCarJoints(svg, frame);
    expect(svg.querySelector(".car-front-upper-link")!.getAttribute("d")).not.toBe(original);
    expect(svg.querySelector(".car-front-upper-link")!.getAttribute("d")).toMatch(/L491 190$/);
    expect(svg.querySelector(".car-rear-lower-link")!.getAttribute("d")).toMatch(/L151 190$/);
  });

  it("compresses the rear shock and tucks the torso without a React render", () => {
    const { container } = render(<Superbike speed={0} />);
    const svg = container.querySelector("svg")!;
    updateBikeJoints(svg, { ...getVehicleMotionFrame(createVehicleMotion()), riderTuck: 1, rearSquat: 8 });
    expect(svg.querySelector(".bike-rider-torso")!.getAttribute("d")).toBe(bikeRiderTorsoPath(1));
    expect(svg.querySelector(".bike-rider-arm")!.getAttribute("d")).toBe(bikeRiderArmPath(1));
    expect(svg.querySelector(".bike-rear-shock")!.getAttribute("transform")).toContain("scale(1 0.7143)");
  });
});
