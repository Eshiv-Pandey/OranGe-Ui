"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeMotion, useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import { bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import { useReducedMotion } from "./portfolio/use-reduced-motion";
import "../../styles/keepsake-galleries.css";

export type JournalStackProps = AppearanceProps & { photos?: readonly KeepsakePhoto[]; value?: number; defaultValue?: number; onValueChange?: (index: number) => void; label?: string; theme?: CreativeTheme };
type PageTurn = { from: number; to: number; direction: "forward" | "backward" };

function JournalLeaf({ photos, index, side, id }: { photos: readonly KeepsakePhoto[]; index: number; side: "left" | "right"; id?: string }) {
  const photo = photos[index], right = side === "right";
  const image = right ? photos[(index + 1) % photos.length] : photo;
  return <span className={`journal-leaf journal-leaf-${side}`} style={{ "--page-color": photo.color ?? "#8b9ca0" } as CSSProperties}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img id={id && !right ? `${id}-photo` : undefined} src={image.src} alt={right && photos.length === 1 ? "" : image.alt} draggable="false" />
    {right ? <><span className="journal-tape" aria-hidden="true" /><span id={id && `${id}-postmark`} className="journal-postmark">A day to remember</span>{" "}<span id={id && `${id}-stamp`} className="journal-page-stamp">{String(index + 1).padStart(2, "0")}</span>{" "}</> : <span className="journal-paper-note"><span id={id && `${id}-title`} className="journal-page-title">{photo.title}</span>{" "}<span id={id && `${id}-note`} className="journal-page-note">{photo.note ?? "A moment worth keeping."}</span>{" "}</span>}
    <span id={id && `${id}-${side}-number`} className="journal-page-number">{index * 2 + (right ? 2 : 1)}</span>{" "}
  </span>;
}

/** One bound journal. A double-sided leaf turns around the central spine. */
export function JournalStack({ photos = KEEPSAKE_PHOTOS, value, defaultValue = 2, onValueChange, label = "Collected days", theme = "auto", appearance = "polished", className }: JournalStackProps) {
  const [local, setLocal] = useState(defaultValue), resolved = useCreativeTheme(theme);
  const reduced = useReducedMotion();
  const current = Math.round(bounded(value ?? local, 0, Math.max(0, photos.length - 1)));
  const [history, setHistory] = useState<{ index: number; turn: PageTurn | null }>({ index: current, turn: null });
  // Derive the transition before committing a changed selection, including
  // caller-controlled changes. Rapid navigation replaces the outgoing leaf.
  if (current !== history.index) setHistory({ index: current, turn: reduced ? null : { from: history.index, to: current, direction: current > history.index ? "forward" : "backward" } });
  else if (reduced && history.turn) setHistory({ index: current, turn: null });
  const turn = !reduced && history.turn && photos[history.turn.from] && photos[history.turn.to] ? history.turn : null;
  const ref = useRef<HTMLElement>(null), start = useRef<{ x: number; y: number } | null>(null), swiped = useRef(false);
  useCreativeMotion(ref);
  const id = `${useId()}-page-${current}`;
  const change = (next: number) => {
    const index = Math.round(bounded(next, 0, Math.max(0, photos.length - 1)));
    if (index === current) return;
    if (value === undefined) setLocal(index);
    onValueChange?.(index);
  };
  const forward = turn?.direction === "forward";
  return <section ref={ref} className={["creative-surface interaction-surface journal-stack", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label} aria-roledescription="carousel" onKeyDown={(event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); change(current + (event.key === "ArrowRight" ? 1 : -1)); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); change(event.key === "Home" ? 0 : photos.length - 1); }
  }}>
    <h2>{label}</h2>
    <div className="journal-stack-stage" onPointerDown={(event) => { start.current = { x: event.clientX, y: event.clientY }; swiped.current = false; }} onPointerUp={(event) => {
      if (!start.current) return;
      const dx = event.clientX - start.current.x, dy = event.clientY - start.current.y;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; change(current + (dx < 0 ? 1 : -1)); }
      start.current = null;
    }} onPointerCancel={() => { start.current = null; swiped.current = false; }}>
      {photos.length === 0 ? <p className="journal-empty">Add a photograph to start your journal.</p> : <div className="journal-book">
        <button type="button" className="journal-page" aria-labelledby={`${id}-title ${id}-note ${id}-left-number ${id}-postmark ${id}-stamp ${id}-right-number`} aria-describedby={`${id}-guidance ${id}-photo`} aria-pressed="true" onClick={(event) => {
          if (!swiped.current) {
            const box = event.currentTarget.getBoundingClientRect();
            change(current + (event.detail === 0 || event.clientX >= box.left + box.width / 2 ? 1 : -1));
          }
          swiped.current = false;
        }}>
          <span className="journal-spread"><JournalLeaf photos={photos} index={current} side="left" id={id} /><JournalLeaf photos={photos} index={current} side="right" id={id} /></span>
          <span id={`${id}-guidance`} className="ix-sr">Page {current + 1} of {photos.length}. Use Left and Right arrow keys to change pages.</span>
        </button>
        {turn && <>
          <span className={`journal-held-leaf journal-held-${forward ? "left" : "right"}`} aria-hidden="true"><JournalLeaf photos={photos} index={turn.from} side={forward ? "left" : "right"} /></span>
          <span key={`${turn.from}-${turn.to}`} className="journal-turn" data-direction={turn.direction} aria-hidden="true" onAnimationEnd={() => setHistory(previous => ({ ...previous, turn: null }))}>
            <span className="journal-turn-front"><JournalLeaf photos={photos} index={turn.from} side={forward ? "right" : "left"} /></span>
            <span className="journal-turn-back"><JournalLeaf photos={photos} index={turn.to} side={forward ? "left" : "right"} /></span>
          </span>
        </>}
        <span className="journal-spine" aria-hidden="true" />
      </div>}
    </div>
    {photos.length > 0 && <div className="ix-controls journal-stack-controls"><button className="ix-icon" type="button" aria-label="Previous journal page" disabled={current === 0} onClick={() => change(current - 1)}><InteractionIcon name="back" /></button><span role="status" aria-live="polite">{current + 1} <span>/ {photos.length}</span></span><button className="ix-icon" type="button" aria-label="Next journal page" disabled={current === photos.length - 1} onClick={() => change(current + 1)}><InteractionIcon name="next" /></button></div>}
  </section>;
}
