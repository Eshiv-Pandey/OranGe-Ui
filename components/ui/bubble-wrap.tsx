"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded, seededRandom } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/bubble-wrap.css";

export type BubbleWrapProps = AppearanceProps & { rows?: number; columns?: number; image?: string; imageAlt?: string; sound?: boolean; volume?: number; onPop?: (index: number, total: number) => void; onReset?: () => void; theme?: CreativeTheme };
export function BubbleWrap({ rows = 9, columns = 12, image = "", imageAlt = "Photograph beneath the bubble wrap", sound = true, volume = .65, onPop, onReset, theme = "auto", appearance = "polished", className }: BubbleWrapProps) {
  const rowCount = Math.round(bounded(rows, 2, 16, 9)), columnCount = Math.round(bounded(columns, 3, 18, 12)), total = rowCount * columnCount;
  const [popped, setPopped] = useState<Set<number>>(() => new Set()), livePopped = useRef(new Set<number>()), [active, setActive] = useState(0);
  const grid = useRef<HTMLDivElement>(null), buttons = useRef<(HTMLButtonElement | null)[]>([]), audio = useRef<AudioContext | null>(null), voices = useRef(0), painting = useRef(false);
  const previousPoint = useRef<{ x: number; y: number } | null>(null);
  const resolved = useCreativeTheme(theme), id = useId(), count = [...popped].filter((index) => index < total).length;
  useEffect(() => () => { if (audio.current) void audio.current.close(); }, []);
  function pop(index: number) {
    if (index < 0 || index >= total || livePopped.current.has(index)) return;
    livePopped.current.add(index); setPopped(new Set(livePopped.current));
    onPop?.(index, [...livePopped.current].filter((cell) => cell < total).length);
    if (!sound || volume <= 0 || voices.current >= 12) return;
    try {
      const context = audio.current ?? new AudioContext(); audio.current = context;
      if (context.state === "suspended") void context.resume().catch(() => {});
      const source = context.createBufferSource(), gain = context.createGain(), length = Math.round(context.sampleRate * .12), buffer = context.createBuffer(1, length, context.sampleRate), data = buffer.getChannelData(0);
      const noise = seededRandom(`${index}:${livePopped.current.size}`);
      const pitch = 320 + noise() * 190;
      let previousNoise = 0;
      for (let i = 0; i < length; i++) {
        const t = i / context.sampleRate, random = noise() * 2 - 1;
        // A plastic crack followed by a short, falling air-pressure pop.
        const crack = (random - previousNoise * .72) * Math.exp(-t * 110);
        const body = Math.sin(2 * Math.PI * (pitch * t - 950 * t * t)) * Math.exp(-t * 62);
        data[i] = Math.max(-1, Math.min(1, crack * .7 + body * .6 + random * Math.exp(-t * 42) * .1));
        previousNoise = random;
      }
      source.buffer = buffer; gain.gain.value = bounded(volume, 0, 1) * .85; source.playbackRate.value = .93 + noise() * .14;
      source.connect(gain); gain.connect(context.destination); voices.current++;
      source.onended = () => { voices.current = Math.max(0, voices.current - 1); source.disconnect(); gain.disconnect(); }; source.start();
    } catch { /* Popping remains available when the browser cannot start audio. */ }
  }
  function point(clientX: number, clientY: number) {
    const cell = document.elementFromPoint(clientX, clientY)?.closest<HTMLButtonElement>(".bubble-cell");
    if (cell && grid.current?.contains(cell)) pop(Number(cell.dataset.index));
  }
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columnCount, ArrowUp: -columnCount };
    const next = event.key === "Home" ? 0 : event.key === "End" ? total - 1 : event.key in moves ? bounded(index + moves[event.key], 0, total - 1) : undefined;
    if (next === undefined) return; event.preventDefault(); setActive(next); buttons.current[next]?.focus();
  }
  return <section className={["creative-surface interaction-surface bubble-wrap", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-sound={sound} aria-label="Poppable bubble wrap">
    <div className="bubble-wrap-sheet">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image && <img className="bubble-wrap-photo" src={image} alt={imageAlt} draggable="false" />}
      <div ref={grid} className="bubble-wrap-grid" role="group" aria-label="Bubble sheet" aria-describedby={id} style={{ "--bubble-columns": columnCount, "--bubble-rows": rowCount } as CSSProperties}
        onPointerDown={(event) => { if (event.button !== 0) return; painting.current = true; previousPoint.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); point(event.clientX, event.clientY); }}
        onPointerMove={(event) => { if (!painting.current) return; const previous = previousPoint.current ?? { x: event.clientX, y: event.clientY }; const steps = Math.min(80, Math.max(1, Math.ceil(Math.hypot(event.clientX - previous.x, event.clientY - previous.y) / 10))); for (let step = 1; step <= steps; step++) point(previous.x + (event.clientX - previous.x) * step / steps, previous.y + (event.clientY - previous.y) * step / steps); previousPoint.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={() => { painting.current = false; previousPoint.current = null; }} onPointerCancel={() => { painting.current = false; previousPoint.current = null; }} onLostPointerCapture={() => { painting.current = false; previousPoint.current = null; }}>
        {Array.from({ length: total }, (_, index) => <button ref={(element) => { buttons.current[index] = element; }} key={index} className="bubble-cell" data-index={index} type="button" aria-label={`Bubble ${index + 1}${popped.has(index) ? ", popped" : ""}`} aria-pressed={popped.has(index)} tabIndex={index === Math.min(active, total - 1) ? 0 : -1} onFocus={() => setActive(index)} onClick={() => pop(index)} onKeyDown={(event) => keyboard(event, index)} style={{ "--bubble-turn": `${index * 137.5 % 360}deg` } as CSSProperties}><span><i /><i /><i /></span></button>)}
      </div>
    </div>
    <div className="bubble-wrap-footer"><div><strong role="status">{count === total ? "That felt good." : `${count} / ${total} popped`}</strong><p className="ix-caption" id={id}>Press or brush to pop. Arrow keys move, Space pops.</p></div><button type="button" className="ix-icon" aria-label="Reset bubble wrap" onClick={() => { livePopped.current = new Set(); setPopped(new Set()); onReset?.(); }}><InteractionIcon name="reset" /></button></div>
  </section>;
}
