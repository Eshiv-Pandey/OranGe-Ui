"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useControllableValue } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type CarouselItem = { value: string; label?: string; content: ReactNode };
export type CarouselProps = AppearanceProps & {
  label: string;
  items: readonly CarouselItem[];
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  loop?: boolean;
  showIndicators?: boolean;
  dir?: "ltr" | "rtl";
};

const clampIndex = (value: number, length: number) => Math.max(0, Math.min(Math.max(0, length - 1), Number.isFinite(value) ? Math.trunc(value) : 0));
const editing = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="combobox"], [role="spinbutton"], [data-carousel-no-swipe]'));

export function Carousel({ label, items, index, defaultIndex = 0, onIndexChange, loop = false, showIndicators = true, dir = "ltr", appearance = "polished", className }: CarouselProps) {
  const id = useId();
  const [stored, setStored] = useControllableValue(index, defaultIndex, onIndexChange);
  const current = clampIndex(stored, items.length);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const select = (next: number) => {
    if (!items.length) return;
    const selected = loop ? ((next % items.length) + items.length) % items.length : clampIndex(next, items.length);
    if (selected !== current) setStored(selected);
  };
  return <section className={uiClass("ui-carousel", className)} data-appearance={appearance} role="region" aria-roledescription="carousel" aria-label={label} dir={dir} onKeyDown={(event) => {
    if (event.defaultPrevented || editing(event.target) || !items.length) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); select(current + (event.key === "ArrowRight" ? 1 : -1) * (dir === "rtl" ? -1 : 1)); }
    else if (event.key === "Home") { event.preventDefault(); select(0); }
    else if (event.key === "End") { event.preventDefault(); select(items.length - 1); }
  }}>
    <div className="ui-carousel-viewport ui-surface" tabIndex={items.length ? 0 : undefined} aria-label={`${label} slides`} onPointerDown={(event) => {
      if (event.pointerType === "mouse" || event.isPrimary === false || editing(event.target) || (event.target as Element).closest("a, button")) return;
      pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }} onPointerUp={(event) => {
      const start = pointer.current;
      pointer.current = null;
      if (!start || start.id !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      const x = event.clientX - start.x, y = event.clientY - start.y;
      if (Math.abs(x) >= 40 && Math.abs(x) > Math.abs(y) * 1.25) select(current + (x < 0 ? 1 : -1) * (dir === "rtl" ? -1 : 1));
    }} onPointerCancel={() => { pointer.current = null; }} onLostPointerCapture={() => { pointer.current = null; }}>
      {items.length ? <div className="ui-carousel-track" style={{ "--carousel-offset": `${(dir === "rtl" ? 1 : -1) * current * 100}%` } as CSSProperties}>{items.map((item, position) => <div key={item.value} id={`${id}-slide-${position}`} className="ui-carousel-slide" role="group" aria-roledescription="slide" aria-label={`${item.label ? `${item.label}, ` : ""}${position + 1} of ${items.length}`} aria-hidden={position !== current} inert={position !== current}>{item.content}</div>)}</div> : <p className="ui-carousel-empty">No slides to display.</p>}
    </div>
    {items.length > 0 && <div className="ui-carousel-controls">
      <button type="button" className="ui-icon-button ui-carousel-previous" aria-label="Previous slide" disabled={items.length < 2 || (!loop && current === 0)} onClick={() => select(current - 1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={dir === "rtl" ? "M9 5L16 12L9 19" : "M15 5L8 12L15 19"} /></svg></button>
      {showIndicators && <div className="ui-carousel-indicators" role="group" aria-label="Choose slide">{items.map((item, position) => <button key={item.value} type="button" aria-label={`Go to slide ${position + 1}${item.label ? `: ${item.label}` : ""}`} aria-current={position === current ? "true" : undefined} aria-controls={`${id}-slide-${position}`} onClick={() => select(position)}><span /></button>)}</div>}
      <span className="ui-carousel-status" role="status" aria-live="polite" aria-atomic="true">{current + 1} / {items.length}</span>
      <button type="button" className="ui-icon-button ui-carousel-next" aria-label="Next slide" disabled={items.length < 2 || (!loop && current === items.length - 1)} onClick={() => select(current + 1)}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={dir === "rtl" ? "M15 5L8 12L15 19" : "M9 5L16 12L9 19"} /></svg></button>
    </div>}
  </section>;
}
