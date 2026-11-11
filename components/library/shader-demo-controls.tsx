"use client";

import { EditorColor, EditorRange } from "../ui/editor-controls";

export function ShaderRange({ label, value, onChange, min = 0, max = 1, step = .05 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return <EditorRange label={label} value={value} min={min} max={max} step={step} onChange={onChange} />;
}
export function ShaderCheck({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="creative-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
export function ShaderColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <EditorColor label={label} value={value} onChange={onChange} />;
}
export function ShaderSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return <label className="editor-select"><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option} value={option}>{option.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase())}</option>)}</select></label>;
}
