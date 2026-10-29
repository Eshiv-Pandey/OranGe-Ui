"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { artworkDimension, normalizeHelmetConfig, type HelmetColors, type HelmetParts } from "./helmet-art";
import { generateMiniDriverConfig, miniDriverSvgBody, normalizeMiniDriverConfig, type MiniDriverColors, type MiniDriverConfig, type MiniDriverParts } from "./mini-driver-art";
import { usePointerGaze } from "./use-pointer-gaze";
import "../../styles/helmet-driver.css";

export type MiniDriverProps = AppearanceProps & {
  /** Full body height in CSS pixels. Width is three quarters of this value. */
  size?: number; seed?: string | number; config?: MiniDriverConfig;
  colors?: Partial<MiniDriverColors>; parts?: Partial<MiniDriverParts>;
  helmet?: { number?: string | number; colors?: Partial<HelmetColors>; parts?: Partial<HelmetParts> };
  interactive?: boolean; blink?: boolean; onWave?: () => void; "aria-label"?: string;
};

export function MiniDriver({ size = 280, seed = "orangeui:driver", config, colors, parts, helmet, interactive = true, blink = true, onWave, appearance = "polished", className, "aria-label": label = "Miniature motorsport driver" }: MiniDriverProps) {
  const id = useId(), host = useRef<HTMLSpanElement>(null);
  const [reaction, setReaction] = useState(0);
  usePointerGaze(host, { seed, interactive, blink });
  const base = config ? normalizeMiniDriverConfig(config) : generateMiniDriverConfig(seed);
  const current = normalizeMiniDriverConfig({ ...base, colors: { ...base.colors, ...colors }, parts: { ...base.parts, ...parts }, helmet: helmet ? normalizeHelmetConfig({ ...base.helmet, ...helmet, colors: { ...base.helmet.colors, ...helmet.colors }, parts: { ...base.helmet.parts, ...helmet.parts } }) : base.helmet });
  const pixels = artworkDimension(size, 280), name = `${label.trim() || "Miniature motorsport driver"}, number ${current.helmet.number}`;
  const artwork = <svg key={reaction} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width={pixels * .75} height={pixels} aria-hidden="true" focusable="false" shapeRendering={appearance === "pixel" ? "crispEdges" : undefined} className={`mini-driver-svg${reaction ? " mini-driver-reacted" : ""}`} dangerouslySetInnerHTML={{ __html: miniDriverSvgBody(current, `driver-${id}`, { appearance }) }} />;
  return <span ref={host} className={uiClass("mini-driver", className)} data-appearance={appearance} data-motion="paused" data-visor-open={current.helmet.parts.visorOpen} style={{ "--driver-size": `${pixels}px` } as CSSProperties}>
    {interactive ? <button className="mini-driver-button" type="button" aria-label={`${name}: wave hello`} onClick={() => { setReaction((count) => count + 1); onWave?.(); }}>{artwork}</button> : <span role="img" aria-label={name} className="mini-driver-image">{artwork}</span>}
    {interactive && <span className="sr-only" role="status">{reaction ? reaction % 2 ? "The little driver waves hello." : "The little driver waves again." : ""}</span>}
  </span>;
}

export { DRIVER_BOOTS, DRIVER_SUITS, generateMiniDriverConfig, miniDriverToSvgString, normalizeMiniDriverConfig } from "./mini-driver-art";
export type { MiniDriverColors, MiniDriverConfig, MiniDriverParts } from "./mini-driver-art";
