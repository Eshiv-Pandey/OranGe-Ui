"use client";

import { useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import "../../styles/keepsake-galleries.css";

export type FilmStripProps = AppearanceProps & { photos?: readonly KeepsakePhoto[]; onSelect?: (photo: KeepsakePhoto) => void; theme?: CreativeTheme; label?: string };
export function FilmStrip({ photos = KEEPSAKE_PHOTOS, onSelect, theme = "auto", label = "The moments between", appearance = "polished", className }: FilmStripProps) {
  const [selectedId, setSelectedId] = useState(photos[0]?.id), resolved = useCreativeTheme(theme), selected = photos.find((photo) => photo.id === selectedId) ?? photos[0];
  return <section className={["creative-surface interaction-surface film-strip", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label}>
    <div className="film-strip-scroll" aria-label="Film photographs"><div className="film-strip-line">
      {photos.length === 0 && <p className="keepsake-empty">Add photos to fill the film frames.</p>}
      {photos.map((photo, index) => <button className="film-frame" type="button" key={photo.id} aria-label={`Select ${photo.title}, frame ${String(index + 1).padStart(2, "0")} A`} aria-pressed={selected?.id === photo.id} style={{ "--film-angle": `${[-6, 17, 3, -11, 8, -4][index % 6]}deg`, "--film-shift": `${[0, 12, 2, 9, -2, 4][index % 6]}px`, zIndex: selected?.id === photo.id ? 2 : 1 } as CSSProperties} onClick={() => { setSelectedId(photo.id); onSelect?.(photo); }}>
        <span className="film-clip" aria-hidden="true"><i /><i /></span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} draggable="false" /><span className="film-index" aria-hidden="true">{String(index + 1).padStart(2, "0")} A</span>
      </button>)}
    </div></div>
    <div className="film-strip-caption"><h2>{label}</h2><div role="status"><strong>{selected?.title ?? "Your story starts here."}</strong><p>{selected?.note ?? "Choose a frame to find your way back."}</p></div></div>
  </section>;
}
