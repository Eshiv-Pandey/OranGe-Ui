"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded } from "./interaction-utils";
import { fluidColorToHex, hexToFluidColor, type FluidColor } from "./fluid-color";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/fluid-color-picker.css";

export type { FluidColor } from "./fluid-color";
export type FluidColorPickerProps = AppearanceProps & { value?: string; defaultValue?: string; onValueChange?: (hex: string, color: FluidColor) => void; label?: string; swatches?: readonly string[]; defaultOpen?: boolean; alpha?: boolean; disabled?: boolean; theme?: CreativeTheme };
const DEFAULT_COLOR: FluidColor = { h: 24, s: 83, v: 100, a: 1 };
const SWATCHES = ["#f57451", "#e8b94b", "#91ad73", "#669cba", "#b497c5", "#28332e"];

export function FluidColorPicker({ value, defaultValue = "#ff8040", onValueChange, label = "Find your color", swatches = SWATCHES, defaultOpen = false, alpha = true, disabled = false, theme = "auto", appearance = "polished", className }: FluidColorPickerProps) {
  const [local, setLocal] = useState<FluidColor>(() => hexToFluidColor(value ?? defaultValue) ?? DEFAULT_COLOR), [open, setOpen] = useState(defaultOpen), [draft, setDraft] = useState<string | null>(null), [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), plane = useRef<HTMLDivElement>(null), drag = useRef<number | null>(null), id = useId().replace(/:/g, ""), resolved = useCreativeTheme(theme);
  const selected = value === undefined ? local : hexToFluidColor(value, local.h) ?? local;
  const color = { ...selected, a: alpha ? selected.a : 1 }, hex = fluidColorToHex(color);
  const opaque = fluidColorToHex({ ...color, a: 1 });
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside); return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  function change(next: FluidColor) { if (disabled) return; const normalized = { h: bounded(next.h, 0, 360), s: bounded(next.s, 0, 100), v: bounded(next.v, 0, 100), a: alpha ? bounded(next.a, 0, 1) : 1 }; setLocal(normalized); setDraft(null); setError(""); onValueChange?.(fluidColorToHex(normalized), normalized); }
  function position(clientX: number, clientY: number) { const rect = plane.current?.getBoundingClientRect(); if (!rect?.width || !rect.height) return; change({ ...color, s: bounded((clientX - rect.left) / rect.width * 100, 0, 100), v: bounded(100 - (clientY - rect.top) / rect.height * 100, 0, 100) }); }
  function commitHex() { if (draft === null) return; const next = hexToFluidColor(draft, color.h); if (!next) { setError("Enter 3, 4, 6 or 8 hex digits, such as #ff8040."); return; } change(next); setDraft(null); }
  return <div ref={root} className={["creative-surface interaction-surface fluid-picker", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-open={open} data-disabled={disabled} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }}>
    <svg className="fluid-picker-defs" width="0" height="0" aria-hidden="true"><defs><filter id={`${id}-merge`} x="-30%" y="-70%" width="160%" height="240%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" /><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -9" /></filter></defs></svg>
    <div className="fluid-picker-header"><div className="fluid-picker-droplets" style={{ filter: `url(#${id}-merge)`, "--picked-color": opaque } as CSSProperties} aria-hidden="true"><i /><i /><i /></div><button ref={trigger} type="button" className="fluid-picker-trigger" disabled={disabled} style={{ "--picked-color": hex } as CSSProperties} aria-label={label} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(!open)}><span><InteractionIcon name={open ? "close" : "plus"} width="13" height="13" /></span></button><div className="fluid-picker-heading"><strong>{label}</strong><span>{hex.toUpperCase()}</span></div></div>
    {open && <div className="fluid-picker-panel" id={`${id}-panel`} role="group" aria-label="Color controls">
      <div ref={plane} className="fluid-picker-plane" style={{ backgroundColor: `hsl(${color.h} 100% 50%)` }} role="slider" aria-label="Saturation and brightness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(color.s)} aria-valuetext={`${Math.round(color.s)}% saturation, ${Math.round(color.v)}% brightness. Arrow keys adjust both.`} aria-disabled={disabled} tabIndex={disabled ? -1 : 0} onPointerDown={(event) => { if (disabled || event.button !== 0) return; event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = event.pointerId; position(event.clientX, event.clientY); }} onPointerMove={(event) => { if (drag.current === event.pointerId) position(event.clientX, event.clientY); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={(event) => { const step = event.shiftKey ? 10 : 1; const move = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key]; if (!move) return; event.preventDefault(); change({ ...color, s: color.s + move[0], v: color.v + move[1] }); }}><span style={{ left: `${color.s}%`, top: `${100 - color.v}%`, background: opaque }} /></div>
      <div className="fluid-picker-ranges">{([{ key: "h", label: "Hue", max: 360, unit: "°" }, { key: "s", label: "Saturation", max: 100, unit: "%" }, { key: "v", label: "Brightness", max: 100, unit: "%" }, ...(alpha ? [{ key: "a", label: "Opacity", max: 100, unit: "%" }] : [])] as const).map((range) => {
        const key = range.key as keyof FluidColor, number = key === "a" ? color.a * 100 : color[key];
        const track = key === "h" ? "linear-gradient(90deg, #ff3333, #ffff33, #33ff33, #33ffff, #3333ff, #ff33ff, #ff3333)" : key === "s" ? `linear-gradient(90deg, ${fluidColorToHex({ ...color, s: 0, a: 1 })}, ${fluidColorToHex({ ...color, s: 100, a: 1 })})` : key === "v" ? `linear-gradient(90deg, #000000, ${fluidColorToHex({ ...color, v: 100, a: 1 })})` : `linear-gradient(90deg, transparent, ${opaque})`;
        return <label key={key} className={`fluid-picker-channel fluid-picker-channel-${key}`} style={{ "--fluid-track": track, "--fluid-thumb": key === "h" ? `hsl(${color.h} 100% 50%)` : opaque } as CSSProperties}><span>{range.label}<output>{Math.round(number)}{range.unit}</output></span><input type="range" min="0" max={range.max} step="1" value={number} disabled={disabled} aria-label={range.label} onChange={(event) => change({ ...color, [key]: Number(event.target.value) / (key === "a" ? 100 : 1) })} /></label>;
      })}</div>
      <div className="fluid-picker-hex"><label htmlFor={`${id}-hex`}>Hex</label><input id={`${id}-hex`} spellCheck="false" autoComplete="off" maxLength={9} value={draft ?? hex.toUpperCase()} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} disabled={disabled} onFocus={() => setDraft(hex.toUpperCase())} onChange={(event) => { setDraft(event.target.value); setError(""); }} onBlur={commitHex} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitHex(); } if (event.key === "Escape" && draft !== null) { event.stopPropagation(); setDraft(null); setError(""); } }} /><span className="fluid-picker-hex-sample" style={{ "--picked-color": hex } as CSSProperties} aria-hidden="true" /></div>
      {error && <p className="fluid-picker-error" id={`${id}-error`} role="alert">{error}</p>}
      <div className="fluid-picker-swatches" aria-label="Color presets">{swatches.filter((swatch) => hexToFluidColor(swatch)).map((swatch, index) => {
        const preset = hexToFluidColor(swatch)!, active = hex === fluidColorToHex({ ...preset, a: alpha ? preset.a : 1 });
        return <button type="button" key={`${swatch}-${index}`} aria-label={`Use ${swatch.toUpperCase()}`} aria-pressed={active} disabled={disabled} style={{ "--picked-color": swatch } as CSSProperties} onClick={() => change(preset)}><span aria-hidden="true">{active && <InteractionIcon name="check" />}</span></button>;
      })}</div>
    </div>}
  </div>;
}
