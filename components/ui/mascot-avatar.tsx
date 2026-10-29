"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { generateMascotConfig, mascotLabel, mascotSvgBody, normalizeMascotConfig, type MascotColors, type MascotConfig, type MascotKind, type MascotState } from "./mascot-art";
import { usePointerGaze } from "./use-pointer-gaze";
import "../../styles/mascot-avatar.css";

export type MascotAvatarProps = AppearanceProps & {
  seed?: string | number;
  size?: number;
  state?: MascotState;
  colors?: Partial<MascotColors>;
  mascot?: MascotKind;
  /** Optional saved identity. Explicit mascot and color overrides take priority. */
  config?: MascotConfig;
  interactive?: boolean;
  blink?: boolean;
  "aria-label"?: string;
};

/** A small original SVG companion, with local reactions and no stored user data. */
export function MascotAvatar({ seed = "orangeui:character", size = 128, state = "idle", colors, mascot, config, interactive = true, blink = true, appearance = "polished", className, "aria-label": ariaLabel }: MascotAvatarProps) {
  const id = useId();
  const host = useRef<HTMLSpanElement>(null);
  const [reaction, setReaction] = useState(0);
  usePointerGaze(host, { seed, interactive, blink });
  const base = config ? normalizeMascotConfig(config) : generateMascotConfig(seed);
  const value = normalizeMascotConfig({ ...base, mascot: mascot ?? base.mascot, colors: { ...base.colors, ...colors } });
  const mood: MascotState = ["idle", "thinking", "talking", "error"].includes(state) ? state : "idle";
  const pixels = Number.isFinite(size) ? Math.min(2048, Math.max(16, size)) : 128;
  const label = mascotLabel(value.mascot);
  const name = ariaLabel?.trim() || `${label}, ${mood}`;
  const artwork = <svg key={reaction} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width={pixels} height={pixels} aria-hidden="true" focusable="false" className={`mascot-svg${reaction ? " mascot-reacted" : ""}`} dangerouslySetInnerHTML={{ __html: mascotSvgBody(value, `mascot-${id}`, { appearance, state: mood }) }} />;

  return <span ref={host} className={uiClass("mascot-avatar", className)} data-appearance={appearance} data-mascot={value.mascot} data-state={mood} data-interactive={interactive} data-motion="paused" style={{ "--mascot-size": `${pixels}px` } as CSSProperties}>
    {interactive ? <button className="mascot-button" type="button" aria-label={name} title={`Say hello to ${label.toLowerCase()}`} onClick={() => setReaction((count) => count + 1)}>{artwork}</button> : <span className="mascot-image" role="img" aria-label={name}>{artwork}</span>}
    {interactive && <span className="sr-only" role="status">{reaction ? reaction % 2 ? `${label} says hello.` : `${label} noticed you.` : ""}</span>}
  </span>;
}

export { generateMascotConfig, mascotLabel, mascotToSvgString, normalizeMascotConfig, MASCOT_OPTIONS, MASCOT_PALETTES } from "./mascot-art";
export type { MascotColors, MascotConfig, MascotKind, MascotState } from "./mascot-art";
