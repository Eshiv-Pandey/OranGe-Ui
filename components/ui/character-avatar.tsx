"use client";

import { useId, useRef, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { characterSvgBody, generateCharacterConfig, normalizeCharacterConfig, type CharacterColors, type CharacterConfig, type CharacterParts } from "./character-art";
import { usePointerGaze } from "./use-pointer-gaze";
import "../../styles/character-avatar.css";

export type CharacterAvatarProps = AppearanceProps & {
  size?: number;
  seed?: string | number;
  config?: CharacterConfig;
  colors?: Partial<CharacterColors>;
  parts?: Partial<CharacterParts>;
  interactive?: boolean;
  blink?: boolean;
  "aria-label"?: string;
};

/** Fictional portrait with clipped eyes and independently turning SVG layers. */
export function CharacterAvatar({ size = 240, seed = "orangeui:portrait", config, colors, parts, interactive = true, blink = true, appearance = "polished", className, "aria-label": ariaLabel = "Original illustrated character" }: CharacterAvatarProps) {
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();
  usePointerGaze(ref, { seed, interactive, blink });
  const base = config ? normalizeCharacterConfig(config) : generateCharacterConfig(seed);
  const current = normalizeCharacterConfig({ ...base, colors: { ...base.colors, ...colors }, parts: { ...base.parts, ...parts } });
  const pixels = Number.isFinite(size) ? Math.min(2048, Math.max(16, size)) : 240;
  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width={pixels} height={pixels} role="img" aria-label={ariaLabel.trim() || "Original illustrated character"} className={uiClass("character-avatar", className)} data-appearance={appearance} data-motion="paused" style={{ "--character-size": `${pixels}px` } as CSSProperties} dangerouslySetInnerHTML={{ __html: characterSvgBody(current, `portrait-${id}`, { appearance }) }} />;
}

export { CHARACTER_FACES, CHARACTER_GLASSES, CHARACTER_HAIR, CHARACTER_OUTFITS, CHARACTER_PALETTES, characterToSvgString, generateCharacterConfig, normalizeCharacterConfig } from "./character-art";
export type { CharacterColors, CharacterConfig, CharacterParts } from "./character-art";
