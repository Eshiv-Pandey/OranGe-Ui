"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import { bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/interaction-cards.css";

export type CardPosition = { x: number; y: number };
export type DraggableCardsProps = AppearanceProps & { items?: readonly KeepsakePhoto[]; onPositionChange?: (id: string, position: CardPosition) => void; theme?: CreativeTheme };
const DEFAULT_CARDS = KEEPSAKE_PHOTOS.slice(0, 4);
export function DraggableCards({ items = DEFAULT_CARDS, onPositionChange, theme = "auto", appearance = "polished", className }: DraggableCardsProps) {
  const [positions, setPositions] = useState<Record<string, CardPosition>>({}), [order, setOrder] = useState<Record<string, number>>({}), [held, setHeld] = useState<string | null>(null), [status, setStatus] = useState("");
  const root = useRef<HTMLDivElement>(null), drag = useRef<{ id: string; startX: number; startY: number; position: CardPosition; halfX: number; halfY: number; width: number; height: number } | null>(null), nextLayer = useRef(10), hint = useId(), resolved = useCreativeTheme(theme);
  const initial = (index: number) => ({ x: .5 + (index - (items.length - 1) / 2) * Math.min(.12, .5 / Math.max(1, items.length)), y: .5 + (index % 2 ? -.03 : .03) });
  function bounds(card: HTMLElement, width: number, height: number, index: number) {
    const angle = [-11, 8, -5, 12][index % 4] * Math.PI / 180;
    const w = card.offsetWidth, h = card.offsetHeight;
    // Keep the corners inside the field after the lifted card rotates back.
    return { halfX: Math.min(.48, (Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle))) / Math.max(1, width) / 2 + .012), halfY: Math.min(.48, (Math.abs(h * Math.cos(angle)) + Math.abs(w * Math.sin(angle))) / Math.max(1, height) / 2 + .012) };
  }
  function move(id: string, position: CardPosition, halfX: number, halfY: number) {
    const point = { x: bounded(position.x, halfX, 1 - halfX, .5), y: bounded(position.y, halfY, 1 - halfY, .5) };
    setPositions((current) => ({ ...current, [id]: point })); onPositionChange?.(id, point);
  }
  function finish() { drag.current = null; setHeld(null); }
  return <section className={["creative-surface interaction-surface draggable-cards", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label="Draggable photo cards">
    <div ref={root} className="draggable-cards-stage">
      {items.length === 0 && <p className="ix-caption">Add a card to start arranging.</p>}
      {items.map((item, index) => { const position = positions[item.id] ?? initial(index), cardId = `${hint}-card-${index}`; return <button type="button" key={item.id} className="draggable-card" data-held={held === item.id} aria-labelledby={`${cardId}-title ${cardId}-note`} aria-describedby={`${hint} ${cardId}-photo`} style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%`, zIndex: order[item.id] ?? index + 1, "--card-angle": `${held === item.id ? 0 : [-11, 8, -5, 12][index % 4]}deg` } as CSSProperties}
        onPointerDown={(event) => { if (event.button !== 0 || !root.current) return; const stage = root.current.getBoundingClientRect(), card = event.currentTarget; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { id: item.id, startX: event.clientX, startY: event.clientY, position, ...bounds(card, stage.width, stage.height, index), width: stage.width, height: stage.height }; setHeld(item.id); setOrder((current) => ({ ...current, [item.id]: nextLayer.current++ })); }}
        onPointerMove={(event) => { const held = drag.current; if (!held || held.id !== item.id) return; move(item.id, { x: held.position.x + (event.clientX - held.startX) / held.width, y: held.position.y + (event.clientY - held.startY) / held.height }, held.halfX, held.halfY); }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
        onKeyDown={(event) => { const stage = root.current; if (!stage) return; const direction = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[event.key]; if (event.key === "Escape") { event.preventDefault(); move(item.id, initial(index), .2, .2); setStatus(`${item.title} returned to its starting position.`); } if (!direction) return; event.preventDefault(); const amount = event.shiftKey ? 24 : 8; move(item.id, { x: position.x + direction[0] * amount / stage.clientWidth, y: position.y + direction[1] * amount / stage.clientHeight }, Math.min(.48, event.currentTarget.offsetWidth / stage.clientWidth / 2 + .02), Math.min(.48, event.currentTarget.offsetHeight / stage.clientHeight / 2 + .02)); setOrder((current) => ({ ...current, [item.id]: nextLayer.current++ })); setStatus(`${item.title} moved.`); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id={`${cardId}-photo`} src={item.src} alt={item.alt} draggable="false" /><strong id={`${cardId}-title`}>{item.title}</strong>{" "}<span id={`${cardId}-note`}>{item.note}</span>
      </button>; })}
    </div>
    <div className="draggable-cards-footer"><p className="ix-caption" id={hint}>Drag a card. Arrow keys move it. Escape puts it back.</p><button type="button" className="ix-icon" aria-label="Reset card positions" onClick={() => { setPositions({}); setOrder({}); setStatus("All cards returned to their starting positions."); }}><InteractionIcon name="reset" /></button></div><span className="ix-sr" role="status">{status}</span>
  </section>;
}
