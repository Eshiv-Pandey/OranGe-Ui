"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/interaction-controls.css";

export type MorphInputProps = AppearanceProps & { label?: string; placeholder?: string; value?: string; defaultValue?: string; defaultOpen?: boolean; disabled?: boolean; onValueChange?: (value: string) => void; onSubmit?: (value: string) => void; theme?: CreativeTheme };
export function MorphInput({ label = "Find something good", placeholder = "Search the collection...", value, defaultValue = "", defaultOpen = false, disabled = false, onValueChange, onSubmit, theme = "auto", appearance = "polished", className }: MorphInputProps) {
  const [open, setOpen] = useState(defaultOpen), [local, setLocal] = useState(defaultValue), [submitted, setSubmitted] = useState("");
  const input = useRef<HTMLInputElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId().replace(/:/g, ""), resolved = useCreativeTheme(theme), text = value ?? local;
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div className={["creative-surface interaction-surface morph-input", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-open={open}>
    <label className="morph-input-label" htmlFor={id}>{label}</label>
    <svg width="0" height="0" className="morph-defs" aria-hidden="true"><defs><filter id={`${id}-goo`} x="-25%" y="-75%" width="150%" height="250%"><feGaussianBlur in="SourceGraphic" stdDeviation="6" /><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -8" /></filter></defs></svg>
    <form className="morph-input-form" onSubmit={(event) => { event.preventDefault(); if (disabled || !text.trim()) return; onSubmit?.(text.trim()); setSubmitted(text.trim()); }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}>
      <span className="morph-input-fluid" style={{ filter: `url(#${id}-goo)` }} aria-hidden="true"><i /><i /></span>
      <button ref={trigger} type="button" className="morph-input-trigger" aria-label={open ? "Close search" : "Open search"} aria-expanded={open} aria-controls={`${id}-field`} disabled={disabled} onClick={() => { if (open) close(); else setOpen(true); }}><InteractionIcon name={open ? "close" : "search"} /></button>
      {open && <div className="morph-input-field" id={`${id}-field`}><input ref={input} id={id} type="search" value={text} placeholder={placeholder} disabled={disabled} autoComplete="off" onChange={(event) => { if (value === undefined) setLocal(event.target.value); onValueChange?.(event.target.value); }} /><button type="submit" aria-label="Submit search" disabled={disabled || !text.trim()}><InteractionIcon name="next" /></button></div>}
    </form>
    <span className="ix-sr" role="status">{submitted ? `Submitted: ${submitted}` : ""}</span>
  </div>;
}
