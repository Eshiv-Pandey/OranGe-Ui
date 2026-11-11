"use client";

import { useId, useState, type CSSProperties } from "react";
import "../../styles/editor-controls.css";

/** A slider for exploration and a number field for an exact, keyboard-editable value. */
export function EditorRange({ label, value, onChange, min = 0, max = 1, step = .01, formatValue = String }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; formatValue?: (value: number) => string }) {
  const id = useId(), [draft, setDraft] = useState<string | null>(null);
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const progress = max > min ? (clamp(value) - min) / (max - min) * 100 : 0;
  function commit() {
    if (draft !== null && draft.trim() !== "" && Number.isFinite(Number(draft))) {
      const next = Math.round((clamp(Number(draft)) - min) / step) * step + min;
      onChange(clamp(Number(next.toFixed(6))));
    }
    setDraft(null);
  }
  return <div className="editor-field editor-range" style={{ "--editor-progress": `${progress}%` } as CSSProperties}>
    <div className="editor-field-heading"><label htmlFor={id}>{label}</label><input className="editor-number" type="number" inputMode="decimal" aria-label={`${label} value`} min={min} max={max} step={step} value={draft ?? Number(value.toFixed(6))} onChange={(event) => {
      const text = event.target.value, next = event.target.valueAsNumber;
      setDraft(text);
      if (text && Number.isFinite(next) && next >= min && next <= max) onChange(next);
    }} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setDraft(null); }} /></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={formatValue(value)} onChange={(event) => { setDraft(null); onChange(Number(event.target.value)); }} />
  </div>;
}

/** Keep the native picker, and make the hex value a real text field too. */
export function EditorColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId(), [draft, setDraft] = useState<string | null>(null);
  const hex = (candidate: string) => /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : /^#[0-9a-f]{3}$/i.test(candidate) ? "#" + candidate.slice(1).split("").map((c) => c + c).join("") : null;
  return <div className="editor-field editor-color"><label htmlFor={id}>{label}</label><div className="editor-color-value">
    <input id={id} type="color" aria-label={label} value={hex(value) ?? "#ff6a00"} onChange={(event) => { setDraft(null); onChange(event.target.value); }} />
    <input type="text" spellCheck={false} autoComplete="off" aria-label={`${label} hex`} value={draft ?? value} maxLength={7} onChange={(event) => { const text = event.target.value; setDraft(text); const valid = /^#[0-9a-f]{6}$/i.test(text); if (valid) onChange(text); }} onBlur={() => { if (draft && hex(draft)) onChange(hex(draft)!); setDraft(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  </div></div>;
}
