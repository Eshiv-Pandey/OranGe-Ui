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
  return <section ref={root} className={["creative-surface interaction-surface photo-garland", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-lights={lights} data-sway={sway} aria-label="Hanging photo lights">
    <div className="photo-garland-stage">
      <svg viewBox="0 0 640 470" preserveAspectRatio="none" className="garland-wire" aria-hidden="true"><path d="M8 24Q320 188 632 24M8 226Q320 390 632 226" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      {items.length === 0 && <p className="keepsake-empty">Add photos to hang on the lights.</p>}
      {items.map((photo, index) => {
        const row = index >= columns ? 1 : 0, count = row ? items.length - columns : columns, t = ((index % columns) + .5) / count;
        const y = 24 + 164 * t * (1 - t) + row * 202;
        return <button className="garland-photo" type="button" key={photo.id} aria-label={`View ${photo.title}`} aria-pressed={selectedId === photo.id} style={{ left: `${(8 + t * 624) / 640 * 100}%`, top: `${y / 470 * 100}%`, "--photo-rotation": `${[-8, 5, -3, 7, -5][index % 5]}deg`, "--photo-delay": `${index * -.73}s`, "--photo-width": `${Math.min(22, 78 / Math.max(1, columns))}%` } as CSSProperties} onClick={() => { setSelectedId(photo.id); onSelect?.(photo); }}>
          <span className="garland-bulb" /><span className="keepsake-clip" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} draggable="false" /><span>{photo.title}</span>
        </button>;
      })}
    </div>
    <div className="garland-caption" role="status"><strong>{selected?.title ?? "Keep the good days close."}</strong><span>{selected?.note ?? "Choose a photo on the string."}</span></div>
  </section>;
}
