"use client";

import { useId, useRef, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded } from "./interaction-utils";
import { KineticArrow, KineticImage } from "./kinetic-elements";
import { useKineticValue } from "./kinetic-state";
import "../../styles/kinetic-components.css";

export type ApertureGalleryItem = { id: string; image: string; alt: string; title: string; description?: string; href?: string; objectPosition?: string };
export type ApertureGalleryProps = AppearanceProps & {
  items: readonly ApertureGalleryItem[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void;
  trigger?: "click" | "hover"; orientation?: "horizontal" | "vertical"; height?: number; expand?: number; parallax?: number;
  accent?: string; label?: string; theme?: CreativeTheme;
};

/** An adjoining photo frame opens one aperture and keeps its caption outside the image. */
export function ApertureGallery({ items, value, defaultValue, onValueChange, trigger = "click", orientation = "horizontal", height = 360, expand = 4, parallax = .5, accent = "#b86c3b", label = "Image gallery", theme = "auto", appearance = "polished", className }: ApertureGalleryProps) {
  const [selected, choose] = useKineticValue(items.map(item => item.id), value, defaultValue, onValueChange);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]), id = useId(), resolved = useCreativeTheme(theme);
  const index = Math.max(0, items.findIndex(item => item.id === selected)), current = items[index];
  return <section className={["creative-surface aperture-gallery", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-orientation={orientation} aria-label={label} style={{ "--kinetic-accent": accent, "--aperture-height": `${bounded(height, 220, 640, 360)}px`, "--aperture-expand": bounded(expand, 2, 7, 4) } as CSSProperties}>
    {!current ? <p className="kinetic-empty">Add images to open your gallery.</p> : <>
      <div className="aperture-gallery-frame">{items.map((item, position) => { const active = item.id === selected; return <button key={item.id} ref={element => { buttons.current[position] = element; }} type="button" className="aperture-gallery-panel" data-selected={active} aria-expanded={active} aria-controls={`${id}-caption`} aria-label={`Show ${item.title}`} tabIndex={active ? 0 : -1} onFocus={() => choose(item.id)} onClick={() => choose(item.id)} onPointerEnter={event => { if (trigger === "hover" && event.pointerType === "mouse") choose(item.id); }} onPointerMove={event => { if (!active || event.pointerType !== "mouse") return; const box = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--aperture-x", `${((event.clientX - box.left) / box.width - .5) * bounded(parallax, 0, 1, .5) * 12}px`); }} onPointerLeave={event => event.currentTarget.style.setProperty("--aperture-x", "0px")} onKeyDown={event => { const next = ["ArrowRight", "ArrowDown"].includes(event.key) ? position + 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? position - 1 : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null; if (next !== null) { event.preventDefault(); const target = Math.max(0, Math.min(items.length - 1, next)); choose(items[target].id); buttons.current[target]?.focus(); } }}>
        <KineticImage src={item.image} alt={item.alt} style={{ objectPosition: item.objectPosition ?? "center" }} /><span className="aperture-gallery-panel-label">{item.title}</span><span className="aperture-gallery-panel-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4 10-10" /></svg></span>
      </button>; })}</div>
      <div id={`${id}-caption`} className="aperture-gallery-caption" aria-live="polite"><div><h3>{current.title}</h3>{current.description && <p>{current.description}</p>}</div>{current.href ? <a href={current.href} aria-label={`Explore ${current.title}`}>Explore <KineticArrow /></a> : <span>{index + 1} / {items.length}</span>}</div>
    </>}
  </section>;
}
