"use client";

import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Download, GripVertical, Layers, Maximize2, Minimize2, Plus, RotateCcw, Search, Trash2, Undo2, X } from "lucide-react";
import { Sticker, STICKERS, getSticker, type StickerName, type StickerFinish } from "../ui/sticker-pack";
import { StickerBackgroundControl, StickerControls } from "./sticker-controls";
import { boundStickerPlacement, moveStickerLayer, stickerCanvasCaptionColor, stickerCanvasIsDark, STICKER_CANVAS_BACKGROUNDS, STICKER_SCENE_HEIGHT, STICKER_SCENE_WIDTH, stickerSceneHtml, stickerSceneJson, stickerSceneReact, type StickerPlacement, type StickerScene } from "../../lib/sticker-scene";
import { DEFAULT_STICKER_OPTIONS, type StickerOptions } from "../../lib/sticker-options";
import "../../styles/sticker-playground.css";

export type StickerPlaygroundProps = { name: StickerName; finish: StickerFinish; options?: StickerOptions; expanded?: boolean; onClose?: () => void };
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
type LayerDropTarget = { id: string; after: boolean };
type LayerDrag = { id: string; pointerId: number; target: LayerDropTarget | null };
type SceneHistory = { scene: StickerScene; selected: string | null };
type ToolTab = "Stickers" | "Edit" | "Layers" | "Canvas";
const sameScene = (a: StickerScene, b: StickerScene) => JSON.stringify(a) === JSON.stringify(b);
function saveFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })), anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StickerPlayground({ name, finish, options = DEFAULT_STICKER_OPTIONS, expanded = false, onClose }: StickerPlaygroundProps) {
  const [scene, setScene] = useState<StickerScene>(starterScene), [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<SceneHistory[]>([]), [tab, setTab] = useState<ToolTab>("Stickers");
  const [query, setQuery] = useState(""), [trayPage, setTrayPage] = useState(0);
  const [format, setFormat] = useState<"React" | "HTML" | "JSON">("React"), [status, setStatus] = useState(""), [copied, setCopied] = useState(false);
  const [dropTarget, setDropTarget] = useState<LayerDropTarget | null>(null);
  const [preview, setPreview] = useState(false), [traySize, setTraySize] = useState(18), [canvasWidth, setCanvasWidth] = useState<number>();
  const board = useRef<HTMLDivElement>(null), addControl = useRef<HTMLButtonElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const workspace = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null), trayGrid = useRef<HTMLDivElement>(null);
  const previewControl = useRef<HTMLButtonElement>(null), previewExit = useRef<HTMLButtonElement>(null), previewRequested = useRef(false), ownedFullscreen = useRef(false);
  const sequence = useRef(0), drag = useRef<DragState | null>(null), suppressedClick = useRef<string | null>(null);
  const layerDrag = useRef<LayerDrag | null>(null), nativeLayer = useRef<string | null>(null);
  const current = scene.placements.find(placement => placement.id === selected), dark = stickerCanvasIsDark(scene.background);
  const tray = STICKERS.filter(sticker => `${sticker.title} ${sticker.tags} ${sticker.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(tray.length / traySize)), page = Math.min(trayPage, pages - 1), frontFirst = [...scene.placements].reverse();
  const code = format === "React" ? stickerSceneReact(scene) : format === "HTML" ? stickerSceneHtml(scene) : stickerSceneJson(scene);

  useEffect(() => {
    if (!onClose || !dialog.current) return;
    if (expanded && !dialog.current.open) dialog.current.showModal();
    else if (!expanded && dialog.current.open) dialog.current.close();
  }, [expanded, onClose]);

  useEffect(() => {
    if (!(onClose && expanded) && !preview) return;
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [expanded, onClose, preview]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      const width = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (width > 0 && height > 0) setCanvasWidth(Math.min(width, height * STICKER_SCENE_WIDTH / STICKER_SCENE_HEIGHT));
    };
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [expanded, preview]);

  useEffect(() => {
    const element = trayGrid.current;
    if (!element) return;
    const measure = () => {
      const style = getComputedStyle(element), row = parseFloat(style.gridAutoRows), gap = parseFloat(style.rowGap);
      const height = element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (height > 0 && row > 0) setTraySize(Math.min(30, Math.max(1, Math.floor((height + gap) / (row + gap))) * 3));
    };
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [expanded, tab, preview]);

  useEffect(() => {
    const element = workspace.current;
    const changed = () => {
      if (document.fullscreenElement === element) { ownedFullscreen.current = true; return; }
      if (!ownedFullscreen.current) return;
      ownedFullscreen.current = false; previewRequested.current = false; setPreview(false);
      requestAnimationFrame(() => previewControl.current?.focus({ preventScroll: true }));
    };
    document.addEventListener("fullscreenchange", changed);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => { if (preview) previewExit.current?.focus({ preventScroll: true }); }, [preview]);

  async function enterPreview() {
    previewRequested.current = true; setPreview(true);
    try {
      if (workspace.current?.requestFullscreen) await workspace.current.requestFullscreen();
      if (!previewRequested.current && document.fullscreenElement === workspace.current) await document.exitFullscreen();
    } catch { /* The same clean preview fills the window when fullscreen is unavailable. */ }
  }
  function exitPreview() {
    previewRequested.current = false; setPreview(false);
    if (document.fullscreenElement === workspace.current) void document.exitFullscreen().catch(() => {});
    requestAnimationFrame(() => previewControl.current?.focus({ preventScroll: true }));
  }

  function commit(next: StickerScene, previous = scene) {
    if (sameScene(next, previous)) return;
    setHistory(items => [...items.slice(-29), { scene: previous, selected }]); setScene(next); setCopied(false);
  }
  function updatePlacement(id: string, change: Partial<StickerPlacement>) {
    commit({ ...scene, placements: scene.placements.map(placement => placement.id === id ? boundStickerPlacement({ ...placement, ...change }) : placement) });
  }
  function focusPlacement(id: string) {
    requestAnimationFrame(() => board.current?.querySelector<HTMLElement>(`[data-placement="${id}"] .orange-sticker`)?.focus({ preventScroll: true }));
  }
  function add(stickerName: StickerName) {
    if (scene.placements.length >= 80) { setStatus("This canvas holds up to 80 stickers. Remove one to add another."); return; }
    const id = `placed-${++sequence.current}`, offset = (sequence.current % 5 - 2) * 5;
    commit({ ...scene, placements: [...scene.placements, boundStickerPlacement({ ...options, id, name: stickerName, x: 50 + offset, y: 50 + offset, finish })] });
    setSelected(id); setTab("Edit"); setStatus(`${getSticker(stickerName).title} added. Drag it into place.`); focusPlacement(id);
  }
  function remove(id: string) {
    const index = scene.placements.findIndex(placement => placement.id === id); if (index < 0) return;
    const remaining = scene.placements.filter(placement => placement.id !== id);
    const nextSelected = selected === id ? remaining[Math.min(index, remaining.length - 1)]?.id ?? null : selected;
    commit({ ...scene, placements: remaining }); setSelected(nextSelected); setStatus(`${getSticker(scene.placements[index].name).title} removed.`);
    if (nextSelected) focusPlacement(nextSelected); else requestAnimationFrame(() => addControl.current?.focus({ preventScroll: true }));
  }
  function undo() {
    const previous = history.at(-1); if (!previous) return;
    setScene(previous.scene); setHistory(items => items.slice(0, -1)); setSelected(previous.selected); setCopied(false); setStatus("Last change undone.");
  }
  function duplicate(placement: StickerPlacement) {
    if (scene.placements.length >= 80) return;
    const id = `placed-${++sequence.current}`;
    commit({ ...scene, placements: [...scene.placements, boundStickerPlacement({ ...placement, id, x: placement.x + 4, y: placement.y + 4 })] });
    setSelected(id); focusPlacement(id); setStatus(`${getSticker(placement.name).title} duplicated.`);
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>, placement: StickerPlacement) {
    if (preview || event.button !== 0) return;
    setSelected(placement.id); setTab("Edit"); suppressedClick.current = null;
    drag.current = { id: placement.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, placement, before: scene, moved: false };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current, rect = board.current?.getBoundingClientRect();
    if (!active || active.pointerId !== event.pointerId || !rect?.width || !rect.height) return;
    const dx = event.clientX - active.startX, dy = event.clientY - active.startY;
    if (!active.moved && Math.hypot(dx, dy) < 4) return;
    if (!active.moved) event.currentTarget.setPointerCapture(event.pointerId);
    active.moved = true; event.preventDefault();
    const updated = boundStickerPlacement({ ...active.placement, x: active.placement.x + dx / rect.width * 100, y: active.placement.y + dy / rect.height * 100 });
    setScene({ ...active.before, placements: active.before.placements.map(placement => placement.id === active.id ? updated : placement) });
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const active = drag.current; if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (active.moved) {
      suppressedClick.current = cancelled ? null : active.id;
      if (cancelled) setScene(active.before);
      else { setHistory(items => [...items.slice(-29), { scene: active.before, selected: active.id }]); setCopied(false); setStatus(`${getSticker(active.placement.name).title} placed.`); }
    }
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>, placement: StickerPlacement) {
    if (preview) return;
    const step = event.shiftKey ? 3 : .75;
    const movement: Record<string, { x: number; y: number }> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    if (movement[event.key]) { event.preventDefault(); setSelected(placement.id); updatePlacement(placement.id, { x: placement.x + movement[event.key].x, y: placement.y + movement[event.key].y }); }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(placement.id); }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setSelected(null); addControl.current?.focus(); }
  }
  function reorder(id: string, targetId: string, after: boolean) {
    if (id === targetId) return;
    const targetIndex = scene.placements.filter(placement => placement.id !== id).reverse().findIndex(placement => placement.id === targetId), moving = scene.placements.find(placement => placement.id === id);
    if (targetIndex < 0 || !moving) return;
    commit({ ...scene, placements: moveStickerLayer(scene.placements, id, targetIndex + Number(after)) }); setStatus(`${getSticker(moving.name).title} layer moved.`);
  }
  function dropLayer(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault(); const id = event.dataTransfer.getData("text/plain") || nativeLayer.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (id) reorder(id, targetId, event.clientY >= rect.top + rect.height / 2); nativeLayer.current = null; setDropTarget(null);
  }
  function layerPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = layerDrag.current; if (!active || active.pointerId !== event.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-layer-id]"), rect = target?.getBoundingClientRect();
    active.target = target?.dataset.layerId && rect ? { id: target.dataset.layerId, after: event.clientY >= rect.top + rect.height / 2 } : null; setDropTarget(active.target);
  }
  function layerPointerEnd(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const active = layerDrag.current; if (!active || active.pointerId !== event.pointerId) return;
    layerDrag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && active.target) reorder(active.id, active.target.id, active.target.after); setDropTarget(null);
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setStatus(`${format} code copied.`); }
    catch { setCopied(false); setStatus("Clipboard access is unavailable. Download the code instead."); }
  }
  function downloadCode() {
    const extension = format === "React" ? "tsx" : format === "HTML" ? "html" : "json";
    saveFile(code, `my-sticker-canvas.${extension}`, format === "HTML" ? "text/html;charset=utf-8" : format === "JSON" ? "application/json" : "text/plain;charset=utf-8"); setStatus(`${format} canvas downloaded.`);
  }

  const content = <section ref={workspace} className="sticker-playground" aria-label="Sticker playground" data-expanded={Boolean(onClose)} data-preview={preview} onKeyDown={event => { if (preview && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); exitPreview(); } }}>
    {preview && <button ref={previewExit} type="button" className="sticker-playground-preview-exit" onClick={exitPreview} aria-label="Back to editor" title="Back to editor (Esc)"><Minimize2 size={16} aria-hidden="true" /><span>Back to editor</span></button>}
    <header className="sticker-playground-heading" hidden={preview}>
      <h2>Playground</h2>
      <div className="sticker-playground-header-actions">
        <button ref={addControl} type="button" className="sticker-playground-add" disabled={scene.placements.length >= 80} onClick={() => add(name)} aria-label={`Add ${getSticker(name).title}`}><Plus size={16} aria-hidden="true" /><span>Add sticker</span></button>
        <button type="button" onClick={undo} disabled={!history.length} aria-label="Undo last canvas change" title="Undo"><Undo2 size={16} aria-hidden="true" /></button>
        <button type="button" onClick={() => { commit({ ...scene, placements: [] }); setSelected(null); setStatus("Canvas cleared. Undo restores your arrangement."); }} disabled={!scene.placements.length} aria-label="Clear canvas" title="Clear canvas"><Trash2 size={16} aria-hidden="true" /></button>
      </div>
      <div className="sticker-playground-export-toolbar">
        <button ref={previewControl} type="button" className="sticker-playground-preview-launch" onClick={enterPreview} aria-label="Preview fullscreen" title="Preview fullscreen"><Maximize2 size={16} aria-hidden="true" /><span>Preview</span></button>
        <div className="sticker-playground-format"><select aria-label="Canvas code format" value={format} onChange={event => { setFormat(event.target.value as typeof format); setCopied(false); }}><option>React</option><option>HTML</option><option>JSON</option></select><ChevronDown size={13} aria-hidden="true" /></div>
        <button type="button" onClick={copyCode} aria-label="Copy canvas code" title={copied ? "Copied" : "Copy code"}>{copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button>
        <button type="button" onClick={downloadCode} aria-label={`Download ${format} canvas`} title={`Download ${format}`}><Download size={16} aria-hidden="true" /><span>Export</span></button>
        {onClose && <button type="button" onClick={onClose} aria-label="Close playground" title="Back to collection"><X size={18} aria-hidden="true" /></button>}
      </div>
    </header>
    <div className="sticker-playground-workspace">
      <div className="sticker-playground-stage">
        <div className="sticker-playground-toolbar" hidden={preview}><span>{scene.placements.length}/80 stickers</span><span>960 × 600 canvas</span></div>
        <div ref={viewport} className="sticker-playground-viewport">
          <div ref={board} className="sticker-playground-board" data-dark={dark} data-transparent={scene.background === "transparent"} style={{ background: scene.background, width: canvasWidth, aspectRatio: `${STICKER_SCENE_WIDTH} / ${STICKER_SCENE_HEIGHT}` }} aria-label="Sticker placement canvas" onPointerDown={event => { if (!preview && event.target === event.currentTarget) setSelected(null); }}>
            <p className="sticker-playground-caption" style={{ color: stickerCanvasCaptionColor(scene.background) }}>{scene.caption}</p>
            {scene.placements.map((placement, index) => <div key={placement.id} className="sticker-playground-placement" data-placement={placement.id} data-selected={!preview && selected === placement.id} style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.size / STICKER_SCENE_WIDTH * 100}%`, zIndex: index + 1, "--placement-rotation": `${placement.rotate}deg` } as CSSProperties} onPointerDown={event => pointerDown(event, placement)} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)} onKeyDown={event => keyboard(event, placement)} onFocus={() => { if (!preview) setSelected(placement.id); }} onClickCapture={event => { if (suppressedClick.current === placement.id) { event.preventDefault(); event.stopPropagation(); suppressedClick.current = null; } }}><Sticker name={placement.name} finish={placement.finish} size="100%" rotate={placement.rotate} motion={placement.motion} duration={placement.duration} intensity={placement.intensity} shadow={placement.shadow} interactive label={preview ? `Animate ${getSticker(placement.name).title}` : `Move ${getSticker(placement.name).title}. Arrow keys to move, Delete to remove.`} onClick={() => { if (!preview) { setSelected(placement.id); setTab("Edit"); } }} /></div>)}
            {current && !preview && <button type="button" className="sticker-playground-remove-selected" style={{ left: `clamp(14px, ${current.x + current.size / STICKER_SCENE_WIDTH * 50}%, calc(100% - 14px))`, top: `clamp(14px, ${current.y - current.size / STICKER_SCENE_HEIGHT * 50}%, calc(100% - 14px))` }} onPointerDown={event => event.stopPropagation()} onClick={() => remove(current.id)} aria-label={`Remove ${getSticker(current.name).title} from canvas`} title="Remove sticker"><X size={14} aria-hidden="true" /></button>}
            {!preview && !scene.placements.length && !scene.caption && <p className="sticker-playground-empty">Add a sticker to begin.</p>}
          </div>
        </div>
        <div className="sticker-playground-bottom-bar" hidden={preview}><p className="sticker-playground-instructions">Drag freely, including beyond the edges. Arrow keys move; Delete removes.</p><p className="sticker-playground-status" role="status">{status}</p></div>
      </div>
      <aside className="sticker-playground-tools" aria-label="Canvas layers and placement controls" hidden={preview}>
        <div className="sticker-playground-tool-tabs" role="group" aria-label="Playground tools">{(["Stickers", "Edit", "Layers", "Canvas"] as const).map(item => <button key={item} type="button" aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="sticker-playground-tool-content">
          {tab === "Stickers" && <div className="sticker-playground-stickers-panel">
            <label className="sticker-playground-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Find a sticker to place</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setTrayPage(0); }} placeholder="Search stickers" />{query && <button type="button" onClick={() => { setQuery(""); setTrayPage(0); }} aria-label="Clear playground search"><X size={14} aria-hidden="true" /></button>}</label>
            <div ref={trayGrid} className="sticker-playground-tray" aria-label="Stickers to place">{tray.slice(page * traySize, (page + 1) * traySize).map(sticker => <button type="button" key={sticker.name} onClick={() => add(sticker.name)} disabled={scene.placements.length >= 80} aria-label={`Place ${sticker.title}`}><Sticker name={sticker.name} finish={finish} size={60} decorative /><span>{sticker.title}</span></button>)}{!tray.length && <p>No matches. Try another name.</p>}</div>
            <div className="sticker-playground-tray-pagination"><button type="button" onClick={() => setTrayPage(page - 1)} disabled={page === 0} aria-label="Previous sticker page">Previous</button><span>{page + 1} / {pages}</span><button type="button" onClick={() => setTrayPage(page + 1)} disabled={page === pages - 1} aria-label="Next sticker page">Next</button></div>
          </div>}
          {tab === "Edit" && (current ? <div className="sticker-playground-placement-controls">
            <div className="sticker-playground-selected-heading"><h3>{getSticker(current.name).title}</h3><button type="button" onClick={() => remove(current.id)} aria-label={`Remove selected ${getSticker(current.name).title}`} title="Remove sticker"><Trash2 size={15} aria-hidden="true" /></button></div>
            <StickerControls options={current} onChange={change => updatePlacement(current.id, change)} />
            <div className="sticker-playground-position-inputs"><label>X %<input aria-label="Sticker X position" type="number" min="-50" max="150" step=".5" value={current.x} onChange={event => updatePlacement(current.id, { x: event.target.valueAsNumber })} /></label><label>Y %<input aria-label="Sticker Y position" type="number" min="-50" max="150" step=".5" value={current.y} onChange={event => updatePlacement(current.id, { y: event.target.valueAsNumber })} /></label></div>
            <div className="sticker-playground-layer-actions"><button type="button" title="Duplicate sticker" onClick={() => duplicate(current)} disabled={scene.placements.length >= 80}><Copy size={14} aria-hidden="true" />Duplicate</button><button type="button" title="Center sticker" onClick={() => updatePlacement(current.id, { x: 50, y: 50 })}><RotateCcw size={14} aria-hidden="true" />Center</button></div>
          </div> : <p className="sticker-playground-selection-hint">Select a sticker on the canvas or in Layers to edit it.</p>)}
          {tab === "Layers" && <div className="sticker-playground-layers-panel"><h3><Layers size={15} aria-hidden="true" />Layers</h3><p>Drag to reorder. The top layer is in front.</p>
            <div className="sticker-playground-layers">{frontFirst.map((placement, index) => <div key={placement.id} className="sticker-playground-layer-item" data-layer-id={placement.id} data-drop-target={dropTarget?.id === placement.id ? dropTarget.after ? "after" : "before" : undefined} draggable onDragStart={event => { nativeLayer.current = placement.id; event.dataTransfer.setData("text/plain", placement.id); event.dataTransfer.effectAllowed = "move"; }} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; const rect = event.currentTarget.getBoundingClientRect(); setDropTarget({ id: placement.id, after: event.clientY >= rect.top + rect.height / 2 }); }} onDrop={event => dropLayer(event, placement.id)} onDragEnd={() => { nativeLayer.current = null; setDropTarget(null); }}>
              <button type="button" className="sticker-playground-layer-grip" aria-label={`Drag ${getSticker(placement.name).title} layer`} title="Drag to reorder" onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); layerDrag.current = { id: placement.id, pointerId: event.pointerId, target: null }; }} onPointerMove={layerPointerMove} onPointerUp={event => layerPointerEnd(event)} onPointerCancel={event => layerPointerEnd(event, true)}><GripVertical size={14} aria-hidden="true" /></button>
              <button type="button" className="sticker-playground-layer-select" aria-pressed={placement.id === selected} onClick={() => setSelected(placement.id)}><Sticker name={placement.name} finish={placement.finish} size={30} decorative /><span>{getSticker(placement.name).title}</span></button>
              <button type="button" disabled={index === 0} onClick={() => commit({ ...scene, placements: moveStickerLayer(scene.placements, placement.id, index - 1) })} aria-label={`Move ${getSticker(placement.name).title} forward`} title="Move forward"><ArrowUp size={13} aria-hidden="true" /></button>
              <button type="button" disabled={index === frontFirst.length - 1} onClick={() => commit({ ...scene, placements: moveStickerLayer(scene.placements, placement.id, index + 1) })} aria-label={`Move ${getSticker(placement.name).title} backward`} title="Move backward"><ArrowDown size={13} aria-hidden="true" /></button>
            </div>)}{!scene.placements.length && <p>No layers yet. Add a sticker.</p>}</div>
          </div>}
          {tab === "Canvas" && <div className="sticker-playground-canvas-panel"><h3>Canvas</h3><label className="sticker-playground-caption-field">Canvas text<input maxLength={120} value={scene.caption} onChange={event => commit({ ...scene, caption: event.target.value })} placeholder="Your words here" /></label><StickerBackgroundControl label="Canvas background" value={scene.background} onChange={background => commit({ ...scene, background })} allowTransparent /><p>Stickers may cross the canvas edge. Exports keep that crop and layer order.</p></div>}
        </div>
      </aside>
    </div>
  </section>;
  return onClose ? <dialog ref={dialog} className="sticker-playground-window" aria-label="Sticker playground" onCancel={event => { event.preventDefault(); if (preview) exitPreview(); else onClose(); }} onClose={() => { previewRequested.current = false; setPreview(false); if (document.fullscreenElement === workspace.current) void document.exitFullscreen().catch(() => {}); if (expanded) onClose(); }}>{content}</dialog> : content;
}
