"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded } from "./interaction-utils";
import { useKineticValue } from "./kinetic-state";
import { KineticArrow } from "./kinetic-elements";
import "../../styles/kinetic-components.css";

export type ChoiceDialOption = { id: string; label: string; description?: string; icon?: ReactNode; disabled?: boolean };
export type ChoiceDialProps = AppearanceProps & {
  options: readonly ChoiceDialOption[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void;
  loop?: boolean; curve?: number; visibleOptions?: number; accent?: string; label?: string; theme?: CreativeTheme;
};

/** A curved, readable listbox with physical ticks, touch scrubbing and typeahead. */
export function ChoiceDial({ options, value, defaultValue, onValueChange, loop = false, curve = 1, visibleOptions = 5, accent = "#46765b", label = "Choose an option", theme = "auto", appearance = "polished", className }: ChoiceDialProps) {
  const enabled = options.filter(option => !option.disabled), [selected, choose] = useKineticValue(enabled.map(option => option.id), value, defaultValue, onValueChange);
  const index = Math.max(0, options.findIndex(option => option.id === selected)), enabledIndex = enabled.findIndex(option => option.id === selected), current = options[index];
  const root = useRef<HTMLDivElement>(null), gesture = useRef<{ y: number; index: number; option?: string } | null>(null), moved = useRef(false), wheelDelta = useRef(0), typeahead = useRef({ text: "", time: 0 });
  const latest = useRef({ enabled, selected, loop, choose }), id = useId(), resolved = useCreativeTheme(theme), radius = Math.floor(bounded(visibleOptions, 3, 9, 5) / 2);
  useEffect(() => { latest.current = { enabled, selected, loop, choose }; });
  function targetAt(position: number) { return enabled[loop && enabled.length ? ((position % enabled.length) + enabled.length) % enabled.length : Math.max(0, Math.min(enabled.length - 1, position))]; }
  function move(position: number) { const next = targetAt(position); if (next) choose(next.id); }
  const hasOptions = enabled.length > 0;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || !event.deltaY) return;
      const state = latest.current, position = state.enabled.findIndex(option => option.id === state.selected), direction = Math.sign(event.deltaY);
      if (!state.loop && (position <= 0 && direction < 0 || position >= state.enabled.length - 1 && direction > 0)) return;
      if (state.enabled.length < 2) return;
      event.preventDefault(); wheelDelta.current += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element!.clientHeight : 1);
      if (Math.abs(wheelDelta.current) < 42) return;
      const nextIndex = state.loop ? ((position + Math.sign(wheelDelta.current)) % state.enabled.length + state.enabled.length) % state.enabled.length : Math.max(0, Math.min(state.enabled.length - 1, position + Math.sign(wheelDelta.current)));
      wheelDelta.current = 0; state.choose(state.enabled[nextIndex].id);
    }
    element.addEventListener("wheel", wheel, { passive: false }); return () => element.removeEventListener("wheel", wheel);
  }, [hasOptions]);
  return <section className={["creative-surface choice-dial", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label} style={{ "--kinetic-accent": accent } as CSSProperties}>
    <div className="choice-dial-heading"><h3>{label}</h3><span>{enabled.length ? enabledIndex + 1 : 0} / {enabled.length}</span></div>
    {!enabled.length ? <p className="kinetic-empty">No available options.</p> : <>
      <div ref={root} className="choice-dial-wheel" role="listbox" tabIndex={0} aria-label={label} aria-activedescendant={`${id}-${index}`} onKeyDown={event => {
        const next = event.key === "ArrowDown" ? enabledIndex + 1 : event.key === "ArrowUp" ? enabledIndex - 1 : event.key === "PageDown" ? enabledIndex + 3 : event.key === "PageUp" ? enabledIndex - 3 : event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : null;
        if (next !== null) { event.preventDefault(); move(next); }
        else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") { const now = Date.now(), text = now - typeahead.current.time > 650 ? event.key : typeahead.current.text + event.key; typeahead.current = { text, time: now }; const match = enabled.find(option => option.label.toLocaleLowerCase().startsWith(text.toLocaleLowerCase())); if (match) choose(match.id); }
      }} onPointerDown={event => { if (event.button !== 0) return; const option = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="option"]')?.dataset.optionId : undefined; gesture.current = { y: event.clientY, index: enabledIndex, option }; moved.current = false; event.currentTarget.setPointerCapture(event.pointerId); root.current?.focus(); }} onPointerMove={event => { if (!gesture.current) return; const delta = gesture.current.y - event.clientY; if (Math.abs(delta) > 8) moved.current = true; move(gesture.current.index + Math.round(delta / 52)); }} onPointerUp={event => { if (!moved.current && gesture.current?.option) choose(gesture.current.option); gesture.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}>
        <div className="choice-dial-ticks" aria-hidden="true">{Array.from({ length: 21 }, (_, tick) => <i key={tick} data-center={tick === 10} style={{ "--tick-distance": Math.abs(tick - 10) } as CSSProperties} />)}</div>
        <div className="choice-dial-options">{options.map((option, position) => { const distance = position - index, active = option.id === selected; return <div id={`${id}-${position}`} key={option.id} role="option" aria-selected={active} aria-disabled={option.disabled || undefined} className="choice-dial-option" hidden={Math.abs(distance) > radius} data-selected={active} data-option-id={option.id} title={option.label} style={{ "--option-distance": distance, "--option-curve": bounded(curve, 0, 1.6, 1) } as CSSProperties} onClick={event => { if (event.detail === 0 && !option.disabled) choose(option.id); }}><span className="choice-dial-option-icon">{option.icon}</span><span>{option.label}</span>{active && <span className="choice-dial-dot" aria-hidden="true" />}</div>; })}</div>
      </div>
      <div className="choice-dial-footer"><p aria-live="polite">{current?.description ?? "Scroll, drag or use the arrow keys."}</p><div><button type="button" className="kinetic-icon" aria-label="Previous option" disabled={!loop && enabledIndex <= 0} onClick={() => move(enabledIndex - 1)}><KineticArrow direction="up" /></button><button type="button" className="kinetic-icon" aria-label="Next option" disabled={!loop && enabledIndex === enabled.length - 1} onClick={() => move(enabledIndex + 1)}><KineticArrow direction="down" /></button></div></div>
    </>}
  </section>;
}
