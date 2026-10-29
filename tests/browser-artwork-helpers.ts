import { expect, type Locator, type Page } from "@playwright/test";

export async function editColor(input: Locator, value: string) {
  await input.evaluate((element, color) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, color);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(value);
}

export async function settledPreviewSvg(svg: Locator, dimensions: { width: string; height: string }) {
  return svg.evaluate((element, size) => {
    const clone = element.cloneNode(true) as SVGSVGElement;
    const sources = [element, ...element.querySelectorAll("*")];
    [clone, ...clone.querySelectorAll("*")].forEach((target, index) => {
      for (const attribute of [...target.attributes]) if (attribute.value.includes("var(")) {
        target.setAttribute(attribute.name, attribute.value.replace(/var\((--[\w-]+),\s*(#[\da-f]{6})\)/gi, (_match, name: string, fallback: string) => getComputedStyle(sources[index]).getPropertyValue(name).trim() || fallback));
      }
      // The selected visor position is identity, unlike gaze and idle motion.
      if (target.classList.contains("helmet-visor-lift")) {
        const source = sources[index], style = getComputedStyle(source);
        let transform = style.transform;
        // Computed matrix serialization rounds to six decimals. Preserve the
        // matching authored transform so raster comparison retains full precision.
        function inspect(rules: CSSRuleList) {
          for (const rule of [...rules]) {
            if (rule instanceof CSSMediaRule && !matchMedia(rule.conditionText).matches) continue;
            if (rule instanceof CSSStyleRule && rule.style.transform && source.matches(rule.selectorText)) transform = rule.style.transform;
            if (rule instanceof CSSImportRule && rule.styleSheet) inspect(rule.styleSheet.cssRules);
            if ("cssRules" in rule) inspect((rule as CSSGroupingRule).cssRules);
          }
        }
        for (const sheet of [...document.styleSheets]) inspect(sheet.cssRules);
        (target as SVGElement).style.transform = transform;
        (target as SVGElement).style.transformOrigin = style.transformOrigin;
      }
    });
    clone.setAttribute("width", size.width); clone.setAttribute("height", size.height);
    clone.removeAttribute("class"); clone.removeAttribute("style");
    return new XMLSerializer().serializeToString(clone);
  }, dimensions);
}

export async function decodeExports(page: Page, png: Buffer, svg: string, settled: string) {
  return page.evaluate(async ({ encoded, svg, settled }) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!; context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visible = 0, transparent = 0;
    const colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3]) { visible++; colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`); }
      else transparent++;
    }
    async function differences(source: string) {
      const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const reference = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let index = 0; index < pixels.length; index++) if (pixels[index] !== reference[index]) count++;
        return count;
      } finally { URL.revokeObjectURL(url); }
    }
    const result = { width: bitmap.width, height: bitmap.height, visible, transparent, colors: colors.size, svgDifferences: await differences(svg), previewDifferences: await differences(settled) };
    bitmap.close(); return result;
  }, { encoded: png.toString("base64"), svg, settled });
}
