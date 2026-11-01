"use client";

export function ShaderRange({ label, value, onChange, min = 0, max = 1, step = .05 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return <label className="creative-range"><span>{label}<output>{Number(value.toFixed(2))}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
export function ShaderCheck({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="creative-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
export function ShaderColor({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="creative-color"><span>{label}</span><span><input type="color" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} /><code>{value}</code></span></label>;
}
export function ShaderSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
