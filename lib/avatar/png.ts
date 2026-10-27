import { avatarToSvgString, type AvatarRenderOptions } from "./render";
import type { AvatarConfig } from "./types";

/** Optional browser helper. Importing this module never accesses the DOM. */
export async function avatarToPng(config: AvatarConfig, size = 256, options: AvatarRenderOptions = {}): Promise<Blob> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("PNG export requires a browser. Use avatarToSvgString on the server.");
  }
  const pixels = Number.isFinite(size) ? Math.round(Math.min(4096, Math.max(1, size))) : 256;
  const canvas = document.createElement("canvas");
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export requires a 2D canvas context.");

  const svg = new Blob([avatarToSvgString(config, pixels, options)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svg);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The avatar SVG could not be loaded for PNG export."));
      image.src = url;
    });
    context.drawImage(image, 0, 0, pixels, pixels);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the avatar PNG.")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
