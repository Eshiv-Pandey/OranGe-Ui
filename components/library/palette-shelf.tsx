"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import "../../styles/palette-shelf.css";

export type ColorPreset = { name: string; colors: readonly string[] };
const validHex = /^#[\da-f]{6}$/i;
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener("orangeui:palettes", notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener("orangeui:palettes", notify); };
};

/** A small collection of color studies, with user palettes kept on this device. */
export function PaletteShelf({ id, presets, colors, onChange }: { id: string; presets: readonly ColorPreset[]; colors: readonly string[]; onChange: (colors: string[]) => void }) {
  const key = `orangeui:palettes:${id}`, [name, setName] = useState(""), [message, setMessage] = useState("");
  const saved = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key) || "[]"; } catch { return "[]"; } }, () => "[]");
  const custom = useMemo((): ColorPreset[] => {
    try {
      const parsed: unknown = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((item): item is ColorPreset => Boolean(item && typeof item.name === "string" && item.name.length <= 32 && Array.isArray(item.colors) && item.colors.length === colors.length && item.colors.every((color: unknown) => typeof color === "string" && validHex.test(color)))).slice(0, 6) : [];
    } catch { return []; }
  }, [saved, colors.length]);
  const persist = (next: ColorPreset[]) => {
    try { localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event("orangeui:palettes")); return true; }
    catch { setMessage("This browser cannot save palettes. You can still edit every color."); return false; }
  };
  const matches = (preset: ColorPreset) => preset.colors.length === colors.length && preset.colors.every((color, i) => color.toLowerCase() === colors[i].toLowerCase());
  const swatch = (preset: ColorPreset) => <button type="button" className="palette-swatch" aria-label={`Use ${preset.name} palette`} aria-pressed={matches(preset)} onClick={() => { onChange([...preset.colors]); setMessage(""); }}><span className="palette-swatch-strip" aria-hidden="true">{preset.colors.map((color, i) => <i key={i} style={{ backgroundColor: color }} />)}</span><span>{preset.name}</span></button>;
  return <fieldset className="palette-shelf creative-wide"><legend>Color studies</legend>
    <div className="palette-shelf-grid">{presets.map((preset) => <div key={preset.name}>{swatch(preset)}</div>)}</div>
    {!!custom.length && <div className="palette-saved"><span>On this device</span>{custom.map((preset, i) => <div key={`${preset.name}-${i}`}>{swatch(preset)}<button type="button" className="palette-remove" aria-label={`Remove ${preset.name} palette`} onClick={() => persist(custom.filter((_, index) => index !== i))}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 4 8 8M4 12l8-8" /></svg></button></div>)}</div>}
    <form className="palette-save" onSubmit={(event) => { event.preventDefault(); if (!name.trim()) return; if (custom.length >= 6 && !custom.some((preset) => preset.name === name.trim())) { setMessage("Six palettes saved. Remove one or reuse a name to save these colors."); return; } if (persist([...custom.filter((preset) => preset.name !== name.trim()), { name: name.trim(), colors: [...colors] }].slice(-6))) { setMessage(`Saved ${name.trim()} on this device.`); setName(""); } }}>
      <label className="sr-only" htmlFor={`palette-${id}`}>Palette name</label><input id={`palette-${id}`} value={name} maxLength={32} placeholder="Name your palette" onChange={(event) => setName(event.target.value)} /><button type="submit" disabled={!name.trim()}>Save</button>
    </form>
    {message && <p role="status" className="palette-message">{message}</p>}
  </fieldset>;
}
