"use client";

import { useEffect, useId, useRef, useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type RatingProps = AppearanceProps & {
  label?: string; value?: number; defaultValue?: number; onValueChange?: (value: number) => void;
  max?: number; name?: string; form?: string; disabled?: boolean; readOnly?: boolean; required?: boolean; clearable?: boolean; description?: string; error?: string;
};
export function Rating({ label = "Rating", value, defaultValue = 0, onValueChange, max = 5, name, form, disabled, readOnly, required, clearable = false, description, error, appearance = "polished", className }: RatingProps) {
  const id = useId(), group = useRef<HTMLFieldSetElement>(null), count = Number.isFinite(max) ? Math.max(1, Math.min(10, Math.floor(max))) : 5;
  const [internal, setInternal] = useState(defaultValue), [hovered, setHovered] = useState(0);
  const raw = value ?? internal, selected = Number.isFinite(raw) ? Math.max(0, Math.min(count, Math.round(raw))) : 0;
  function change(next: number) { if (disabled || readOnly) return; if (value === undefined) setInternal(next); onValueChange?.(next); }
  useEffect(() => { const owner = group.current?.form; const reset = (event: Event) => { queueMicrotask(() => { if (!event.defaultPrevented && value === undefined) setInternal(defaultValue); }); }; owner?.addEventListener("reset", reset); return () => owner?.removeEventListener("reset", reset); }, [value, defaultValue]);
  return <fieldset ref={group} form={form} role={readOnly ? "group" : "radiogroup"} className={uiClass("ui-rating", className)} data-appearance={appearance} disabled={disabled} aria-labelledby={`${id}-label`} aria-invalid={!readOnly && Boolean(error) || undefined} aria-required={!readOnly && required || undefined} aria-describedby={[description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}>
    <legend id={`${id}-label`}>{label}{required && <span aria-hidden="true"> *</span>}</legend>
    <div className="ui-rating-controls" onMouseLeave={() => setHovered(0)}>
      {readOnly ? <span className="ui-rating-readonly" role="img" aria-label={`${selected} of ${count} stars`}>{Array.from({ length: count }, (_, index) => <Star key={index} filled={index < selected} />)}</span> : Array.from({ length: count }, (_, index) => { const amount = index + 1; return <label key={amount} className="ui-rating-option" data-checked={selected === amount || undefined} onMouseEnter={() => { if (!disabled) setHovered(amount); }}><input type="radio" className="sr-only" name={name ?? `${id}-rating`} form={form} value={amount} checked={selected === amount} required={required} aria-label={`${amount} ${amount === 1 ? "star" : "stars"}`} aria-describedby={error ? `${id}-error` : undefined} onChange={() => change(amount)} /><Star filled={amount <= (hovered || selected)} /></label>; })}
      <span className="ui-rating-value" aria-hidden="true">{selected}/{count}</span>
      {clearable && !required && !readOnly && selected > 0 && <button type="button" className="ui-rating-clear" disabled={disabled} onClick={() => change(0)}>Clear</button>}
    </div>
    {readOnly && name && <input type="hidden" name={name} form={form} value={selected || ""} disabled={disabled} />}
    {description && <p id={`${id}-description`} className="ui-help">{description}</p>}{error && <p id={`${id}-error`} className="ui-error" role="alert">{error}</p>}
  </fieldset>;
}
function Star({ filled }: { filled: boolean }) { return <svg className="ui-rating-star" data-filled={filled || undefined} viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>; }
