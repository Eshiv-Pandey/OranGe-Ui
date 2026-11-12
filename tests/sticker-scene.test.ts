import { describe, expect, it, vi } from "vitest";
import ts from "typescript";
import { DEFAULT_STICKER_OPTIONS } from "../lib/sticker-options";
import { boundStickerPlacement, moveStickerLayer, normalizeStickerScene, stickerCanvasCaptionColor, stickerCanvasIsDark, stickerSceneHtml, stickerSceneJson, stickerSceneReact, type StickerPlacement, type StickerScene } from "../lib/sticker-scene";

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
    const repeated = new DOMParser().parseFromString(stickerSceneHtml({ ...scene, placements: [placement, { ...placement, id: "repeat" }] }), "text/html");
    const ids = [...repeated.querySelectorAll("[id]")].map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const element of repeated.querySelectorAll("[clip-path]")) {
      const id = element.getAttribute("clip-path")!.slice(5, -1);
      expect(element.closest("svg")!.querySelector(`[id="${id}"]`)).not.toBeNull();
    }
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

  it("allows intentional edge bleed while rejecting malformed geometry and unsupported names", () => {
    const bounded = boundStickerPlacement({ ...placement, x: -900, y: 800, size: 280, rotate: 45 });
    expect(bounded).toMatchObject({ x: -50, y: 150, size: 280, rotate: 45 });
    const edge = boundStickerPlacement({ ...placement, x: 0, y: 100, motion: "spin" });
    expect(edge).toMatchObject({ x: 0, y: 100 });
    const bleeding = { ...scene, placements: [boundStickerPlacement({ ...placement, x: -8, y: 106 })] };
    expect(stickerSceneReact(bleeding)).toContain('left: "-8%", top: "106%"');
    expect(stickerSceneHtml(bleeding)).toContain('left:-8%;top:106%');
    expect(JSON.parse(stickerSceneJson(bleeding)).placements[0]).toMatchObject({ x: -8, y: 106 });
    expect(stickerSceneReact(bleeding)).toContain('overflow: "hidden"');
    const malformed = normalizeStickerScene({ ...scene, background: 'red;background:url(x)', placements: [{ ...placement, size: NaN, x: Infinity, y: NaN, duration: Infinity, intensity: NaN }, { ...placement, name: "unknown" as StickerPlacement["name"] }] });
    expect(malformed.background).toBe("#faf9f6");
    expect(malformed.placements).toHaveLength(1);
    expect(malformed.placements[0]).toMatchObject({ size: 160, x: 50, y: 50, duration: 650, intensity: 1 });
    const saved = JSON.parse(stickerSceneJson(scene));
    expect(saved).toMatchObject({ version: 1, width: 960, height: 600, caption: scene.caption });
    expect(saved.placements.map((item: StickerPlacement) => item.name)).toEqual(["woven-heart", "side-b-vinyl"]);
    expect(stickerSceneJson(malformed)).not.toMatch(/NaN|Infinity/);
  });

  it("reorders the highest list row to the final rendered and exported layer without changing sticker settings", () => {
    const third = { ...placement, id: "third", name: "essential-heart" as StickerPlacement["name"] };
    const placements = [...scene.placements, third], original = structuredClone(placements);
    const reordered = moveStickerLayer(placements, "first", 0);
    expect(reordered.map(item => item.id)).toEqual(["second", "third", "first"]);
    expect(reordered.at(-1)).toEqual(placement);
    expect(placements).toEqual(original);
    expect(moveStickerLayer(reordered, "first", 2).map(item => item.id)).toEqual(["first", "second", "third"]);
    const exported = stickerSceneReact({ ...scene, placements: reordered });
    expect(exported.lastIndexOf('name="woven-heart"')).toBeGreaterThan(exported.indexOf('name="essential-heart"'));
    expect(JSON.parse(stickerSceneJson({ ...scene, placements: reordered })).placements.map((item: StickerPlacement) => item.name)).toEqual(["side-b-vinyl", "essential-heart", "woven-heart"]);
    expect(moveStickerLayer(placements, "missing", 0)).toBe(placements);
  });

  it("retains custom palette and transparent backgrounds with readable caption contrast", () => {
    for (const background of ["#093B38", "#e6eeff", "transparent"]) {
      expect(normalizeStickerScene({ ...scene, background }).background).toBe(background);
      expect(JSON.parse(stickerSceneJson({ ...scene, background })).background).toBe(background);
    }
    expect(stickerCanvasIsDark("#093B38")).toBe(true);
    expect(stickerCanvasIsDark("#e6eeff")).toBe(false);
    expect(stickerCanvasIsDark("transparent")).toBe(false);
    expect(stickerSceneHtml({ ...scene, background: "#093B38" })).toContain("color:#f4f3f0");
    expect(stickerSceneReact({ ...scene, background: "#093B38" })).toContain('color: "#f4f3f0"');
    const luminance = (color: string) => [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    for (const background of ["#777777", "#888888", "#665588", "#3c9476", "#093b38", "#ffffff"]) {
      const foreground = stickerCanvasCaptionColor(background), a = luminance(background), b = luminance(foreground);
      expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThanOrEqual(4.5);
      expect(stickerSceneReact({ ...scene, background })).toContain(`color: "${foreground}"`);
      expect(stickerSceneHtml({ ...scene, background })).toContain(`color:${foreground}`);
    }
  });
});
