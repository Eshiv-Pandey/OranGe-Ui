"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppearanceProps } from './appearance';
import { useCreativeTheme, clamp, type CreativeTheme } from './creative-surface';
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from './keepsake-photos';
import { useMotionActivity } from './use-motion-activity';
import { FILM_FRAME_SPACING } from './endless-film-path';
import type { EndlessFilmRenderer } from './endless-film-renderer';
import '../../styles/endless-film.css';

export type EndlessFilmProps = AppearanceProps & {
  photos?: readonly KeepsakePhoto[]; label?: string; theme?: CreativeTheme;
  speed?: number; paused?: boolean; interactive?: boolean;
  onSelect?: (photo: KeepsakePhoto) => void;
};
const wrap = (value: number, length: number) => ((value % length) + length) % length;

/** A textured, curling photographic ribbon. Scroll feeds it; dragging scrubs it. */
export function EndlessFilm({ photos = KEEPSAKE_PHOTOS, label = 'Let the good days roll', theme = 'auto', speed = 34, paused = false, interactive = true, onSelect, appearance = 'polished', className }: EndlessFilmProps) {
  const root = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), renderer = useRef<EndlessFilmRenderer | null>(null);
  const phase = useRef(0), cursor = useRef(1), velocity = useRef(1), focus = useRef(false), paintTime = useRef(0);
  const drag = useRef<{ x: number; y: number; phase: number; touch: boolean } | null>(null), moved = useRef(false);
  const [stopped, setStopped] = useState(false), [reverse, setReverse] = useState(false), [reduced, setReduced] = useState(false), [selectedId, setSelectedId] = useState(photos[0]?.id);
  const resolved = useCreativeTheme(theme), selected = photos.find(photo => photo.id === selectedId) ?? photos[0];
  const selectedIndex = useRef(0);
  const draw = useCallback(() => {
    if (!photos.length) return;
    phase.current = wrap(phase.current, FILM_FRAME_SPACING * photos.length);
    root.current?.setAttribute('data-phase', phase.current.toFixed(2));
    renderer.current?.update(phase.current);
  }, [photos.length]);
  useEffect(() => {
    const element = canvas.current;
    if (!element || !photos.length) return;
    const controller = new AbortController();
    if (stage.current) stage.current.dataset.renderer = 'loading';
    void import('./endless-film-renderer').then(module => module.createEndlessFilmRenderer(element, photos, controller.signal)).then(owner => {
      if (controller.signal.aborted) { owner?.destroy(); return; }
      renderer.current = owner; owner?.select(selectedIndex.current); owner?.update(phase.current);
    }).catch(() => { if (!controller.signal.aborted && stage.current) stage.current.dataset.renderer = 'fallback'; });
    return () => { controller.abort(); renderer.current?.destroy(); renderer.current = null; };
  }, [photos]);
  useEffect(() => { selectedIndex.current = Math.max(0, photos.findIndex(photo => photo.id === selected?.id)); renderer.current?.select(selectedIndex.current); }, [photos, selected?.id]);
  useEffect(() => {
    const element = root.current, surface = stage.current;
    if (!element || !surface || !interactive || !photos.length) return;
    const positions = new Map<EventTarget, number>();
    positions.set(document, window.scrollY);
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) positions.set(ancestor, ancestor.scrollTop);
    function scroll(event: Event) {
      const target = event.target;
      if (target !== document && (!(target instanceof HTMLElement) || !target.contains(element))) return;
      const bounds = element!.getBoundingClientRect();
      const current = target === document ? window.scrollY : (target as HTMLElement).scrollTop;
      const previous = positions.get(target!) ?? current; positions.set(target!, current);
      if (document.hidden || bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      phase.current += (current - previous) * .85; draw();
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || !event.deltaX && !event.deltaY) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface!.clientHeight : 1;
      phase.current += (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * unit * .85; draw();
    }
    document.addEventListener('scroll', scroll, { capture: true, passive: true });
    surface.addEventListener('wheel', wheel, { passive: false });
    return () => { document.removeEventListener('scroll', scroll, true); surface.removeEventListener('wheel', wheel); };
  }, [interactive, photos.length, draw]);
  useMotionActivity(root, { onStatus: status => setReduced(status === 'reduced'), onFrame: ({ delta }) => {
    if (paused || stopped || focus.current || drag.current || !photos.length) return;
    velocity.current += (cursor.current - velocity.current) * (1 - Math.exp(-delta / 150));
    phase.current += clamp(speed, 0, 120) * velocity.current * (reverse ? -1 : 1) * delta / 1000;
    paintTime.current += delta;
    if (paintTime.current >= 1000 / 30) { paintTime.current = 0; draw(); }
  } });
  function choose(photo: KeepsakePhoto) { setSelectedId(photo.id); setStopped(true); onSelect?.(photo); }
  function advance(direction: number) {
    if (!photos.length) return;
    const index = photos.findIndex(photo => photo.id === selected?.id), next = wrap(index + direction, photos.length);
    phase.current = next * FILM_FRAME_SPACING; draw(); choose(photos[next]);
  }
  return <section ref={root} className={['creative-surface endless-film', className].filter(Boolean).join(' ')} data-theme={resolved} data-appearance={appearance} aria-label={label}
    onFocusCapture={() => { focus.current = true; }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) focus.current = false; }}>
    <header className="endless-film-heading"><h2>{label}</h2><p>{interactive ? 'Scroll to roll. Drag to find a moment.' : 'A ribbon of moments worth keeping.'}</p></header>
    <div ref={stage} className="endless-film-stage" onPointerMove={event => {
      if (!interactive) return;
      if (drag.current) {
        const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
        if (drag.current.touch && Math.abs(dy) > Math.abs(dx)) return;
        if (Math.hypot(dx, dy) > 5) moved.current = true;
        phase.current = drag.current.phase - (dx + (drag.current.touch ? 0 : dy)) * 1.8; draw();
      } else if (event.pointerType === 'mouse') {
        const bounds = event.currentTarget.getBoundingClientRect(); cursor.current = (event.clientX - bounds.left) / bounds.width * 4 - 2;
      }
    }} onPointerLeave={() => { cursor.current = 1; }} onPointerDown={event => {
      if (!interactive) return;
      drag.current = { x: event.clientX, y: event.clientY, phase: phase.current, touch: event.pointerType === 'touch' }; moved.current = false; event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerUp={event => {
      if (!drag.current) return;
      drag.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (!moved.current) { const index = renderer.current?.pick(event.clientX, event.clientY); if (index !== null && index !== undefined) choose(photos[index]); }
    }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      {!photos.length ? <p className="endless-film-empty">Add photos to start your reel.</p> : <>
        <canvas ref={canvas} className="endless-film-ribbon" role="img" aria-label="A curling photographic film ribbon with punched sprockets" />
        <div className="endless-film-fallback" aria-hidden="true">{photos.slice(0, 6).map(photo => <div className="endless-film-fallback-frame" key={photo.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt="" draggable="false" />
        </div>)}</div>
      </>}
    </div>
    <footer className="endless-film-footer"><div role="status" aria-live="polite"><strong>{selected?.title ?? 'Your story starts here'}</strong>{selected?.note && <p>{selected.note}</p>}</div><div className="endless-film-actions">
      <button type="button" onClick={() => advance(-1)} disabled={!photos.length} aria-label="Previous photo">Previous</button>
      <button type="button" aria-pressed={stopped || paused || reduced} disabled={paused || !photos.length || reduced} onClick={() => { focus.current = false; setStopped(!stopped); }}>{stopped || paused || reduced ? 'Play film' : 'Pause film'}</button>
      <button type="button" aria-pressed={reverse} onClick={() => setReverse(!reverse)} disabled={!photos.length}>Reverse</button>
      <button type="button" onClick={() => advance(1)} disabled={!photos.length} aria-label="Next photo">Next</button>
    </div></footer>
    {photos.length > 0 && <div className="endless-film-picker" aria-label="Choose a photograph">{photos.map(photo => <button type="button" key={photo.id} onClick={() => choose(photo)} aria-label={`Select ${photo.title}`} aria-pressed={photo.id === selected?.id}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt="" loading="lazy" draggable="false" />
    </button>)}</div>}
  </section>;
}
