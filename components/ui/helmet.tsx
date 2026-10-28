"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { artworkDimension, generateHelmetConfig, helmetSvgBody, normalizeHelmetConfig, type HelmetColors, type HelmetConfig, type HelmetFinish, type HelmetParts, type HelmetPattern } from "./helmet-art";
import { usePointerGaze } from "./use-pointer-gaze";
import "../../styles/helmet-driver.css";

export type HelmetProps = AppearanceProps & {
  size?: number; seed?: string | number; config?: HelmetConfig;
  colors?: Partial<HelmetColors>; parts?: Partial<HelmetParts>;
  visorColor?: string; stripeColors?: readonly [string, string?];
  pattern?: HelmetPattern; finish?: HelmetFinish; number?: string | number;
  interactive?: boolean; blink?: boolean;
  /** Controlled visor state. Otherwise clicking locally toggles the saved default. */
  visorOpen?: boolean; onVisorOpenChange?: (open: boolean) => void;
  "aria-label"?: string;
};

export function Helmet({ size = 240, seed = "orangeui:helmet", config, colors, parts, visorColor, stripeColors, pattern, finish, number, interactive = true, blink = true, visorOpen, onVisorOpenChange, appearance = "polished", className, "aria-label": label = "Motorsport helmet" }: HelmetProps) {
  const id = useId(), host = useRef<HTMLSpanElement>(null);
  const [toggle, setToggle] = useState<{ identity: string; value: boolean } | null>(null);
  usePointerGaze(host, { seed, interactive, blink });
  const base = config ? normalizeHelmetConfig(config) : generateHelmetConfig(seed);
  const current = normalizeHelmetConfig({ ...base, number: number ?? base.number, colors: { ...base.colors, ...colors, ...(visorColor ? { visor: visorColor } : {}), ...(stripeColors ? { stripe: stripeColors[0], stripeAlt: stripeColors[1] ?? base.colors.stripeAlt } : {}) }, parts: { ...base.parts, ...parts, ...(pattern ? { pattern } : {}), ...(finish ? { finish } : {}) } });
  const identity = `${seed}:${JSON.stringify(config ?? null)}:${JSON.stringify(parts ?? null)}`;
  const open = visorOpen ?? (toggle?.identity === identity ? toggle.value : current.parts.visorOpen);
  const pixels = artworkDimension(size, 240);
  const name = `${label.trim() || "Motorsport helmet"}, number ${current.number}`;
  function flip() { const next = !open; setToggle({ identity, value: next }); onVisorOpenChange?.(next); }
  const artwork = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width={pixels} height={pixels} aria-hidden="true" focusable="false" shapeRendering={appearance === "pixel" ? "crispEdges" : undefined} className="helmet-svg" dangerouslySetInnerHTML={{ __html: helmetSvgBody(current, `helmet-${id}`, { appearance }) }} />;
  return <span ref={host} className={uiClass("helmet", className)} data-appearance={appearance} data-motion="paused" data-visor-open={open} style={{ "--helmet-size": `${pixels}px` } as CSSProperties}>
    {interactive ? <button type="button" className="helmet-button" aria-label={`${name}: ${open ? "close" : "open"} visor`} aria-pressed={open} onClick={flip}>{artwork}</button> : <span role="img" className="helmet-image" aria-label={`${name}, visor ${open ? "open" : "closed"}`}>{artwork}</span>}
  </span>;
}

export { HELMET_FINISHES, HELMET_PALETTES, HELMET_PATTERNS, generateHelmetConfig, helmetToSvgString, normalizeHelmetConfig } from "./helmet-art";
export type { HelmetColors, HelmetConfig, HelmetFinish, HelmetParts, HelmetPattern } from "./helmet-art";
