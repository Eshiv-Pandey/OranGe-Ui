"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, clamp, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import { useMotionActivity } from "./use-motion-activity";
import { createFilmPath } from "./endless-film-path";
import "../../styles/endless-film.css";

export type EndlessFilmProps = AppearanceProps & {
  photos?: readonly KeepsakePhoto[]; label?: string; theme?: CreativeTheme;
  speed?: number; paused?: boolean; interactive?: boolean;
  onSelect?: (photo: KeepsakePhoto) => void;
};
const SPACING = 148;
const wrap = (value: number, length: number) => ((value % length) + length) % length;

/** An original curling ribbon. Cursor position steers its feed; drag scrubs it. */
export function EndlessFilm({ photos = KEEPSAKE_PHOTOS, label = "Let the good days roll", theme = "auto", speed = 34, paused = false, interactive = true, onSelect, appearance = "polished", className }: EndlessFilmProps) {
  const root = useRef<HTMLElement>(null), frames = useRef<(SVGGElement | null)[]>([]), holes = useRef<(SVGPathElement | null)[]>([]);
  const phase = useRef(0), cursor = useRef(1), velocity = useRef(1), focus = useRef(false), drag = useRef<{ x: number; y: number; phase: number } | null>(null), moved = useRef(false);
  const [compact, setCompact] = useState(false), [stopped, setStopped] = useState(false), [reverse, setReverse] = useState(false), [reduced, setReduced] = useState(false), [selectedId, setSelectedId] = useState(photos[0]?.id);
  const resolved = useCreativeTheme(theme), uid = useId().replaceAll(":", ""), path = useMemo(() => createFilmPath(compact), [compact]);
  const slots = Math.ceil(path.length / SPACING) + 1, selected = photos.find(photo => photo.id === selectedId) ?? photos[0];
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 480));
    observer.observe(root.current); return () => observer.disconnect();
  }, []);
  function draw() {
    if (!photos.length) return;
    const normalized = wrap(phase.current, SPACING * photos.length), shift = normalized % SPACING, start = Math.floor(normalized / SPACING);
    frames.current.forEach((frame, slot) => {
      if (!frame) return;
      const distance = slot * SPACING - shift, point = path.at(distance), photoIndex = (start + slot) % photos.length;
      frame.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${point.angle.toFixed(2)})`);
      frame.style.visibility = distance < 0 || distance > path.length ? "hidden" : "visible";
      if (frame.dataset.photoIndex !== String(photoIndex)) { frame.dataset.photoIndex = String(photoIndex); frame.querySelector("image")?.setAttribute("href", photos[photoIndex].src); }
      frame.dataset.selected = String(photos[photoIndex].id === selected?.id);
    });
    holes.current.forEach(hole => hole?.setAttribute("stroke-dashoffset", String(-phase.current % 20)));
  }
  useEffect(draw, [path, photos, selected?.id]);
  useMotionActivity(root, { onStatus: status => setReduced(status === "reduced"), onFrame: ({ delta }) => {
    if (paused || stopped || focus.current || drag.current || !photos.length) return;
    velocity.current += (cursor.current - velocity.current) * .08;
    phase.current += clamp(speed, 0, 120) * velocity.current * (reverse ? -1 : 1) * delta / 1000;
    draw();
  } });
  function choose(photo: KeepsakePhoto) { setSelectedId(photo.id); setStopped(true); onSelect?.(photo); }
  function advance(direction: number) {
    if (!photos.length) return;
    const index = photos.findIndex(photo => photo.id === selected?.id), next = wrap(index + direction, photos.length);
    phase.current = next * SPACING; draw(); choose(photos[next]);
  }
  return <section ref={root} className={["creative-surface endless-film", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label}
    onFocusCapture={() => { focus.current = true; }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) focus.current = false; }}>
    <header className="endless-film-heading"><h2>{label}</h2><p>{interactive ? "Move to steer. Drag to find a moment." : "A ribbon of moments worth keeping."}</p></header>
    <div className="endless-film-stage" onPointerMove={event => {
      if (!interactive) return;
      if (drag.current) { const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y; if (Math.hypot(dx, dy) > 5) moved.current = true; phase.current = drag.current.phase - (dx + dy) * 1.8; draw(); }
      else if (event.pointerType === "mouse") { const bounds = event.currentTarget.getBoundingClientRect(); cursor.current = (event.clientX - bounds.left) / bounds.width * 4 - 2; }
    }} onPointerLeave={() => { cursor.current = 1; }} onPointerDown={event => {
      if (!interactive) return;
      drag.current = { x: event.clientX, y: event.clientY, phase: phase.current }; moved.current = false; event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerUp={event => {
      if (!drag.current) return;
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (!moved.current) {
        const frame = document.elementFromPoint(event.clientX, event.clientY)?.closest<SVGGElement>(".endless-film-frame");
        const photo = frame && photos[Number(frame.dataset.photoIndex)];
        if (photo) choose(photo);
      }
    }} onPointerCancel={() => { drag.current = null; }}>
      {!photos.length ? <p className="endless-film-empty">Add photos to start your reel.</p> : <svg viewBox={`0 0 ${compact ? 504 : 900} 720`} aria-hidden="true" className="endless-film-ribbon">
        <defs><clipPath id={`${uid}-frame`}><rect x="-55" y="-36" width="110" height="72" rx="1" /></clipPath></defs>
        <path d={path.center} className="endless-film-band" />
        {path.edges.map((edge, index) => <path key={index} ref={node => { holes.current[index] = node; }} d={edge} className="endless-film-holes" />)}
        {Array.from({ length: slots }, (_, slot) => { const point = path.at(slot * SPACING), photo = photos[slot % photos.length]; return <g key={slot} ref={node => { frames.current[slot] = node; }} className="endless-film-frame" data-photo-index={slot % photos.length} data-selected={photo.id === selected?.id} transform={`translate(${point.x} ${point.y}) rotate(${point.angle})`} onClick={event => { if (!moved.current) choose(photos[Number(event.currentTarget.dataset.photoIndex)]); }}>
          <image href={photo.src} x="-55" y="-36" width="110" height="72" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}-frame)`} />
          <rect x="-55" y="-36" width="110" height="72" rx="1" className="endless-film-frame-edge" />
        </g>; })}
      </svg>}
    </div>
    <footer className="endless-film-footer"><div role="status" aria-live="polite"><strong>{selected?.title ?? "Your story starts here"}</strong>{selected?.note && <p>{selected.note}</p>}</div><div className="endless-film-actions">
      <button type="button" onClick={() => advance(-1)} disabled={!photos.length} aria-label="Previous photo">Previous</button>
      <button type="button" aria-pressed={stopped || paused || reduced} disabled={paused || !photos.length || reduced} onClick={() => { focus.current = false; setStopped(!stopped); }}>{stopped || paused || reduced ? "Play film" : "Pause film"}</button>
      <button type="button" aria-pressed={reverse} onClick={() => setReverse(!reverse)} disabled={!photos.length}>Reverse</button>
      <button type="button" onClick={() => advance(1)} disabled={!photos.length} aria-label="Next photo">Next</button>
    </div></footer>
    {photos.length > 0 && <div className="endless-film-picker" aria-label="Choose a photograph">{photos.map(photo => <button type="button" key={photo.id} onClick={() => choose(photo)} aria-label={`Select ${photo.title}`} aria-pressed={photo.id === selected?.id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt="" loading="lazy" draggable="false" />
    </button>)}</div>}
  </section>;
}
