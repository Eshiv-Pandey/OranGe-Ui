"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { seededRandom, bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/bloom-trail.css";

type Bloom = { id: number; x: number; y: number; size: number; color: string; spin: number };
export type BloomTrailProps = AppearanceProps & { seed?: string | number; colors?: readonly string[]; density?: number; flowerSize?: number; children?: ReactNode; showControls?: boolean; theme?: CreativeTheme; onBloom?: (count: number) => void };
const COLORS = ["#b55235", "#d8a643", "#768753", "#647eb3", "#d4899d"];

export function BloomTrail({ seed = "wildflower", colors = COLORS, density = 65, flowerSize = 15, children, showControls = true, theme = "auto", appearance = "polished", className, onBloom }: BloomTrailProps) {
  const palette = colors.length ? colors : COLORS, resolved = useCreativeTheme(theme);
  const [planted, setPlanted] = useState<Bloom[]>([]), [cleared, setCleared] = useState(false);
  const cursor = useRef({ x: -100, y: -100 }), serial = useRef(1000), canvas = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 640, height: 420 });
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0 && entry.contentRect.height > 0) setBounds({ width: entry.contentRect.width, height: entry.contentRect.height }); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const initial = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: Math.round(bounded(density, 0, 140, 65)) }, (_, id) => {
      const x = .035 + random() * .93, y = .04 + random() * .86;
      return { id, x, y, size: (5 + random() * 10) * bounded(flowerSize, 6, 30, 15) / 15, color: palette[id % palette.length], spin: random() * 90 };
    });
  }, [seed, density, flowerSize, palette]);
  const flowers = [...(cleared ? [] : initial), ...planted];
  function plant(x: number, y: number) {
    const id = serial.current++;
    const bloom = { id, x, y, size: bounded(flowerSize, 6, 30, 15), color: palette[id % palette.length], spin: id * 31 % 90 };
    setPlanted((current) => [...current.slice(-119), bloom]);
    onBloom?.(Math.min(120, planted.length + 1) + (cleared ? 0 : initial.length));
  }
  return <div className={["creative-surface interaction-surface bloom-trail", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance}>
    <div ref={canvas} className="bloom-trail-canvas" onPointerMove={(event) => {
      if ((event.target as HTMLElement).closest?.("button, a, input")) return;
      const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
      if (Math.hypot((x - cursor.current.x) * rect.width, (y - cursor.current.y) * rect.height) < 22) return;
      cursor.current = { x, y }; plant(x, y);
    }} onPointerDown={(event) => { if ((event.target as HTMLElement).closest?.("button, a, input")) return; const rect = event.currentTarget.getBoundingClientRect(); plant((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height); }}>
      <svg viewBox={`0 0 ${bounds.width} ${bounds.height}`} aria-hidden="true" className="bloom-trail-art">{flowers.map((flower) => <g key={flower.id} transform={`translate(${flower.x * bounds.width} ${flower.y * bounds.height}) rotate(${flower.spin})`}><g className={flower.id >= 1000 ? "bloom-new" : undefined} style={{ "--bloom-scale": flower.size / 12 } as CSSProperties}>
        {Array.from({ length: 8 }, (_, petal) => <ellipse key={petal} cx="0" cy="-6.3" rx="3.5" ry="5.8" fill={flower.color} transform={`rotate(${petal * 45})`} />)}<circle r="3.6" fill="#f5e5aa" /><circle r="1.1" fill="#685e35" />
      </g></g>)}</svg>
      <div className="bloom-trail-content">{children ?? <div className="bloom-note"><span className="bloom-note-bar"><i /><i /><i /></span><p>Leave a little<br />color behind.</p></div>}</div>
    </div>
    {showControls && <div className="bloom-trail-footer"><p className="ix-caption">Move around. Let something grow.</p><div className="ix-controls"><button className="ix-icon" type="button" aria-label="Plant a flower" onClick={() => { const random = seededRandom(serial.current); plant(.05 + random() * .9, .05 + random() * .8); }}><InteractionIcon name="plus" /></button><button className="ix-icon" type="button" aria-label="Clear flowers" onClick={() => { setPlanted([]); setCleared(true); onBloom?.(0); }}><InteractionIcon name="reset" /></button></div></div>}
    <span className="ix-sr">An interactive field of colorful flowers. Use Plant a flower to add one with the keyboard.</span>
  </div>;
}
