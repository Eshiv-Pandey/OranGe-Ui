"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import { bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/keepsake-galleries.css";

export type JournalStackProps = AppearanceProps & { photos?: readonly KeepsakePhoto[]; value?: number; defaultValue?: number; onValueChange?: (index: number) => void; label?: string; theme?: CreativeTheme };
export function JournalStack({ photos = KEEPSAKE_PHOTOS, value, defaultValue = 2, onValueChange, label = "Collected days", theme = "auto", appearance = "polished", className }: JournalStackProps) {
  const [local, setLocal] = useState(defaultValue), resolved = useCreativeTheme(theme);
  const id = useId();
  const current = Math.round(bounded(value ?? local, 0, Math.max(0, photos.length - 1)));
  const start = useRef<{ x: number; y: number } | null>(null), swiped = useRef(false);
  const change = (next: number) => { const index = Math.round(bounded(next, 0, Math.max(0, photos.length - 1))); if (value === undefined) setLocal(index); if (index !== current) onValueChange?.(index); };
  return <section className={["creative-surface interaction-surface journal-stack", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label} aria-roledescription="carousel" onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); change(current + (event.key === "ArrowRight" ? 1 : -1)); } if (event.key === "Home" || event.key === "End") { event.preventDefault(); change(event.key === "Home" ? 0 : photos.length - 1); } }}>
    <h2>{label}</h2>
    <div className="journal-stack-stage" onPointerDown={(event) => { start.current = { x: event.clientX, y: event.clientY }; swiped.current = false; }} onPointerUp={(event) => { if (!start.current) return; const dx = event.clientX - start.current.x, dy = event.clientY - start.current.y; if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; change(current + (dx < 0 ? 1 : -1)); } start.current = null; }} onPointerCancel={() => { start.current = null; }}>
      {photos.length === 0 && <p className="journal-empty">Add a photograph to start your journal.</p>}
      {photos.map((photo, index) => {
        const offset = index - current;
        if (Math.abs(offset) > 4) return null;
        const pageId = `${id}-page-${index}`;
        return <button key={photo.id} type="button" className="journal-page" aria-labelledby={`${pageId}-title ${pageId}-note ${pageId}-left-number ${pageId}-postmark ${pageId}-stamp ${pageId}-right-number`} aria-describedby={`${pageId}-guidance ${pageId}-photo`} aria-pressed={index === current} tabIndex={index === current ? 0 : -1} style={{ "--page-offset": offset, "--page-depth": Math.abs(offset), "--page-side": Math.sign(offset), "--page-color": photo.color ?? "#8b9ca0", zIndex: 20 - Math.abs(offset) } as CSSProperties} onClick={() => { if (!swiped.current) change(index); swiped.current = false; }}>
          <span className="journal-spread">
            <span className="journal-leaf journal-leaf-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id={`${pageId}-photo`} src={photo.src} alt={photo.alt} draggable="false" />
              <span className="journal-paper-note"><span id={`${pageId}-title`} className="journal-page-title">{photo.title}</span>{" "}<span id={`${pageId}-note`} className="journal-page-note">{photo.note ?? "A moment worth keeping."}</span>{" "}</span>
              <span id={`${pageId}-left-number`} className="journal-page-number">{index * 2 + 1}</span>{" "}
            </span>
            <span className="journal-leaf journal-leaf-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[(index + 1) % photos.length].src} alt={photos.length > 1 ? photos[(index + 1) % photos.length].alt : ""} draggable="false" />
              <span className="journal-tape" aria-hidden="true" />
              <span id={`${pageId}-postmark`} className="journal-postmark">A day to remember</span>{" "}
              <span id={`${pageId}-stamp`} className="journal-page-stamp">{String(index + 1).padStart(2, "0")}</span>{" "}
              <span id={`${pageId}-right-number`} className="journal-page-number">{index * 2 + 2}</span>{" "}
            </span>
            <span className="journal-spine" aria-hidden="true" />
          </span>
          <span id={`${pageId}-guidance`} className="ix-sr">Page {index + 1} of {photos.length}. Use Left and Right arrow keys to change pages.</span>
        </button>;
      })}
    </div>
    {photos.length > 0 && <div className="ix-controls journal-stack-controls"><button className="ix-icon" type="button" aria-label="Previous journal page" disabled={current === 0} onClick={() => change(current - 1)}><InteractionIcon name="back" /></button><span role="status" aria-live="polite">{current + 1} <span>/ {photos.length}</span></span><button className="ix-icon" type="button" aria-label="Next journal page" disabled={current === photos.length - 1} onClick={() => change(current + 1)}><InteractionIcon name="next" /></button></div>}
  </section>;
}
