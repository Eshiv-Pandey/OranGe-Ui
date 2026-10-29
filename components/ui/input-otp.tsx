"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type InputOTPProps = AppearanceProps & Omit<ComponentPropsWithoutRef<"input">, "size" | "type" | "value" | "defaultValue" | "onChange" | "maxLength" | "pattern" | "children"> & {
  label?: string; length?: number; mode?: "numeric" | "alphanumeric"; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; onComplete?: (value: string) => void; error?: string; description?: string;
};
export function normalizeOTP(value: string, length: number, mode: "numeric" | "alphanumeric" = "numeric"): string { return value.replace(mode === "numeric" ? /[^0-9]/g : /[^a-z0-9]/gi, "").toUpperCase().slice(0, length); }
export function InputOTP({ label = "Verification code", length = 6, mode = "numeric", value, defaultValue = "", onValueChange, onComplete, error, description, appearance = "polished", className, id, disabled, readOnly, onFocus, onBlur, onPaste, onSelect, onPointerDown, ...props }: InputOTPProps) {
  const generated = useId(), inputId = id ?? `otp-${generated}`, input = useRef<HTMLInputElement>(null);
  const count = Number.isFinite(length) ? Math.max(1, Math.min(12, Math.floor(length))) : 6;
  const [internal, setInternal] = useState(() => normalizeOTP(defaultValue, count, mode)), [focused, setFocused] = useState(false), [caret, setCaret] = useState(0);
  const current = normalizeOTP(value ?? internal, count, mode);
  useEffect(() => { const owner = input.current?.form; const reset = (event: Event) => { queueMicrotask(() => { if (!event.defaultPrevented && value === undefined) setInternal(normalizeOTP(defaultValue, count, mode)); }); }; owner?.addEventListener("reset", reset); return () => owner?.removeEventListener("reset", reset); }, [value, defaultValue, count, mode]);
  function change(raw: string) { if (disabled || readOnly) return; const next = normalizeOTP(raw, count, mode); if (value === undefined) setInternal(next); onValueChange?.(next); if (next.length === count && next !== current) onComplete?.(next); }
  return <div className={uiClass("ui-otp ui-launch-field", className)} data-appearance={appearance} data-disabled={disabled || undefined}>
    <label htmlFor={inputId}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
    <div className="ui-otp-entry" data-error={Boolean(error) || undefined} style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, maxWidth: `${count * 44 + (count - 1) * 8}px` }}>
      <div className="ui-otp-cells" aria-hidden="true">{Array.from({ length: count }, (_, index) => <span key={index} className="ui-otp-cell" data-active={focused && Math.min(caret, count - 1) === index || undefined}>{current[index] ?? ""}</span>)}</div>
      <input {...props} ref={input} id={inputId} className="ui-otp-input" type="text" inputMode={mode === "numeric" ? "numeric" : "text"} autoComplete={props.autoComplete ?? "one-time-code"} spellCheck={false} autoCapitalize="characters" maxLength={count} pattern={mode === "numeric" ? `[0-9]{${count}}` : `[A-Z0-9]{${count}}`} value={current} disabled={disabled} readOnly={readOnly} aria-invalid={Boolean(error) || undefined} aria-describedby={[description && `${inputId}-description`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined} onChange={(event) => { change(event.target.value); setCaret(event.target.selectionStart ?? current.length); }} onFocus={(event) => { setFocused(true); setCaret(event.currentTarget.selectionStart ?? 0); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }} onSelect={(event) => { setCaret(event.currentTarget.selectionStart ?? 0); onSelect?.(event); }} onPaste={(event) => { onPaste?.(event); if (event.defaultPrevented || disabled || readOnly) return; event.preventDefault(); const next = normalizeOTP(event.clipboardData.getData("text"), count, mode); change(next); setCaret(next.length); queueMicrotask(() => input.current?.setSelectionRange(next.length, next.length)); }} onPointerDown={(event) => { onPointerDown?.(event); if (event.defaultPrevented) return; event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const position = Math.min(current.length, Math.max(0, Math.floor((event.clientX - rect.left) / (rect.width / count)))); input.current?.focus(); input.current?.setSelectionRange(position, position); setCaret(position); }} />
    </div>
    {description && <p id={`${inputId}-description`} className="ui-help">{description}</p>}{error && <p id={`${inputId}-error`} className="ui-error" role="alert">{error}</p>}
  </div>;
}
