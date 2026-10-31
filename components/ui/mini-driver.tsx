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
  autoGestures?: boolean; paused?: boolean; onPausedChange?: (paused: boolean) => void; showControls?: boolean;
};

export function MiniDriver({ size = 280, seed = "orangeui:driver", config, colors, parts, helmet, interactive = true, blink = true, onWave, autoGestures = true, paused, onPausedChange, showControls = false, appearance = "polished", className, "aria-label": label = "Miniature motorsport driver" }: MiniDriverProps) {
  const id = useId(), host = useRef<HTMLSpanElement>(null);
  const [reaction, setReaction] = useState(0);
  const [localPaused, setLocalPaused] = useState(false), isPaused = paused ?? localPaused;
  const [announcement, setAnnouncement] = useState("");
  const motion = useRef({ clock: 0, until: 0, gesture: "idle" });
  usePointerGaze(host, { seed, interactive, blink, paused: isPaused, onFrame: ({ delta }) => {
    const state = motion.current;
    state.clock += delta;
    if (state.clock >= state.until) {
      const phase = state.clock % 14000;
      state.gesture = autoGestures && phase > 2600 && phase < 4400 ? "wave" : autoGestures && phase > 8500 && phase < 10400 ? "thumbs-up" : "idle";
    }
    if (host.current) host.current.dataset.gesture = state.gesture;
  } });
  function greet(gesture: "wave" | "thumbs-up") {
    motion.current.gesture = gesture; motion.current.until = motion.current.clock + 1800;
    if (host.current) host.current.dataset.gesture = gesture;
    setReaction((count) => count + 1);
    setAnnouncement(gesture === "wave" ? reaction % 2 ? "The little driver waves again." : "The little driver waves hello." : "The little driver gives a thumbs up.");
    if (gesture === "wave") onWave?.();
  }
  const base = config ? normalizeMiniDriverConfig(config) : generateMiniDriverConfig(seed);
  const current = normalizeMiniDriverConfig({ ...base, colors: { ...base.colors, ...colors }, parts: { ...base.parts, ...parts }, helmet: helmet ? normalizeHelmetConfig({ ...base.helmet, ...helmet, colors: { ...base.helmet.colors, ...helmet.colors }, parts: { ...base.helmet.parts, ...helmet.parts } }) : base.helmet });
  const pixels = artworkDimension(size, 280), name = `${label.trim() || "Miniature motorsport driver"}, number ${current.helmet.number}`;
  const artwork = <svg key={reaction} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" width={pixels * .75} height={pixels} aria-hidden="true" focusable="false" shapeRendering={appearance === "pixel" ? "crispEdges" : undefined} className={`mini-driver-svg${reaction ? " mini-driver-reacted" : ""}`} dangerouslySetInnerHTML={{ __html: miniDriverSvgBody(current, `driver-${id}`, { appearance }) }} />;
  return <span ref={host} className={uiClass("mini-driver", className)} data-appearance={appearance} data-motion="paused" data-paused={isPaused} data-gesture="idle" style={{ "--driver-size": `${pixels}px` } as CSSProperties}>
    {interactive ? <button className="mini-driver-button" type="button" aria-label={`${name}: wave hello`} onClick={() => greet("wave")}>{artwork}</button> : <span role="img" aria-label={name} className="mini-driver-image">{artwork}</span>}
    {interactive && showControls && <span className="mini-driver-controls"><button type="button" onClick={() => greet("thumbs-up")}>Thumbs up</button><button type="button" aria-pressed={isPaused} onClick={() => { if (paused === undefined) setLocalPaused(!isPaused); onPausedChange?.(!isPaused); }}>{isPaused ? "Resume" : "Pause"} animation</button></span>}
    {interactive && <span className="sr-only" role="status">{announcement}</span>}
  </span>;
}

export { DRIVER_BOOTS, DRIVER_SUITS, generateMiniDriverConfig, miniDriverToSvgString, normalizeMiniDriverConfig } from "./mini-driver-art";
export type { MiniDriverColors, MiniDriverConfig, MiniDriverParts } from "./mini-driver-art";
