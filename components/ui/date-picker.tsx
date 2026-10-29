"use client";

import { Popover as Primitive } from "radix-ui";
import { useEffect, useId, useRef, useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { Calendar, type CalendarProps } from "./calendar";
import { formatCalendarDate, isCalendarDate } from "./calendar-date";
import "../../styles/launch-forms.css";

export type DatePickerProps = AppearanceProps & Pick<CalendarProps, "min" | "max" | "isDateDisabled" | "locale" | "weekStartsOn" | "defaultMonth"> & {
  label: string; value?: string; defaultValue?: string; onValueChange?: (date: string) => void;
  name?: string; id?: string; form?: string; required?: boolean; disabled?: boolean; placeholder?: string; description?: string; error?: string; clearable?: boolean;
};
export function DatePicker({ label, value, defaultValue = "", onValueChange, name, id, form, required, disabled, placeholder = "Choose a date", description, error, clearable = true, appearance = "polished", className, ...calendarProps }: DatePickerProps) {
  const generated = useId(), inputId = id ?? `date-picker-${generated}`, trigger = useRef<HTMLButtonElement>(null), native = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(defaultValue), [open, setOpen] = useState(false);
  const raw = value ?? internal, selected = isCalendarDate(raw) ? raw : "";
  const invalid = Boolean(selected && (isCalendarDate(calendarProps.min) && selected < calendarProps.min || isCalendarDate(calendarProps.max) && selected > calendarProps.max || calendarProps.isDateDisabled?.(selected)));
  const message = error || (invalid ? "Choose an available date." : undefined);
  function change(next: string) { if (value === undefined) setInternal(next); onValueChange?.(next); setOpen(false); }
  useEffect(() => { native.current?.setCustomValidity(invalid ? "Choose an available date." : ""); }, [invalid]);
  useEffect(() => {
    const owner = native.current?.form;
    const reset = (event: Event) => { queueMicrotask(() => { if (event.defaultPrevented) return; if (value === undefined) setInternal(defaultValue); setOpen(false); }); };
    owner?.addEventListener("reset", reset); return () => owner?.removeEventListener("reset", reset);
  }, [value, defaultValue]);
  return <div className={uiClass("ui-date-picker ui-launch-field", className)} data-appearance={appearance}>
    <label id={`${inputId}-label`} htmlFor={inputId}>{label}{required && <><span aria-hidden="true"> *</span><span className="sr-only"> (required)</span></>}</label>
    <div className="ui-date-picker-control">
      <Primitive.Root open={open && !disabled} onOpenChange={setOpen}>
        <Primitive.Trigger asChild><button ref={trigger} type="button" id={inputId} className="ui-date-picker-trigger" disabled={disabled} aria-labelledby={`${inputId}-label ${inputId}-value`} data-invalid={Boolean(message) || undefined} aria-describedby={[description && `${inputId}-description`, message && `${inputId}-error`].filter(Boolean).join(" ") || undefined}><span id={`${inputId}-value`} data-placeholder={!selected || undefined}>{selected ? formatCalendarDate(selected, calendarProps.locale) : placeholder}</span><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="5" width="14" height="12" rx="1"/><path d="M6 2v6m8-6v6M3 10h14"/></svg></button></Primitive.Trigger>
        <Primitive.Portal><Primitive.Content className={uiClass("ui-date-picker-popup")} data-appearance={appearance} aria-label={`${label} calendar`} align="start" sideOffset={6} collisionPadding={16} onOpenAutoFocus={(event) => event.preventDefault()}><Calendar {...calendarProps} value={selected} onValueChange={change} appearance={appearance} autoFocus /></Primitive.Content></Primitive.Portal>
      </Primitive.Root>
      {clearable && selected && !disabled && <button type="button" className="ui-date-picker-clear" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { change(""); trigger.current?.focus(); }}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>}
      <input ref={native} className="ui-native-validity" aria-label={label} aria-hidden="true" aria-invalid={Boolean(message) || undefined} tabIndex={-1} name={name} form={form} type="text" required={required} disabled={disabled} value={selected} onChange={() => {}} onInvalid={(event) => { event.preventDefault(); trigger.current?.focus(); setOpen(true); }} />
    </div>
    {description && <p id={`${inputId}-description`} className="ui-help">{description}</p>}{message && <p id={`${inputId}-error`} className="ui-error" role="alert">{message}</p>}
  </div>;
}
