"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import "../../styles/keepsake-galleries.css";

export type PhotoGarlandProps = AppearanceProps & { photos?: readonly KeepsakePhoto[]; lights?: boolean; sway?: boolean; onSelect?: (photo: KeepsakePhoto) => void; theme?: CreativeTheme };
export function PhotoGarland({ photos = KEEPSAKE_PHOTOS, lights = true, sway = true, onSelect, theme = "auto", appearance = "polished", className }: PhotoGarlandProps) {
  const resolved = useCreativeTheme(theme), root = useRef<HTMLElement>(null), [selectedId, setSelectedId] = useState<string | null>(null);
  useMotionActivity(root);
  const [columns, setColumns] = useState(6);
  useEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setColumns(Math.max(3, Math.min(6, Math.floor(entry.contentRect.width / 90)))));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const items = photos.slice(0, 18), selected = items.find(({ id }) => id === selectedId);
  const rows = Array.from({ length: Math.ceil(items.length / columns) }, (_, row) => items.slice(row * columns, (row + 1) * columns));
  const wireY = (t: number) => 18 + 2 * 54 * t * (1 - t);
  return <section ref={root} className={["creative-surface interaction-surface photo-garland", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-lights={lights} data-sway={sway} aria-label="Hanging photo lights">
    <div className="photo-garland-stage" style={{ "--garland-columns": columns } as CSSProperties}>
      {items.length === 0 && <p className="keepsake-empty">Add photos to hang on the lights.</p>}
      {rows.map((photos, row) => <div className="garland-row" key={row} data-row={row}>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="garland-wire" aria-hidden="true"><path d="M20 18 Q500 72 980 18" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>
        {Array.from({ length: 13 }, (_, index) => { const t = (index + .5) / 13; return <span key={index} className="garland-light" aria-hidden="true" style={{ left: `${2 + t * 96}%`, top: `${wireY(t) * .8}px` }} />; })}
        {photos.map((photo, index) => { const t = (index + .5) / photos.length; return <button className="garland-photo" type="button" key={photo.id} aria-label={`View ${photo.title}`} aria-pressed={selectedId === photo.id} style={{ left: `${2 + t * 96}%`, top: `${wireY(t) * .8 + 12}px`, "--photo-rotation": `${[-4, 2, -3, 3, -2, 2][index % 6]}deg`, "--photo-delay": `${(row * columns + index) * -.73}s`, "--photo-width": `${Math.min(26, 80 / photos.length)}%` } as CSSProperties} onClick={() => { setSelectedId(photo.id); onSelect?.(photo); }}>
          <span className="keepsake-clip" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} draggable="false" /><span>{photo.title}</span>
        </button>; })}
      </div>)}
    </div>
    <div className="garland-caption" role="status"><strong>{selected?.title ?? "Keep the good days close."}</strong><span>{selected?.note ?? "Choose a photo on the string."}</span></div>
  </section>;
}
