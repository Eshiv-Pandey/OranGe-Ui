"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { StickerOptions } from "../../lib/sticker-options";
import type { StickerMotion } from "../ui/sticker-pack";
import "../../styles/sticker-controls.css";

export type StickerControlsProps = { options: StickerOptions; onChange: (patch: Partial<StickerOptions>) => void };

/** Shared short panes with no internal scrolling region. */
export function StickerControls({ options, onChange }: StickerControlsProps) {
  const id = useId(), tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tab, setTab] = useState<"appearance" | "motion">("appearance");
  function switchTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - index;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    else return;
    event.preventDefault(); setTab(next ? "motion" : "appearance"); tabs.current[next]?.focus();
  }
  return <div className="sticker-controls">
    <div className="sticker-controls-tabs" role="tablist" aria-label="Sticker settings">{(["appearance", "motion"] as const).map((item, index) => <button type="button" role="tab" key={item} ref={element => { tabs.current[index] = element; }} id={`${id}-${item}-tab`} aria-controls={`${id}-${item}`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1} onClick={() => setTab(item)} onKeyDown={event => switchTab(event, index)}>{item === "appearance" ? "Appearance" : "Motion"}</button>)}</div>
    <div className="sticker-controls-pane" id={`${id}-appearance`} role="tabpanel" aria-labelledby={`${id}-appearance-tab`} hidden={tab !== "appearance"}>
      <div className="sticker-controls-finish" role="group" aria-label="Artwork finish">{(["sharp", "playful"] as const).map(finish => <button type="button" key={finish} aria-pressed={options.finish === finish} onClick={() => onChange({ finish })}>{finish === "sharp" ? "Sharp" : "Playful"}</button>)}</div>
      <label className="sticker-controls-range" htmlFor={`${id}-size`}><span>Sticker size <output>{options.size} px</output></span><input id={`${id}-size`} aria-label="Sticker size" type="range" min="48" max="360" step="4" value={options.size} onChange={event => onChange({ size: Number(event.target.value) })} /></label>
      <label className="sticker-controls-range" htmlFor={`${id}-rotation`}><span>Rotation <output>{options.rotate}°</output></span><input id={`${id}-rotation`} aria-label="Rotation" type="range" min="-180" max="180" step="1" value={options.rotate} onChange={event => onChange({ rotate: Number(event.target.value) })} /></label>
      <label className="sticker-controls-check"><input type="checkbox" checked={options.shadow} onChange={event => onChange({ shadow: event.target.checked })} /> Soft shadow</label>
    </div>
    <div className="sticker-controls-pane" id={`${id}-motion`} role="tabpanel" aria-labelledby={`${id}-motion-tab`} hidden={tab !== "motion"}>
      <label className="sticker-controls-select" htmlFor={`${id}-motion-choice`}><span>Click animation</span><select id={`${id}-motion-choice`} value={options.motion} onChange={event => onChange({ motion: event.target.value as StickerMotion })}><option value="bounce">Bounce</option><option value="wiggle">Wiggle</option><option value="spin">Spin</option><option value="none">None</option></select></label>
      <label className="sticker-controls-range" htmlFor={`${id}-duration`}><span>Duration <output>{options.duration} ms</output></span><input id={`${id}-duration`} aria-label="Duration" type="range" min="200" max="2000" step="50" disabled={options.motion === "none"} value={options.duration} onChange={event => onChange({ duration: Number(event.target.value) })} /></label>
      <label className="sticker-controls-range" htmlFor={`${id}-intensity`}><span>Intensity <output>{options.intensity.toFixed(2)}×</output></span><input id={`${id}-intensity`} aria-label="Intensity" type="range" min=".25" max="2" step=".05" disabled={options.motion === "none"} value={options.intensity} onChange={event => onChange({ intensity: Number(event.target.value) })} /></label>
      <p className="sticker-controls-motion-note">Reduced motion follows your device settings.</p>
    </div>
  </div>;
}

export const STICKER_BACKGROUND_PALETTE = [
  { name: "Paper", value: "#f3f0eb" }, { name: "Ink", value: "#171923" }, { name: "Sky", value: "#dce9ff" },
  { name: "Lilac", value: "#f2ddf7" }, { name: "Mint", value: "#def4d8" }, { name: "Peach", value: "#ffdfc0" }, { name: "White", value: "#ffffff" },
] as const;

export function StickerBackgroundControl({ value, onChange, label = "Background", allowTransparent = false }: { value: string; onChange: (value: string) => void; label?: string; allowTransparent?: boolean }) {
  const id = useId();
  const color = /^#[\da-f]{6}$/i.test(value) ? value : /^#[\da-f]{3}$/i.test(value) ? `#${value.slice(1).split("").map(char => char + char).join("")}` : "#f3f0eb";
  return <div className="sticker-background-control" role="group" aria-label={label}>
    <div className="sticker-background-heading"><label htmlFor={`${id}-color`}>{label}</label><output>{value === "transparent" ? "Transparent" : color.toUpperCase()}</output></div>
    <div className="sticker-background-colors"><input id={`${id}-color`} aria-label={label} type="color" value={color} onChange={event => onChange(event.target.value)} title="Choose any color" />
      {STICKER_BACKGROUND_PALETTE.map(item => <button key={item.value} type="button" className="sticker-background-swatch" aria-label={item.name} title={`${item.name} ${item.value}`} aria-pressed={value.toLowerCase() === item.value} style={{ background: item.value }} onClick={() => onChange(item.value)} />)}
      {allowTransparent && <button type="button" className="sticker-background-swatch sticker-background-transparent" aria-label="Transparent" title="Transparent" aria-pressed={value === "transparent"} onClick={() => onChange("transparent")} />}
    </div>
  </div>;
}
