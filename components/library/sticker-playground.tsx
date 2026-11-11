"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowUpToLine, Check, Copy, Download, Layers, Plus, RotateCcw, Search, Trash2, Undo2, X } from "lucide-react";
import { Sticker, STICKERS, getSticker, type StickerName, type StickerFinish } from "../ui/sticker-pack";
import { boundStickerPlacement, STICKER_CANVAS_BACKGROUNDS, STICKER_SCENE_HEIGHT, STICKER_SCENE_WIDTH, stickerSceneHtml, stickerSceneJson, stickerSceneReact, type StickerPlacement, type StickerScene } from "../../lib/sticker-scene";
import { DEFAULT_STICKER_OPTIONS, type StickerOptions } from "../../lib/sticker-options";
import "../../styles/sticker-playground.css";

export type StickerPlaygroundProps = { name: StickerName; finish: StickerFinish; options?: StickerOptions };
const starterScene: StickerScene = {
  caption: "Make something yours.", background: STICKER_CANVAS_BACKGROUNDS[0].color,
  placements: ([
    { ...DEFAULT_STICKER_OPTIONS, id: "start-1", name: "checkered-daisy", x: 17, y: 24, size: 190, rotate: -12 },
    { ...DEFAULT_STICKER_OPTIONS, id: "start-2", name: "side-b-vinyl", x: 83, y: 24, size: 180, rotate: 8 },
    { ...DEFAULT_STICKER_OPTIONS, id: "start-3", name: "ziggy-bolt", x: 19, y: 77, size: 160, rotate: -8 },
    { ...DEFAULT_STICKER_OPTIONS, id: "start-4", name: "woven-heart", x: 81, y: 75, size: 190, rotate: 13 },
  ] satisfies StickerPlacement[]).map(boundStickerPlacement),
};
type DragState = { id: string; pointerId: number; startX: number; startY: number; placement: StickerPlacement; before: StickerScene; moved: boolean };
const sameScene = (a: StickerScene, b: StickerScene) => JSON.stringify(a) === JSON.stringify(b);
function saveFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })), anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StickerPlayground({ name, finish, options = DEFAULT_STICKER_OPTIONS }: StickerPlaygroundProps) {
  const [scene, setScene] = useState<StickerScene>(starterScene);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<StickerScene[]>([]);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<"React" | "HTML" | "JSON">("React");
  const [status, setStatus] = useState(""), [copied, setCopied] = useState(false);
  const board = useRef<HTMLDivElement>(null), addControl = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0), drag = useRef<DragState | null>(null), suppressedClick = useRef<string | null>(null);
  const current = scene.placements.find(placement => placement.id === selected);
  const activeName = getSticker(name), dark = scene.background === "#171923";
  const tray = STICKERS.filter(sticker => `${sticker.title} ${sticker.tags}`.toLowerCase().includes(query.trim().toLowerCase()));
  const code = format === "React" ? stickerSceneReact(scene) : format === "HTML" ? stickerSceneHtml(scene) : stickerSceneJson(scene);

  function commit(next: StickerScene, previous = scene) {
    if (sameScene(next, previous)) return;
    setHistory(items => [...items.slice(-29), previous]); setScene(next); setCopied(false);
  }
  function updatePlacement(id: string, change: Partial<StickerPlacement>) {
    commit({ ...scene, placements: scene.placements.map(placement => placement.id === id ? boundStickerPlacement({ ...placement, ...change }) : placement) });
  }
  function add(stickerName: StickerName) {
    if (scene.placements.length >= 80) { setStatus("This canvas holds up to 80 stickers. Remove one to add another."); return; }
    const id = `placed-${++sequence.current}`, offset = (sequence.current % 5 - 2) * 5;
    const placement = boundStickerPlacement({ ...options, id, name: stickerName, x: 50 + offset, y: 50 + offset, finish });
    commit({ ...scene, placements: [...scene.placements, placement] }); setSelected(id); setStatus(`${getSticker(stickerName).title} added. Drag it into place.`);
    requestAnimationFrame(() => board.current?.querySelector<HTMLElement>(`[data-placement="${id}"] .orange-sticker`)?.focus({ preventScroll: true }));
  }
  function remove(id: string) {
    const removed = scene.placements.find(placement => placement.id === id);
    commit({ ...scene, placements: scene.placements.filter(placement => placement.id !== id) });
    setSelected(null); setStatus(`${removed ? getSticker(removed.name).title : "Sticker"} removed.`); requestAnimationFrame(() => addControl.current?.focus({ preventScroll: true }));
  }
  function undo() {
    const previous = history.at(-1); if (!previous) return;
    setScene(previous); setHistory(items => items.slice(0, -1)); setSelected(null); setCopied(false); setStatus("Last change undone.");
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>, placement: StickerPlacement) {
    if (event.button !== 0) return;
    setSelected(placement.id); suppressedClick.current = null;
    drag.current = { id: placement.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, placement, before: scene, moved: false };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current, rect = board.current?.getBoundingClientRect();
    if (!active || active.pointerId !== event.pointerId || !rect || rect.width === 0 || rect.height === 0) return;
    const dx = event.clientX - active.startX, dy = event.clientY - active.startY;
    if (!active.moved && Math.hypot(dx, dy) < 4) return;
    if (!active.moved) { active.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
    event.preventDefault();
    const updated = boundStickerPlacement({ ...active.placement, x: active.placement.x + dx / rect.width * 100, y: active.placement.y + dy / rect.height * 100 });
    setScene({ ...active.before, placements: active.before.placements.map(placement => placement.id === active.id ? updated : placement) });
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const active = drag.current; if (!active || active.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (active.moved) {
      suppressedClick.current = active.id;
      if (cancelled) setScene(active.before); else { setHistory(items => [...items.slice(-29), active.before]); setCopied(false); setStatus(`${getSticker(active.placement.name).title} placed.`); }
    }
    drag.current = null;
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>, placement: StickerPlacement) {
    const step = event.shiftKey ? 3 : .75;
    const movement: Record<string, { x: number; y: number }> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    if (movement[event.key]) { event.preventDefault(); setSelected(placement.id); updatePlacement(placement.id, { x: placement.x + movement[event.key].x, y: placement.y + movement[event.key].y }); }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(placement.id); }
    if (event.key === "Escape") { setSelected(null); addControl.current?.focus(); }
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setStatus(`${format} code copied.`); }
    catch { setCopied(false); setStatus("Clipboard access is unavailable. Select the code below to copy it."); }
  }
  function downloadCode() {
    const extension = format === "React" ? "tsx" : format === "HTML" ? "html" : "json";
    saveFile(code, `my-sticker-canvas.${extension}`, format === "HTML" ? "text/html;charset=utf-8" : format === "JSON" ? "application/json" : "text/plain;charset=utf-8");
    setStatus(`${format} canvas downloaded.`);
  }
  return <section className="sticker-playground" aria-label="Sticker playground">
    <header className="sticker-playground-heading"><div><h2>Make it stick.</h2><p>Place, turn, and layer a little personality. Take the whole canvas with you.</p></div><button ref={addControl} type="button" className="sticker-playground-add" disabled={scene.placements.length >= 80} onClick={() => add(name)}><Plus size={16} aria-hidden="true" /> Add {activeName.title}</button></header>
    <div className="sticker-playground-workspace">
      <div className="sticker-playground-stage">
        <div className="sticker-playground-toolbar"><span>{scene.placements.length} {scene.placements.length === 1 ? "sticker" : "stickers"} on canvas</span><div><button type="button" onClick={undo} disabled={!history.length} aria-label="Undo last canvas change"><Undo2 size={16} aria-hidden="true" /> Undo</button><button type="button" onClick={() => { commit({ ...scene, placements: [] }); setSelected(null); setStatus("Canvas cleared. Undo restores your arrangement."); }} disabled={!scene.placements.length}><Trash2 size={15} aria-hidden="true" /> Clear</button></div></div>
        <div ref={board} className="sticker-playground-board" data-dark={dark} style={{ background: scene.background, aspectRatio: `${STICKER_SCENE_WIDTH} / ${STICKER_SCENE_HEIGHT}` }} aria-label="Sticker placement canvas" onPointerDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
          <p className="sticker-playground-caption">{scene.caption}</p>
          {scene.placements.map(placement => <div key={placement.id} className="sticker-playground-placement" data-placement={placement.id} data-selected={selected === placement.id} style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.size / STICKER_SCENE_WIDTH * 100}%`, "--placement-rotation": `${placement.rotate}deg` } as CSSProperties} onPointerDown={event => pointerDown(event, placement)} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)} onPointerCancel={event => pointerEnd(event, true)} onKeyDown={event => keyboard(event, placement)} onFocus={() => setSelected(placement.id)} onClickCapture={event => { if (suppressedClick.current === placement.id) { event.preventDefault(); event.stopPropagation(); suppressedClick.current = null; } }}><Sticker name={placement.name} finish={placement.finish} size="100%" rotate={placement.rotate} motion={placement.motion} duration={placement.duration} intensity={placement.intensity} shadow={placement.shadow} interactive label={`Move ${getSticker(placement.name).title}. Arrow keys to move, Delete to remove.`} onClick={() => setSelected(placement.id)} /></div>)}
          {!scene.placements.length && !scene.caption && <p className="sticker-playground-empty">A fresh canvas. Add a sticker to begin.</p>}
        </div>
        <p className="sticker-playground-instructions">Drag to place. Click to animate. Use arrow keys to nudge a focused sticker, or Shift + arrows for bigger moves.</p>
        <div className="sticker-playground-surface-controls"><label>Canvas text<input maxLength={120} value={scene.caption} onChange={event => commit({ ...scene, caption: event.target.value })} placeholder="Your words here" /></label><div role="group" aria-label="Canvas background">{STICKER_CANVAS_BACKGROUNDS.map(background => <button type="button" key={background.name} className="sticker-playground-swatch" aria-label={`${background.name} canvas`} aria-pressed={background.color === scene.background} style={{ "--swatch": background.color } as CSSProperties} onClick={() => commit({ ...scene, background: background.color })}>{background.color === scene.background && <Check size={13} aria-hidden="true" />}<span>{background.name}</span></button>)}</div></div>
      </div>
      <aside className="sticker-playground-tools" aria-label="Canvas layers and placement controls">
        <div className="sticker-playground-tools-heading"><h3><Layers size={16} aria-hidden="true" /> Layers</h3><span>Topmost first</span></div>
        <div className="sticker-playground-layers">{[...scene.placements].reverse().map(placement => <button key={placement.id} type="button" aria-pressed={placement.id === selected} onClick={() => { setSelected(placement.id); board.current?.querySelector<HTMLElement>(`[data-placement="${placement.id}"] .orange-sticker`)?.focus({ preventScroll: true }); }}><Sticker name={placement.name} finish={placement.finish} size={32} decorative /><span>{getSticker(placement.name).title}</span>{placement.id === selected && <Check size={14} aria-hidden="true" />}</button>)}{!scene.placements.length && <p>No stickers yet. Pick one below.</p>}</div>
        {current ? <div className="sticker-playground-placement-controls"><h4>{getSticker(current.name).title}</h4><label htmlFor="playground-size">Size <output>{Math.round(current.size)} px</output></label><input id="playground-size" type="range" min="48" max="360" step="4" value={current.size} onChange={event => updatePlacement(current.id, { size: Number(event.target.value) })} /><label htmlFor="playground-rotation">Rotation <output>{Math.round(current.rotate)}Â°</output></label><input id="playground-rotation" type="range" min="-180" max="180" step="1" value={current.rotate} onChange={event => updatePlacement(current.id, { rotate: Number(event.target.value) })} /><div className="sticker-playground-position-readout"><span>X {current.x.toFixed(1)}%</span><span>Y {current.y.toFixed(1)}%</span></div><label htmlFor="playground-finish">Finish<select id="playground-finish" value={current.finish} onChange={event => updatePlacement(current.id, { finish: event.target.value as StickerFinish })}><option value="sharp">Sharp</option><option value="playful">Playful</option></select></label><div className="sticker-playground-layer-actions"><button type="button" onClick={() => { const id = `placed-${++sequence.current}`; commit({ ...scene, placements: [...scene.placements, boundStickerPlacement({ ...current, id, x: current.x + 4, y: current.y + 4 })] }); setSelected(id); }} disabled={scene.placements.length >= 80}><Copy size={14} aria-hidden="true" /> Duplicate</button><button type="button" disabled={scene.placements.at(-1)?.id === current.id} onClick={() => commit({ ...scene, placements: [...scene.placements.filter(placement => placement.id !== current.id), current] })}><ArrowUpToLine size={14} aria-hidden="true" /> To front</button><button type="button" onClick={() => updatePlacement(current.id, { rotate: 0 })} disabled={!current.rotate}><RotateCcw size={14} aria-hidden="true" /> Straighten</button><button type="button" onClick={() => remove(current.id)}><Trash2 size={14} aria-hidden="true" /> Remove</button></div></div> : <p className="sticker-playground-selection-hint">Select a sticker to change its size, rotation, or finish.</p>}
      </aside>
    </div>
    <div className="sticker-playground-tray-heading"><h3>Add a little more.</h3><label className="sticker-playground-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Find a sticker to place</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search stickers to place" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear playground search"><X size={14} aria-hidden="true" /></button>}</label></div>
    <div className="sticker-playground-tray" aria-label="Stickers to place">{tray.map(sticker => <button type="button" key={sticker.name} onClick={() => add(sticker.name)} disabled={scene.placements.length >= 80} aria-label={`Place ${sticker.title}`}><Sticker name={sticker.name} finish={finish} size={64} decorative /><span>{sticker.title}</span><Plus className="sticker-playground-tray-plus" size={12} aria-hidden="true" /></button>)}{!tray.length && <p>No matching stickers. Try another name.</p>}</div>
    <div className="sticker-playground-export"><div><h3>Your canvas, anywhere.</h3><p>React keeps the npm component and click animation. HTML includes every SVG and the animation with no dependencies. JSON saves your placement data.</p></div><div className="sticker-playground-export-content"><div className="sticker-playground-export-toolbar"><div role="group" aria-label="Canvas code format">{(["React", "HTML", "JSON"] as const).map(item => <button type="button" key={item} aria-pressed={format === item} onClick={() => { setFormat(item); setCopied(false); }}>{item}</button>)}</div><div><button type="button" onClick={copyCode} aria-label="Copy canvas code">{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button><button type="button" onClick={downloadCode}><Download size={15} aria-hidden="true" /> Download {format}</button></div></div><pre tabIndex={0} className="sticker-playground-code" aria-label={`${format} canvas code`}><code>{code}</code></pre></div></div>
    <p className="sticker-playground-status" role="status">{status}</p>
  </section>;
}
