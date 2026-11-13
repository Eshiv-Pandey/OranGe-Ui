"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded } from "./interaction-utils";
import { KineticArrow, KineticImage } from "./kinetic-elements";
import { useKineticValue } from "./kinetic-state";
import "../../styles/kinetic-components.css";

export type SpringDeckItem = { id: string; image: string; alt: string; title: string; description?: string; href?: string; color?: string };
export type SpringDeckProps = AppearanceProps & {
  items: readonly SpringDeckItem[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void;
  spread?: number; tilt?: number; cardWidth?: number; accent?: string; label?: string; theme?: CreativeTheme;
};

/** A browsable photo hand with a persistent featured card and an elastic arch. */
export function SpringDeck({ items, value, defaultValue, onValueChange, spread = 1, tilt = 6, cardWidth = 180, accent = "#be5837", label = "Photo collection", theme = "auto", appearance = "polished", className }: SpringDeckProps) {
  const [selected, choose] = useKineticValue(items.map(item => item.id), value, defaultValue, onValueChange);
  const [hovered, setHovered] = useState<string>();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]), drag = useRef<{ x: number; y: number } | null>(null), dragged = useRef(false);
  const index = Math.max(0, items.findIndex(item => item.id === selected)), item = items[index], resolved = useCreativeTheme(theme);
  function move(next: number, focus = false) { const target = items[Math.max(0, Math.min(items.length - 1, next))]; if (!target) return; choose(target.id); if (focus) buttons.current[next]?.focus(); }
  return <section className={["creative-surface spring-deck", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label} style={{ "--kinetic-accent": accent, "--deck-width": `${bounded(cardWidth, 120, 260, 180)}px`, "--deck-spread": bounded(spread, .4, 1.8, 1) } as CSSProperties}>
    {!item ? <p className="kinetic-empty">Add photos to start your collection.</p> : <>
      <div className="spring-deck-stage" onPointerLeave={() => setHovered(undefined)} onPointerDown={event => { if (event.button === 0) { drag.current = { x: event.clientX, y: event.clientY }; dragged.current = false; } }} onPointerMove={event => { if (drag.current && Math.abs(event.clientX - drag.current.x) > 12) dragged.current = true; }} onPointerUp={event => { if (!drag.current) return; const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y; drag.current = null; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(index + (dx < 0 ? 1 : -1)); }} onPointerCancel={() => { drag.current = null; }}>
        {items.map((photo, position) => { const distance = position - index, active = photo.id === selected, over = photo.id === hovered, visible = Math.abs(distance) <= 3;
          return <button key={photo.id} ref={element => { buttons.current[position] = element; }} type="button" className="spring-deck-card" data-distance={Math.abs(distance)} data-selected={active} hidden={!visible} tabIndex={active ? 0 : -1} aria-pressed={active} aria-label={`Select ${photo.title}`} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(photo.id); }} onClick={() => { if (!dragged.current) choose(photo.id); dragged.current = false; }} onKeyDown={event => { const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null; if (next !== null) { event.preventDefault(); move(Math.max(0, Math.min(items.length - 1, next)), true); } }} style={{ "--deck-distance": distance, "--deck-y": `${active || over ? -22 : Math.abs(distance) * 10}px`, "--deck-rotation": `${active || over ? 0 : distance * bounded(tilt, 0, 12, 6)}deg`, "--deck-z": over ? 30 : active ? 20 : 10 - Math.abs(distance), "--deck-color": photo.color ?? "#f0e7d7" } as CSSProperties}>
            <KineticImage src={photo.image} alt={photo.alt} /><span className="spring-deck-card-title">{photo.title}</span>
          </button>;
        })}
      </div>
      <div className="spring-deck-footer"><div className="spring-deck-story" aria-live="polite"><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.href && <a href={item.href}>Explore this story <KineticArrow /></a>}</div><div className="spring-deck-navigation"><span>{index + 1} / {items.length}</span><button type="button" className="kinetic-icon" aria-label="Previous photo" disabled={index === 0} onClick={() => move(index - 1)}><KineticArrow direction="left" /></button><button type="button" className="kinetic-icon" aria-label="Next photo" disabled={index === items.length - 1} onClick={() => move(index + 1)}><KineticArrow /></button></div></div>
    </>}
  </section>;
}
