"use client";
import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Button } from "../button";
import type { AdaptiveCardProps } from "./types";
import "../../../styles/adaptive-cards.css";

export function useCardValue<T>(props: AdaptiveCardProps<T>, fallback: T): [T, (next: T) => void] {
  const [local, setLocal] = useState<T>(() => props.defaultValue ?? fallback);
  return [props.value ?? local, next => { if (props.value === undefined) setLocal(next); props.onChange?.(next); }];
}
export function CardFrame({ title, icon, kind, children, appearance = "polished", className, disabled }: { title: string; icon: ReactNode; kind: string; children: ReactNode; appearance?: AdaptiveCardProps<unknown>["appearance"]; className?: string; disabled?: boolean }) {
  return <section className={["adaptive-card ui ui-surface", className].filter(Boolean).join(" ")} data-appearance={appearance} data-kind={kind} data-disabled={disabled || undefined} aria-label={title}><header className="adaptive-card-heading">{icon}<h3>{title}</h3></header><div className="adaptive-card-body">{children}</div></section>;
}
export function CardField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId(); return <label className="adaptive-field" htmlFor={id}><span>{label}</span><input id={id} autoComplete="off" {...props} /></label>;
}
export function CardText({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId(); return <label className="adaptive-field" htmlFor={id}><span>{label}</span><textarea id={id} {...props} /></label>;
}
export function CardSelect({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const id = useId(); return <label className="adaptive-field" htmlFor={id}><span>{label}</span><select id={id} {...props}>{children}</select></label>;
}
export function CardSubmit<T>({ label, value, onSubmit, disabled, appearance, hidden }: { label: string; value: T; onSubmit?: (value: T) => void; disabled?: boolean; appearance?: AdaptiveCardProps<T>["appearance"]; hidden?: boolean }) {
  const [feedback, setFeedback] = useState("");
  if (hidden) return null;
  return <div className="adaptive-card-footer"><Button appearance={appearance} disabled={disabled} onClick={() => { onSubmit?.(value); setFeedback("Details ready to use."); }}>{label}</Button><span role="status">{feedback}</span></div>;
}
export function CopyValue({ value, disabled, appearance }: { value: string; disabled?: boolean; appearance?: AdaptiveCardProps<unknown>["appearance"] }) {
  const [feedback, setFeedback] = useState("");
  return <div className="adaptive-card-footer"><Button appearance={appearance} variant="secondary" disabled={disabled} onClick={async () => { try { await navigator.clipboard.writeText(value); setFeedback("Copied."); } catch { setFeedback("Copy unavailable. Select the value and copy it."); } }}>Copy value</Button><span role="status">{feedback}</span></div>;
}
export function CardError({ message }: { message?: string }) { return message ? <p className="adaptive-error" role="alert">{message}</p> : null; }

export function CardNumber({ label, value, onValueChange, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & { label: string; value: number; onValueChange: (value: number) => void }) {
  const formatted = Number.isFinite(value) ? String(value) : "";
  const [draft, setDraft] = useState({ value, text: formatted });
  if (!Object.is(draft.value, value)) setDraft({ value, text: formatted });
  return <CardField label={label} type="number" value={Object.is(draft.value, value) ? draft.text : formatted} {...props} onChange={event => { const text = event.target.value, next = event.target.valueAsNumber; setDraft({ value: next, text }); onValueChange(next); }} onBlur={event => { if (!event.target.value.trim()) setDraft({ value, text: formatted }); props.onBlur?.(event); }} />;
}
