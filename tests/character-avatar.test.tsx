import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { CharacterAvatar } from "../components/ui/character-avatar";
import { CHARACTER_FACES, CHARACTER_GLASSES, CHARACTER_HAIR, CHARACTER_OUTFITS, characterSvgBody, characterToSvgString, generateCharacterConfig, normalizeCharacterConfig, type CharacterConfig, type CharacterParts } from "../components/ui/character-art";

afterEach(() => vi.unstubAllGlobals());

function parseSvg(svg: string) {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

function assertLocalDefinitions(svg: string) {
  const document = parseSvg(svg);
  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const reference of svg.matchAll(/url\(#([^)]*)\)/g)) expect(ids).toContain(reference[1]);
  expect(document.querySelectorAll("script,image,foreignObject,animate,animateTransform")).toHaveLength(0);
  return document;
}

function configsForEveryPart() {
  const base = generateCharacterConfig("part-coverage");
  const parts: Partial<CharacterParts>[] = [
    ...CHARACTER_HAIR.map((hair) => ({ hair })),
    ...CHARACTER_GLASSES.map((glasses) => ({ glasses })),
    ...CHARACTER_OUTFITS.map((outfit) => ({ outfit })),
    ...CHARACTER_FACES.map((face) => ({ face })),
    { accents: true, earring: true }, { accents: false, earring: false },
  ];
  return parts.map((part) => ({ ...base, parts: { ...base.parts, ...part } }));
}

describe("character identity and portable artwork", () => {
  it("generates deterministic independent identities and reaches every part without ambient randomness", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Identity must not use ambient randomness"); });
    const seen = { hair: new Set<string>(), glasses: new Set<string>(), outfit: new Set<string>(), face: new Set<string>() };
    try {
      for (let index = 0; index < 256; index += 1) {
        const seed = `character-${index}`;
        const config = generateCharacterConfig(seed);
        expect(generateCharacterConfig(seed)).toEqual(config);
        expect(normalizeCharacterConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
        for (const key of ["hair", "glasses", "outfit", "face"] as const) seen[key].add(config.parts[key]);
      }
      expect([...seen.hair].sort()).toEqual([...CHARACTER_HAIR].sort());
      expect([...seen.glasses].sort()).toEqual([...CHARACTER_GLASSES].sort());
      expect([...seen.outfit].sort()).toEqual([...CHARACTER_OUTFITS].sort());
      expect([...seen.face].sort()).toEqual([...CHARACTER_FACES].sort());
      expect(generateCharacterConfig(42)).toEqual(generateCharacterConfig("42"));
      const altered = generateCharacterConfig("copy");
      altered.colors.skin = "#000000";
      altered.parts.hair = altered.parts.hair === "crop" ? "coil" : "crop";
      expect(generateCharacterConfig("copy")).not.toEqual(altered);
    } finally { random.mockRestore(); }
  });

  it("whitelists saved colors and parts without mutating caller data or preserving injected markup", () => {
    const fallback = generateCharacterConfig();
    const input = {
      colors: { skin: " #AbC ", hair: " #12AB34 ", outfit: "url(https://example.invalid/paint)", eye: '\" onload="alert(1)', backgroundEnd: "red", extra: "<script>" },
      parts: { hair: "unknown", glasses: "none", outfit: "collar", face: "<path>", accents: false, earring: true, extra: "<script>" },
      extra: "<script>alert(1)</script>",
    };
    const normalized = normalizeCharacterConfig(input);
    expect(normalized.colors.skin).toBe("#aabbcc");
    expect(normalized.colors.hair).toBe("#12ab34");
    expect(normalized.colors.outfit).toBe(fallback.colors.outfit);
    expect(normalized.colors.eye).toBe(fallback.colors.eye);
    expect(normalized.colors.backgroundEnd).toBe(fallback.colors.backgroundEnd);
    expect(normalized.parts).toEqual({ ...fallback.parts, glasses: "none", outfit: "collar", accents: false, earring: true });
    expect(input.colors.skin).toBe(" #AbC ");
    expect(normalized.colors).not.toBe(input.colors);
    expect(normalized.parts).not.toBe(input.parts);
    expect(normalized).not.toHaveProperty("extra");
    expect(normalized.colors).not.toHaveProperty("extra");
    expect(normalized.parts).not.toHaveProperty("extra");
    expect(characterToSvgString(normalized)).not.toMatch(/<script|onload=|example\.invalid|url\(https/);
    for (const invalid of [null, [], false, "portrait", 17, { version: 2 }]) expect(normalizeCharacterConfig(invalid)).toEqual(fallback);
  });

  it.each(APPEARANCE_VALUES)("exports every part as a valid settled %s SVG", (appearance) => {
    for (const config of configsForEveryPart()) {
      const svg = characterToSvgString(config, 256, { appearance });
      const document = assertLocalDefinitions(svg);
      expect(document.documentElement.getAttribute("viewBox")).toBe("0 0 240 240");
      expect(document.documentElement.getAttribute("width")).toBe("256");
      expect(document.documentElement.getAttribute("height")).toBe("256");
      expect(svg).not.toMatch(/var\(|currentColor|NaN|Infinity/);
      expect(document.querySelectorAll(".character-pupil")).toHaveLength(2);
      expect(document.querySelectorAll(".character-blink")).toHaveLength(2);
      expect(document.querySelectorAll('clipPath[id*="-eye-"]')).toHaveLength(2);
      for (const layer of ["head", "hair-front", "hair-back", "shoulders", "neck", "glasses"]) expect(document.querySelector(`.character-${layer}`)).not.toBeNull();
      expect(document.querySelector(".character-glasses")?.children.length === 0).toBe(config.parts.glasses === "none");
    }
  });

  it("renders distinct geometry for every supported part value", () => {
    const base = generateCharacterConfig("geometry");
    for (const [key, values] of [["hair", CHARACTER_HAIR], ["glasses", CHARACTER_GLASSES], ["outfit", CHARACTER_OUTFITS], ["face", CHARACTER_FACES], ["accents", [false, true]], ["earring", [false, true]]] as const) {
      const artwork = new Set(values.map((value) => characterSvgBody({ ...base, parts: { ...base.parts, [key]: value } }, "same")));
      expect(artwork.size).toBe(values.length);
    }
  });

  it("encodes arbitrary namespaces without collisions or leaking ID markup", () => {
    const config = generateCharacterConfig("namespace");
    const ids: string[] = [];
    for (const id of [":r0:", ":r1:", "_3a_r0_3a_", "é", "_e9_", '\"><script>alert(1)</script>']) {
      const document = assertLocalDefinitions(characterToSvgString(config, 128, { id }));
      ids.push(...[...document.querySelectorAll("[id]")].map((element) => element.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps inline artwork themeable while bounding standalone export dimensions", () => {
    const config = generateCharacterConfig("theme");
    expect(characterSvgBody(config, "inline")).toContain(`var(--character-skin, ${config.colors.skin})`);
    expect(characterSvgBody(config, "inline")).toContain("var(--character-background-end,");
    expect(characterToSvgString(config)).toContain(config.colors.skin);
    for (const [size, expected] of [[Number.NaN, 256], [Infinity, 256], [-2, 16], [10000, 4096], [63.6, 64]]) {
      const svg = parseSvg(characterToSvgString(config, size));
      expect(svg.documentElement.getAttribute("width")).toBe(String(expected));
      expect(svg.documentElement.getAttribute("height")).toBe(String(expected));
    }
  });

  it("server-renders named, paused instances with unique definitions without window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const markup = renderToStaticMarkup(<><CharacterAvatar seed="ssr" appearance="terminal" size={64} /><CharacterAvatar seed="ssr" interactive={false} blink={false} size={Infinity} /></>);
    expect(markup).toContain('data-motion="paused"');
    expect(markup).toContain('data-appearance="terminal"');
    expect(markup).toContain('width="64"');
    expect(markup).toContain('width="240"');
    expect(markup).toContain('aria-label="Original illustrated character"');
    expect(markup).not.toMatch(/NaN|Infinity/);
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function motionBrowser() {
  let sequence = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const observers: { callback: IntersectionObserverCallback; target?: Element; active: boolean }[] = [];
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++sequence, callback); return sequence; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("IntersectionObserver", class {
    record: typeof observers[number];
    constructor(callback: IntersectionObserverCallback) { this.record = { callback, active: true }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    disconnect() { this.record.active = false; }
  });
  return {
    frames,
    visible(value: boolean) { observers.filter((observer) => observer.active).forEach((observer) => observer.callback([{ isIntersecting: value, target: observer.target } as IntersectionObserverEntry], {} as IntersectionObserver)); },
    frame(time: number) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(time)); },
  };
}

describe("CharacterAvatar component contract", () => {
  let browser: ReturnType<typeof motionBrowser>;
  beforeEach(() => { browser = motionBrowser(); });

  it("applies explicit overrides over saved identity, preserves saved values over seed, and leaves config unchanged", () => {
    const config: CharacterConfig = { ...generateCharacterConfig("saved"), colors: { ...generateCharacterConfig("saved").colors, hair: "#112233", outfit: "#445566" }, parts: { hair: "coil", face: "long", outfit: "collar", glasses: "none", accents: false, earring: false } };
    const before = JSON.stringify(config);
    const view = render(<CharacterAvatar config={config} seed="ignored-a" colors={{ skin: "#AbC" }} parts={{ glasses: "angular" }} size={72} appearance="pixel" className="portrait-test" aria-label="  Support teammate  " />);
    const svg = screen.getByRole("img", { name: "Support teammate" });
    expect(svg).toHaveClass("character-avatar", "portrait-test");
    expect(svg).toHaveAttribute("width", "72");
    expect(svg).toHaveAttribute("data-appearance", "pixel");
    expect(svg.innerHTML).toContain("var(--character-skin, #aabbcc)");
    expect(svg.innerHTML).toContain("var(--character-hair, #112233)");
    expect(svg.innerHTML).toContain("var(--character-outfit, #445566)");
    expect(svg.querySelector(".character-glasses")?.children.length).toBeGreaterThan(0);
    const identity = svg.innerHTML;
    view.rerender(<CharacterAvatar config={config} seed="ignored-b" colors={{ skin: "#AbC" }} parts={{ glasses: "angular" }} size={72} appearance="pixel" />);
    expect(svg.innerHTML).toBe(identity);
    expect(JSON.stringify(config)).toBe(before);
    expect(screen.queryByRole("button")).toBeNull();
    expect(svg).not.toHaveAttribute("tabindex");
  });

  it("regenerates from a changed seed when no saved config is provided and namespaces mounted instances", () => {
    const view = render(<><CharacterAvatar seed="first" /><CharacterAvatar seed="first" /></>);
    const images = screen.getAllByRole("img");
    const before = images[0].innerHTML;
    const ids = [...view.container.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    view.rerender(<><CharacterAvatar seed="second" /><CharacterAvatar seed="first" /></>);
    expect(images[0].innerHTML).not.toBe(before);
    expect(images[0].innerHTML).toContain(generateCharacterConfig("second").colors.skin);
  });

  it("connects pointer gaze to the SVG host and keeps blink disabled", () => {
    render(<CharacterAvatar blink={false} />);
    const svg = screen.getByRole("img") as unknown as SVGSVGElement;
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, width: 200, height: 200 } as DOMRect);
    expect(svg).toHaveAttribute("data-motion", "paused");
    expect(browser.frames.size).toBe(0);
    act(() => { browser.visible(true); browser.frame(0); fireEvent.pointerMove(window, { clientX: 500, clientY: -100 }); });
    act(() => { for (let time = 16; time <= 320; time += 16) browser.frame(time); });
    expect(Number(svg.style.getPropertyValue("--gaze-x"))).toBeGreaterThan(0.9);
    expect(Number(svg.style.getPropertyValue("--gaze-y"))).toBeLessThan(-0.9);
    expect(Number(svg.style.getPropertyValue("--blink-scale"))).toBe(1);
    act(() => browser.visible(false));
    expect(svg).toHaveAttribute("data-motion", "paused");
    expect(browser.frames.size).toBe(0);
  });

  it("ignores pointer input when passive and gives identical seeds matching idle gaze and blink", () => {
    render(<><CharacterAvatar seed="shared-idle" interactive={false} /><CharacterAvatar seed="shared-idle" interactive={false} /></>);
    const images = screen.getAllByRole("img") as unknown as SVGSVGElement[];
    for (const svg of images) vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 200 } as DOMRect);
    act(() => { browser.visible(true); browser.frame(0); fireEvent.pointerMove(window, { clientX: 600, clientY: 600 }); });
    const poses = new Set<string>();
    for (let time = 50; time <= 4500; time += 50) {
      act(() => browser.frame(time));
      const posesAtFrame = images.map((svg) => ["--gaze-x", "--gaze-y", "--blink-scale"].map((name) => svg.style.getPropertyValue(name)).join(","));
      expect(posesAtFrame[0]).toBe(posesAtFrame[1]);
      if (time < 3000) {
        expect(Number(images[0].style.getPropertyValue("--gaze-x"))).toBe(0);
        expect(Number(images[0].style.getPropertyValue("--gaze-y"))).toBe(0);
      }
      poses.add(posesAtFrame[0]);
    }
    expect(poses.size).toBeGreaterThan(3);
  });
});
