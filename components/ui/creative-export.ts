"use client";

export function downloadCreativeBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  queueMicrotask(() => URL.revokeObjectURL(url));
}

export function creativeFileData(file: Blob, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => { reader.onload = null; reader.onerror = null; reader.onabort = null; signal?.removeEventListener("abort", abort); };
    const abort = () => { reader.abort(); cleanup(); reject(new DOMException("Export cancelled", "AbortError")); };
    if (signal?.aborted) { abort(); return; }
    reader.onload = () => { const value = reader.result; cleanup(); if (typeof value === "string") resolve(value); else reject(new Error("Could not read the image.")); };
    reader.onerror = () => { cleanup(); reject(new Error("Could not read the image.")); };
    reader.onabort = () => { cleanup(); reject(new DOMException("Export cancelled", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true }); reader.readAsDataURL(file);
  });
}

/** Embed image/font assets so exports work independently of the current website. */
export async function standaloneCreativeSvg(element: SVGSVGElement, options: { fonts?: { family: string; url: string }[]; signal?: AbortSignal } = {}) {
  const clone = element.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  for (const image of clone.querySelectorAll("image")) {
    const href = image.getAttribute("href");
    if (!href || href.startsWith("data:")) continue;
    const response = await fetch(href, { signal: options.signal });
    if (!response.ok) throw new Error("The image could not be exported. Upload a local image or use one that allows downloads.");
    image.setAttribute("href", await creativeFileData(await response.blob(), options.signal));
  }
  if (options.fonts?.length) {
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style"), declarations: string[] = [];
    for (const font of options.fonts) {
      const response = await fetch(font.url, { signal: options.signal });
      if (!response.ok) throw new Error("The display font could not be exported. Try again.");
      const data = await creativeFileData(new Blob([await response.arrayBuffer()], { type: "font/woff2" }), options.signal);
      declarations.push('@font-face{font-family:"' + font.family.replace(/"/g, "") + '";src:url("' + data + '") format("woff2");font-weight:100 900;}');
    }
    style.textContent = declarations.join("\n"); clone.prepend(style);
  }
  return new XMLSerializer().serializeToString(clone);
}

export async function creativeSvgPng(markup: string, width: number, height: number): Promise<Blob> {
  const image = new Image();
  image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
  await image.decode();
  const canvas = document.createElement("canvas"), context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is not supported in this browser.");
  canvas.width = width; canvas.height = height; context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image export failed.")), "image/png"));
}
