"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import "../../styles/keepsake-galleries.css";

export type PhotoGarlandProps = AppearanceProps & { photos?: readonly KeepsakePhoto[]; lights?: boolean; sway?: boolean; onSelect?: (photo: KeepsakePhoto) => void; theme?: CreativeTheme };
export function PhotoGarland({ photos = KEEPSAKE_PHOTOS, lights = true, sway = true, onSelect, theme = "auto", appearance = "polished", className }: PhotoGarlandProps) {
  const resolved = useCreativeTheme(theme), root = useRef<HTMLElement>(null), [selectedId, setSelectedId] = useState<string | null>(null);
  useMotionActivity(root);
  const items = photos.slice(0, 10), columns = Math.ceil(items.length / 2), selected = items.find(({ id }) => id === selectedId);
  const strings = items.length > 1 ? [{ edge: 120, sag: 240 }, { edge: 440, sag: 260 }] : [{ edge: 220, sag: 280 }];
  // The wire and its attachments share this exact quadratic curve.
  const wireY = (t: number, row: number) => strings[row].edge + 2 * strings[row].sag * t * (1 - t);
  return <section ref={root} className={["creative-surface interaction-surface photo-garland", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-lights={lights} data-sway={sway} aria-label="Hanging photo lights">
    <div className="photo-garland-stage">
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="garland-wire" aria-hidden="true">{strings.map(({ edge, sag }, row) => <g key={row} fill="none"><path d={`M20 ${edge + 2} Q500 ${edge + sag + 2} 980 ${edge + 2}`} stroke="#101918" strokeOpacity=".12" strokeWidth="3" /><path d={`M20 ${edge} Q500 ${edge + sag} 980 ${edge}`} stroke="currentColor" strokeWidth="1.3" vectorEffect="non-scaling-stroke" /><circle cx="20" cy={edge} r="2" fill="currentColor" /><circle cx="980" cy={edge} r="2" fill="currentColor" /></g>)}</svg>
      {strings.flatMap((_, row) => Array.from({ length: 11 }, (_, index) => { const t = (index + .5) / 11; return <span key={`${row}-${index}`} className="garland-light" aria-hidden="true" style={{ left: `${2 + t * 96}%`, top: `${wireY(t, row) / 10}%` }} />; }))}
      {items.length === 0 && <p className="keepsake-empty">Add photos to hang on the lights.</p>}
      {items.map((photo, index) => {
        const row = index >= columns ? 1 : 0, count = row ? items.length - columns : columns, t = ((index % columns) + .5) / count;
        const y = wireY(t, row);
        return <button className="garland-photo" type="button" key={photo.id} aria-label={`View ${photo.title}`} aria-pressed={selectedId === photo.id} style={{ left: `${2 + t * 96}%`, top: `calc(${y / 10}% + 12px)`, "--photo-rotation": `${[-6, 3, -4, 4, -2][index % 5]}deg`, "--photo-delay": `${index * -.73}s`, "--photo-width": `${Math.min(25, 72 / Math.max(1, columns))}%` } as CSSProperties} onClick={() => { setSelectedId(photo.id); onSelect?.(photo); }}>
          <span className="keepsake-clip" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} draggable="false" /><span>{photo.title}</span>
        </button>;
      })}
    </div>
    <div className="garland-caption" role="status"><strong>{selected?.title ?? "Keep the good days close."}</strong><span>{selected?.note ?? "Choose a photo on the string."}</span></div>
  </section>;
}
