import { describe, expect, it, vi } from "vitest";
import ts from "typescript";
import { DEFAULT_STICKER_OPTIONS } from "../lib/sticker-options";
import { boundStickerPlacement, normalizeStickerScene, stickerSceneHtml, stickerSceneJson, stickerSceneReact, type StickerPlacement, type StickerScene } from "../lib/sticker-scene";

const placement: StickerPlacement = { ...DEFAULT_STICKER_OPTIONS, id: "first", name: "woven-heart", x: 32.5, y: 44, size: 192, rotate: 15, motion: "wiggle", duration: 900, intensity: 1.5, shadow: false };
const scene: StickerScene = { caption: "A canvas of my own.", background: "#eeeaff", placements: [placement, { ...placement, id: "second", name: "side-b-vinyl", x: 72, y: 54, motion: "spin", finish: "playful" }] };

describe("portable sticker playground exports", () => {
  it("retains responsive positions, layer order, finish and edited animation in valid React code", () => {
    const source = stickerSceneReact(scene);
    const parsed = ts.createSourceFile("MyStickerCanvas.tsx", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
    const result = ts.transpileModule(source, { fileName: "MyStickerCanvas.tsx", compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
    expect(parsed.statements.length).toBeGreaterThan(2);
    expect(result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)).toEqual([]);
    expect(source).toContain('from "orangeui-stickers"');
    expect(source).toContain('import "orangeui-stickers/styles.css"');
    expect(source).toContain('aspectRatio: "960 / 600"');
    expect(source).toContain('left: "32.5%", top: "44%", width: "20%"');
    expect(source).toContain('motion="wiggle" duration={900} intensity={1.5} shadow={false} interactive');
    expect(source.indexOf('name="woven-heart"')).toBeLessThan(source.indexOf('name="side-b-vinyl"'));
    expect(source).not.toMatch(/next\/|\.\/orangeui|(?:NaN|Infinity)/);
  });

  it("creates a dependency-free HTML document with the same SVGs and click settings", () => {
    const source = stickerSceneHtml(scene), parsed = new DOMParser().parseFromString(source, "text/html");
    expect(parsed.querySelectorAll(".sticker-button")).toHaveLength(2);
    expect(parsed.querySelectorAll("svg")).toHaveLength(2);
    expect(parsed.querySelector(".sticker-caption")?.textContent).toBe(scene.caption);
    expect(parsed.querySelector(".sticker-position")?.getAttribute("style")).toContain("left:32.5%;top:44%;width:20%");
    const button = parsed.querySelector<HTMLButtonElement>(".sticker-button")!;
    expect(button.dataset).toMatchObject({ motion: "wiggle", duration: "900", intensity: "1.5" });
    expect(button.querySelector(".sticker-art")?.getAttribute("style")).toBe("filter:none");
    expect(parsed.querySelectorAll("script[src], link[href], image, foreignObject")).toHaveLength(0);
    const script = parsed.querySelector("script")!.textContent!;
    expect(script).toContain("prefers-reduced-motion: reduce");
    expect(script).toContain("art.getAnimations()");
    expect(() => new Function(script)).not.toThrow();
    const svg = parsed.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 128 128");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("escapes canvas text so export content cannot become code or HTML", () => {
    const malicious: StickerScene = { ...scene, caption: '</script><img src=x onerror="alert(1)"> & </p>' };
    const html = stickerSceneHtml(malicious), parsed = new DOMParser().parseFromString(html, "text/html");
    expect(parsed.querySelector(".sticker-caption")?.textContent).toBe(malicious.caption);
    expect(parsed.querySelectorAll("script")).toHaveLength(1);
    expect(parsed.querySelectorAll("img")).toHaveLength(0);
    const react = stickerSceneReact(malicious);
    expect(react).toContain("\\u003c/script\\u003e");
    expect(react).not.toContain('<img src=x');
  });

  it("runs exported click animations with each placement's settings and respects reduced motion", () => {
    function execute(reduced: boolean) {
      const document = new DOMParser().parseFromString(stickerSceneHtml({ ...scene, placements: [...scene.placements, { ...placement, id: "third", motion: "none" }, { ...placement, id: "fourth", motion: "bounce", intensity: 2 }] }), "text/html");
      const buttons = [...document.querySelectorAll<HTMLButtonElement>(".sticker-button")];
      const animations = buttons.map(button => {
        const artwork = button.querySelector<HTMLElement>(".sticker-art")!;
        const animate = vi.fn(() => ({} as Animation));
        artwork.animate = animate; artwork.getAnimations = () => [];
        return animate;
      });
      new Function("document", "window", document.querySelector("script")!.textContent!)(document, { matchMedia: () => ({ matches: reduced }) });
      buttons.forEach(button => button.click());
      return animations;
    }
    const animations = execute(false);
    expect(animations[0]).toHaveBeenCalledWith(expect.arrayContaining([{ transform: "rotate(-15deg)", offset: .15 }]), { duration: 900, easing: "ease-out" });
    expect(animations[1]).toHaveBeenCalledWith(expect.arrayContaining([{ transform: "rotate(60deg) scale(.9)", offset: .25 }]), { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" });
    expect(animations[2]).not.toHaveBeenCalled();
    expect(animations[3]).toHaveBeenCalledWith(expect.arrayContaining([{ transform: "translateY(-10%) scale(.96,1.07) rotate(5deg)", offset: .42 }]), { duration: 900, easing: "cubic-bezier(.2,.8,.2,1)" });
    execute(true).forEach(animate => expect(animate).not.toHaveBeenCalled());
  });

  it("bounds rotated artwork and rejects malformed geometry and unsupported names", () => {
    const bounded = boundStickerPlacement({ ...placement, x: -900, y: 800, size: 280, rotate: 45 });
    const extent = 280 * Math.SQRT2 / 2;
    expect(bounded.x * 9.6).toBeGreaterThanOrEqual(extent);
    expect((100 - bounded.y) * 6).toBeGreaterThanOrEqual(extent);
    const malformed = normalizeStickerScene({ ...scene, background: 'red;background:url(x)', placements: [{ ...placement, size: NaN, x: Infinity, y: NaN, duration: Infinity, intensity: NaN }, { ...placement, name: "unknown" as StickerPlacement["name"] }] });
    expect(malformed.background).toBe("#faf9f6");
    expect(malformed.placements).toHaveLength(1);
    expect(malformed.placements[0]).toMatchObject({ size: 160, x: 50, y: 50, duration: 650, intensity: 1 });
    const saved = JSON.parse(stickerSceneJson(scene));
    expect(saved).toMatchObject({ version: 1, width: 960, height: 600, caption: scene.caption });
    expect(saved.placements.map((item: StickerPlacement) => item.name)).toEqual(["woven-heart", "side-b-vinyl"]);
    expect(stickerSceneJson(malformed)).not.toMatch(/NaN|Infinity/);
  });
});
