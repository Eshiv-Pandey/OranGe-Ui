"use client";

import { Popover as Primitive } from "radix-ui";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type ComboboxOption = { value: string; label: string; description?: string; keywords?: string[]; disabled?: boolean };
export type ComboboxProps = AppearanceProps & {
  label: string; options: readonly ComboboxOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
  name?: string; id?: string; placeholder?: string; emptyMessage?: string; disabled?: boolean; required?: boolean; error?: string; description?: string; clearable?: boolean;
};

export function Combobox({ label, options, value, defaultValue = "", onValueChange, name, id, placeholder = "Search or choose...", emptyMessage = "No matching options.", disabled, required, error, description, clearable = true, appearance = "polished", className }: ComboboxProps) {
  const generated = useId(), inputId = id ?? `combobox-${generated}`, input = useRef<HTMLInputElement>(null), anchor = useRef<HTMLDivElement>(null), activeRef = useRef<HTMLButtonElement>(null);
  const [internal, setInternal] = useState(defaultValue), [open, setOpen] = useState(false), [query, setQuery] = useState(""), [active, setActive] = useState(0);
  const selectedValue = value ?? internal, selected = options.find((option) => option.value === selectedValue);
  const filtered = options.filter((option) => `${option.label} ${option.description ?? ""} ${(option.keywords ?? []).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  const enabled = filtered.filter((option) => !option.disabled), current = enabled[Math.min(active, Math.max(0, enabled.length - 1))];
  const listId = `${inputId}-list`, currentId = current ? `${inputId}-option-${filtered.indexOf(current)}` : undefined;
  useEffect(() => { if (open) activeRef.current?.scrollIntoView?.({ block: "nearest" }); }, [current, open]);
  useEffect(() => { input.current?.setCustomValidity(required && !selected || selectedValue && (!selected || selected.disabled) ? "Choose an available option from the list." : ""); }, [required, selected, selectedValue]);
  useEffect(() => {
    const owner = input.current?.form;
    const reset = (event: Event) => { queueMicrotask(() => { if (event.defaultPrevented) return; if (value === undefined) setInternal(defaultValue); setOpen(false); setQuery(""); }); };
    owner?.addEventListener("reset", reset); return () => owner?.removeEventListener("reset", reset);
  }, [value, defaultValue]);
  function choose(next: string) { if (value === undefined) setInternal(next); onValueChange?.(next); setOpen(false); setQuery(""); input.current?.focus(); }
  function openList() { if (!disabled) { setOpen(true); setQuery(""); setActive(0); } }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); if (!open) { openList(); setActive(event.key === "ArrowUp" ? Math.max(0, options.filter((option) => !option.disabled).length - 1) : 0); } else setActive((index) => enabled.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length : 0); }
    else if (open && (event.key === "Home" || event.key === "End")) { event.preventDefault(); setActive(event.key === "Home" ? 0 : Math.max(0, enabled.length - 1)); }
    else if (open && event.key === "Enter") { event.preventDefault(); if (current) choose(current.value); }
    else if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); setQuery(""); }
    else if (event.key === "Tab") { setOpen(false); setQuery(""); }
  }
  return <div className={uiClass("ui-combobox ui-launch-field", className)} data-appearance={appearance}>
    <label htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <Primitive.Root open={open && !disabled} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(""); }}>
      <Primitive.Anchor asChild><div ref={anchor} className="ui-combobox-anchor"><input ref={input} id={inputId} role="combobox" aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={open && !disabled ? listId : undefined} aria-activedescendant={open && !disabled ? currentId : undefined} aria-autocomplete="list" aria-invalid={Boolean(error) || undefined} aria-describedby={[description && `${inputId}-description`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined} autoComplete="off" disabled={disabled} aria-required={required} value={open ? query : selected?.label ?? ""} placeholder={placeholder} onClick={() => { if (!open) openList(); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0); }} onKeyDown={keyDown} />
        {clearable && selectedValue && <button type="button" className="ui-combobox-clear" aria-label={`Clear ${label.toLowerCase()}`} disabled={disabled} onClick={() => { choose(""); input.current?.focus(); }}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>}
        <button type="button" className="ui-combobox-toggle" aria-label={`Show ${label.toLowerCase()} options`} disabled={disabled} tabIndex={-1} onClick={() => { if (open) setOpen(false); else openList(); input.current?.focus(); }}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>
      </div></Primitive.Anchor>
      <Primitive.Portal><Primitive.Content role="presentation" className={uiClass("ui-combobox-popup ui-surface")} data-appearance={appearance} align="start" sideOffset={6} collisionPadding={16} onInteractOutside={(event) => { if (event.target instanceof Node && anchor.current?.contains(event.target)) event.preventDefault(); }} onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => event.preventDefault()}>
        <div id={listId} role="listbox" aria-label={`${label} options`} className="ui-combobox-list">
          {filtered.map((option, index) => <button key={option.value} ref={option === current ? activeRef : undefined} type="button" role="option" id={`${inputId}-option-${index}`} aria-selected={option.value === selectedValue} aria-disabled={option.disabled || undefined} disabled={option.disabled} tabIndex={-1} data-active={option === current || undefined} className="ui-combobox-option" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option.value)}><span>{option.label}{option.description && <small>{option.description}</small>}</span>{option.value === selectedValue && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>}</button>)}
          {!filtered.length && <div role="option" aria-selected="false" aria-disabled="true" className="ui-combobox-empty">{emptyMessage}</div>}
        </div>
        <span className="sr-only" role="status">{enabled.length} available options.</span>
      </Primitive.Content></Primitive.Portal>
    </Primitive.Root>
    {name && <input type="hidden" name={name} value={selectedValue} disabled={disabled} />}
    {description && <p className="ui-help" id={`${inputId}-description`}>{description}</p>}{error && <p className="ui-error" id={`${inputId}-error`} role="alert">{error}</p>}
  </div>;
}
