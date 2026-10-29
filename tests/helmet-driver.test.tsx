import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { Helmet } from "../components/ui/helmet";
import { MiniDriver } from "../components/ui/mini-driver";
import { generateHelmetConfig, helmetSvgBody, helmetToSvgString, normalizeHelmetConfig } from "../components/ui/helmet-art";
import { generateMiniDriverConfig, miniDriverToSvgString, normalizeMiniDriverConfig } from "../components/ui/mini-driver-art";

const intersections: Array<(visible: boolean) => void> = [];
beforeEach(() => {
  intersections.length = 0;
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersections.push((visible) => callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)); }
    observe() {} disconnect() {}
  });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});

describe("original helmet and miniature driver artwork", () => {
  it("generates stable, independent saved identities without ambient randomness", () => {
    for (const seed of ["amber", "247", "river", "", 42]) {
      expect(generateHelmetConfig(seed)).toEqual(generateHelmetConfig(seed));
      expect(generateMiniDriverConfig(seed)).toEqual(generateMiniDriverConfig(seed));
    }
    const value = generateHelmetConfig("amber"); value.colors.shell = "#ffffff";
    expect(generateHelmetConfig("amber").colors.shell).not.toBe("#ffffff");
    expect(generateHelmetConfig("amber")).not.toEqual(generateHelmetConfig("river"));
  });

  it("whitelists colors, part enums and short numbers before string rendering", () => {
    const helmet = normalizeHelmetConfig({ number: '\"><script>alert(1)</script>', colors: { shell: "url(https://example.com)", visor: "#AbC", trim: '" onload="bad' }, parts: { pattern: "bad", finish: "bad", vents: false, visorOpen: true } });
    expect(helmet.colors.visor).toBe("#aabbcc");
    expect(helmet.parts.vents).toBe(false);
    expect(helmet.parts.visorOpen).toBe(true);
    const svg = helmetToSvgString(helmet, 256, { id: '\"><script' });
    expect(svg).not.toMatch(/<script|onload=|https:\/\/example|url\(https/);
    expect(normalizeHelmetConfig({ number: 247 }).number).toBe("247");
    expect(normalizeHelmetConfig({ number: "007" }).number).toBe("007");
    expect(normalizeHelmetConfig({ number: "1000" }).number).toBe(generateHelmetConfig().number);
    expect(normalizeHelmetConfig({ version: 99 })).toEqual(generateHelmetConfig());
    expect(normalizeMiniDriverConfig({ version: 99 })).toEqual(generateMiniDriverConfig());
  });

  it("exports valid settled SVG for both components in every appearance", () => {
    for (const appearance of APPEARANCE_VALUES) for (const open of [false, true]) {
      const helmet = normalizeHelmetConfig({ ...generateHelmetConfig("export"), parts: { ...generateHelmetConfig("export").parts, visorOpen: open } });
      for (const svg of [helmetToSvgString(helmet, 240, { appearance }), miniDriverToSvgString({ ...generateMiniDriverConfig("export"), helmet }, 320, { appearance })]) {
        const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(doc.querySelector("parsererror")).toBeNull();
        const ids = [...doc.querySelectorAll("[id]")].map((node) => node.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect([...svg.matchAll(/url\(#([^)]*)\)/g)].every((match) => ids.includes(match[1]))).toBe(true);
        expect(svg).not.toMatch(/var\(|<animate|<script|<image|currentColor/);
      }
    }
  });

  it("preserves explicit appearance and color configuration without a browser", () => {
    const config = generateHelmetConfig("css-theme");
    expect(helmetSvgBody(config, "inline")).toContain("var(--helmet-shell,");
    expect(helmetToSvgString(config)).toContain(config.colors.shell);
    const markup = renderToStaticMarkup(<><Helmet seed="ssr" /><MiniDriver seed="ssr" size={320} /></>);
    expect(markup).toContain('viewBox="0 0 240 320"');
    expect(markup).toContain('data-motion="paused"');
    expect(markup).not.toContain("NaN");
    expect(helmetToSvgString(config, Number.NaN)).toContain('width="256"');
    expect(miniDriverToSvgString(generateMiniDriverConfig(), 320)).toContain('width="240" height="320"');
  });

  it("uses distinct definition IDs for every mounted instance", () => {
    const { container } = render(<><Helmet /><Helmet /><MiniDriver /><MiniDriver /></>);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("helmet and driver interaction", () => {
  it("flips the visor with native keyboard activation and exposes its state", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    render(<Helmet onVisorOpenChange={changed} />);
    const button = screen.getByRole("button", { name: `Motorsport helmet, number ${generateHelmetConfig().number}: open visor` });
    await user.tab(); expect(button).toHaveFocus(); await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAccessibleName(`Motorsport helmet, number ${generateHelmetConfig().number}: close visor`);
    expect(changed).toHaveBeenLastCalledWith(true);
    await user.keyboard(" "); expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("does not override a controlled visor state", () => {
    const changed = vi.fn();
    const { rerender } = render(<Helmet visorOpen={false} onVisorOpenChange={changed} />);
    const button = screen.getByRole("button"); fireEvent.click(button);
    expect(changed).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute("aria-pressed", "false");
    rerender(<Helmet visorOpen onVisorOpenChange={changed} />);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("replays a wave with a single shared gaze and lifecycle observer", async () => {
    const user = userEvent.setup(), wave = vi.fn();
    const { container } = render(<MiniDriver onWave={wave} />);
    expect(intersections).toHaveLength(1);
    const host = container.querySelector(".mini-driver")!;
    expect(host).toHaveAttribute("data-motion", "paused");
    act(() => intersections[0](true)); expect(host).toHaveAttribute("data-motion", "running");
    await user.tab(); await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("waves hello");
    expect(container.querySelector(".mini-driver-reacted")).not.toBeNull();
    await user.keyboard("{Enter}"); expect(screen.getByRole("status")).toHaveTextContent("waves again");
    expect(wave).toHaveBeenCalledTimes(2);
    act(() => intersections[0](false)); expect(host).toHaveAttribute("data-motion", "paused");
  });

  it("respects reduced motion and exposes a static image when interactivity is disabled", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const { container } = render(<><Helmet interactive={false} blink={false} /><MiniDriver interactive={false} /></>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    for (const host of container.querySelectorAll(".helmet, .mini-driver")) {
      expect(host).toHaveAttribute("data-motion", "reduced");
      expect((host as HTMLElement).style.getPropertyValue("--gaze-x")).toBe("0");
    }
  });
});
