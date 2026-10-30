"use client";

import { useEffect, useId, useRef } from "react";
import { clamp } from "./creative-surface";
import { creativeSvgData } from "./creative-art";
import { creativeFileData } from "./creative-export";
import "../../styles/creative-devices.css";

export type StickerKind = "star" | "flower" | "orange" | "planet" | "bolt" | "image";
export type CreativeSticker = { id: string; kind: StickerKind; x: number; y: number; size: number; rotation?: number; src?: string };
export const ORIGINAL_STICKERS: readonly CreativeSticker[] = [
  { id: "flower", kind: "flower", x: 7, y: 41, size: 15, rotation: -15 },
  { id: "planet", kind: "planet", x: 74, y: 46, size: 16, rotation: 12 },
  { id: "orange", kind: "orange", x: 9, y: 80, size: 20, rotation: -16 },
  { id: "star", kind: "star", x: 77, y: 80, size: 14, rotation: 18 },
  { id: "bolt", kind: "bolt", x: 69, y: 69, size: 10, rotation: 8 },
];
const artwork: Record<Exclude<StickerKind, "image">, string> = {
  star: '<path d="m32 4 8 18 20 2-15 14 4 20-17-10-18 10 4-20L3 24l21-2Z" fill="#f3c855" stroke="#293244" stroke-width="4"/>',
  flower: '<g fill="#8fa4e4" stroke="#273f4c" stroke-width="2">' + Array.from({ length: 6 }, (_, i) => '<ellipse cx="32" cy="15" rx="10" ry="14" transform="rotate(' + i * 60 + ' 32 32)"/>').join("") + '<circle cx="32" cy="32" r="10" fill="#f5c770"/></g>',
  orange: '<circle cx="32" cy="36" r="24" fill="#fbb350" stroke="#583a35" stroke-width="3"/><path d="M32 12Q28-4 52 5Q53 20 32 12" fill="#7eb56b" stroke="#334f3b" stroke-width="3"/><path d="m16 36 8 4m14 9 7-5" stroke="#ffdf8c" stroke-width="3" fill="none"/>',
  planet: '<circle cx="32" cy="32" r="19" fill="#b29cdd" stroke="#41364e" stroke-width="3"/><ellipse cx="32" cy="32" rx="30" ry="9" transform="rotate(-23 32 32)" fill="none" stroke="#f8bd62" stroke-width="6"/><path d="m24 24 10-5" stroke="#d9c4f1" stroke-width="4"/>',
  bolt: '<path d="M34 3 11 35h18l-4 26 28-37H35l7-21Z" fill="#87b6d5" stroke="#243a5e" stroke-width="4" stroke-linejoin="round"/>',
};
export function stickerSource(sticker: CreativeSticker) {
  if (sticker.kind === "image" && sticker.src) return sticker.src;
  return creativeSvgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + artwork[sticker.kind === "image" ? "star" : sticker.kind] + '</svg>');
}

export function DecalLayer({ stickers, onChange, editable = false }: { stickers: readonly CreativeSticker[]; onChange?: (stickers: CreativeSticker[]) => void; editable?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; size: number; clientX: number; clientY: number; resize: boolean } | null>(null);
  const update = (id: string, patch: Partial<CreativeSticker>) => onChange?.(stickers.map((sticker) => sticker.id === id ? { ...sticker, ...patch } : sticker));
  return <div className="creative-decals" ref={root}>
    {stickers.map((sticker) => <div key={sticker.id} className="creative-decal" style={{ left: sticker.x + "%", top: sticker.y + "%", width: sticker.size + "%", transform: "rotate(" + (sticker.rotation || 0) + "deg)" }}>
      <button type="button" className="creative-decal-grab" disabled={!editable} aria-label={sticker.kind + " sticker. Arrow keys move, plus and minus resize, Delete removes."}
        onPointerDown={(event) => {
          if (!editable) return;
          event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: sticker.id, x: sticker.x, y: sticker.y, size: sticker.size, clientX: event.clientX, clientY: event.clientY, resize: (event.target as HTMLElement).dataset.resize !== undefined };
        }}
        onPointerMove={(event) => {
          const current = drag.current, box = root.current?.getBoundingClientRect();
          if (!current || current.id !== sticker.id || !box) return;
          const dx = (event.clientX - current.clientX) / box.width * 100, dy = (event.clientY - current.clientY) / box.height * 100;
          if (current.resize) update(sticker.id, { size: clamp(current.size + dx, 6, 38) });
          else update(sticker.id, { x: clamp(current.x + dx, 0, 100 - sticker.size), y: clamp(current.y + dy, 0, 92) });
        }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={(event) => {
          const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
          if (steps[event.key]) { event.preventDefault(); const [dx, dy] = steps[event.key]; update(sticker.id, { x: clamp(sticker.x + dx, 0, 100 - sticker.size), y: clamp(sticker.y + dy, 0, 92) }); }
          if (event.key === "+" || event.key === "=" || event.key === "-") { event.preventDefault(); update(sticker.id, { size: clamp(sticker.size + (event.key === "-" ? -1 : 1), 6, 38) }); }
          if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onChange?.(stickers.filter((item) => item.id !== sticker.id)); }
        }}>
        <img src={stickerSource(sticker)} alt="" draggable={false} />
        {editable && <span className="creative-decal-resize" data-resize="" aria-hidden="true" />}
      </button>
    </div>)}
  </div>;
}

export function StickerEditor({ stickers, onChange }: { stickers: readonly CreativeSticker[]; onChange: (stickers: CreativeSticker[]) => void }) {
  const prefix = useId(), sequence = useRef(0), abort = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); abort.current = controller; return () => controller.abort(); }, []);
  const add = (kind: StickerKind, src?: string) => { sequence.current++; onChange([...stickers, { id: prefix + "-" + sequence.current, kind, src, x: 40, y: 78, size: 17, rotation: 0 }]); };
  return <div className="creative-sticker-editor">
    <div className="creative-actions">{(["star", "flower", "orange", "planet", "bolt"] as const).map((kind) => <button key={kind} type="button" className="creative-button creative-sticker-add" aria-label={"Add " + kind + " sticker"} onClick={() => add(kind)}><img src={stickerSource({ kind, id: kind, x: 0, y: 0, size: 1 })} alt="" /></button>)}</div>
    <label className="creative-sticker-upload">Upload a sticker<input type="file" accept="image/*" onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      event.target.value = ""; try { add("image", await creativeFileData(file, abort.current?.signal)); } catch {}
    }} /></label>
    <p className="creative-feedback">Drag to move. Drag the corner or use + / - to resize. Select a sticker and press Delete to remove it.</p>
  </div>;
}
