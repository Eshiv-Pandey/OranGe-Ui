"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Bike, Footprints, LocateFixed, MapPin, Maximize2, Minus, Plus, Route, TrainFront, X } from "lucide-react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { fitMapCoordinates, mapTileUrl, pointNearCenter, MAP_TILE_SIZE, type MapCoordinate, type MapPoint } from "./agent-map-geometry";
import "../../styles/agent-map.css";

export type AgentMapStop = MapCoordinate & { id: string; name: string; description?: string; image?: string; href?: string; duration?: string };
export type AgentMapRoute = { id: string; label: string; mode?: "walk" | "cycle" | "transit"; duration?: string; coordinates: readonly MapCoordinate[] };
export type AgentMapProps = AppearanceProps & {
  stops: readonly AgentMapStop[]; routes?: readonly AgentMapRoute[];
  value?: string; defaultValue?: string; onValueChange?: (id: string) => void;
  route?: string; onRouteChange?: (id: string) => void;
  onReorder?: (stops: AgentMapStop[]) => void; children?: ReactNode;
  tileUrl?: string | false; tileAttribution?: ReactNode;
  accent?: string; theme?: CreativeTheme; label?: string; height?: number | string;
  showCards?: boolean; showExpand?: boolean; style?: CSSProperties;
};
const DEFAULT_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const modeIcons = { walk: Footprints, cycle: Bike, transit: TrainFront };

/** Geographic XYZ tile map with original route and stop controls; no map SDK or token. */
export function AgentMap({ stops, routes = [], value, defaultValue, onValueChange, route, onRouteChange, onReorder, children, tileUrl = DEFAULT_TILES, tileAttribution, accent = "#dc5c28", theme = "auto", label = "Places and routes", height: frameHeight = 460, showCards = true, showExpand = true, appearance = "polished", className, style }: AgentMapProps) {
  const resolvedTheme = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null), map = useRef<HTMLDivElement>(null), id = useId();
  const [{ width, height }, setDimensions] = useState({ width: 800, height: 460 });
  const [selected, setSelected] = useState(defaultValue ?? stops[0]?.id ?? ""), [localRoute, setLocalRoute] = useState(routes[0]?.id ?? ""), [expanded, setExpanded] = useState(false), [failedTiles, setFailedTiles] = useState(false);
  const validStops = stops.filter(stop => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));
  const activeId = value ?? (validStops.some(stop => stop.id === selected) ? selected : validStops[0]?.id ?? ""), activeRoute = routes.find(item => item.id === (route ?? localRoute)) ?? routes[0];
  const coordinates = useMemo(() => [...stops.filter(stop => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)), ...(activeRoute?.coordinates ?? []).filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))], [stops, activeRoute]);
  const fitted = useMemo(() => fitMapCoordinates(coordinates, width, height), [coordinates, width, height]);
  const [view, setView] = useState<{ key: typeof fitted; zoom: number; center: MapPoint } | null>(null);
  const current = view?.key === fitted ? view : { ...fitted, key: fitted }, { zoom, center } = current;
  const drag = useRef<{ pointer: number; x: number; y: number; center: MapPoint; moved: boolean } | null>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!map.current) return;
    const element = map.current;
    const resize = () => { const box = element.getBoundingClientRect(); if (box.width > 0 && box.height > 0) setDimensions({ width: box.width, height: box.height }); };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    return () => observer.disconnect();
  }, [expanded]);
  const choose = (stopId: string) => { if (value === undefined) setSelected(stopId); onValueChange?.(stopId); };
  const fit = () => setView({ ...fitted, key: fitted });
  const changeZoom = (delta: number) => { const next = Math.min(18, Math.max(1, zoom + delta)), scale = 2 ** (next - zoom); setView({ key: fitted, zoom: next, center: { x: center.x * scale, y: center.y * scale } }); };
  const focusStop = (stop: AgentMapStop) => { choose(stop.id); setView({ key: fitted, zoom, center: pointNearCenter(stop, zoom, center) }); };
  const project = (point: MapCoordinate) => { const p = pointNearCenter(point, zoom, center); return { x: p.x - center.x + width / 2, y: p.y - center.y + height / 2 }; };
  const tiles = [];
  if (tileUrl) {
    const startX = Math.floor((center.x - width / 2) / MAP_TILE_SIZE), startY = Math.floor((center.y - height / 2) / MAP_TILE_SIZE);
    for (let y = startY; y <= Math.floor((center.y + height / 2) / MAP_TILE_SIZE); y++) for (let x = startX; x <= Math.floor((center.x + width / 2) / MAP_TILE_SIZE); x++) {
      if (y < 0 || y >= 2 ** zoom) continue;
      tiles.push({ key: `${zoom}/${x}/${y}`, url: mapTileUrl(tileUrl, x, y, zoom), x: x * MAP_TILE_SIZE - center.x + width / 2, y: y * MAP_TILE_SIZE - center.y + height / 2 });
    }
  }
  useEffect(() => {
    if (!expanded) {
      if (returnFocus.current) { root.current?.querySelector<HTMLButtonElement>(".agent-map-expand")?.focus(); returnFocus.current = false; }
      return;
    }
    returnFocus.current = true;
    const previous = document.body.style.overflow, focused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLButtonElement>(".agent-map-expand")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setExpanded(false); }
      if (event.key !== "Tab" || !root.current) return;
      const items = Array.from(root.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],select,[tabindex="0"]'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); if (focused?.isConnected) focused.focus(); };
  }, [expanded]);
  const stopCards = validStops.map((stop, index) => <li key={stop.id} data-selected={activeId === stop.id}>
    <button className="agent-map-stop-card" type="button" aria-pressed={activeId === stop.id} onClick={() => focusStop(stop)}>
      {/* Native image keeps the exported component independent of Next.js. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {stop.image ? <img src={stop.image} alt="" loading="lazy" /> : <span className="agent-map-stop-number">{index + 1}</span>}
      <span><small>{stop.duration ?? (index === 0 ? "Start here" : `Stop ${index + 1}`)}</small><strong>{stop.name}</strong>{stop.description && <span>{stop.description}</span>}</span>
    </button>
    {(onReorder || stop.href) && <div className="agent-map-stop-actions">
      {stop.href && <a href={stop.href} target="_blank" rel="noreferrer">Place details</a>}
      {onReorder && <><button type="button" aria-label={`Move ${stop.name} earlier`} disabled={index === 0} onClick={() => { const next = [...stops]; const actual = next.findIndex(item => item.id === stop.id); [next[actual - 1], next[actual]] = [next[actual], next[actual - 1]]; onReorder(next); }}><ArrowUp size={14} /></button><button type="button" aria-label={`Move ${stop.name} later`} disabled={index === validStops.length - 1} onClick={() => { const next = [...stops]; const actual = next.findIndex(item => item.id === stop.id); [next[actual], next[actual + 1]] = [next[actual + 1], next[actual]]; onReorder(next); }}><ArrowDown size={14} /></button></>}
    </div>}
  </li>);
  const content = <div ref={root} className={["creative-surface agent-map", className].filter(Boolean).join(" ")} data-theme={resolvedTheme} data-appearance={appearance} data-expanded={expanded} role={expanded ? "dialog" : "region"} aria-modal={expanded || undefined} aria-label={label} style={{ ...style, "--agent-map-accent": accent, "--agent-map-height": typeof frameHeight === "number" ? `${frameHeight}px` : frameHeight } as CSSProperties}>
    <div ref={map} className="agent-map-viewport" tabIndex={0} aria-label="Map. Drag to pan; arrow keys pan; plus and minus zoom; Home fits the route." onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      const offsets: Record<string, MapPoint> = { ArrowLeft: { x: -80, y: 0 }, ArrowRight: { x: 80, y: 0 }, ArrowUp: { x: 0, y: -80 }, ArrowDown: { x: 0, y: 80 } };
      if (offsets[event.key]) { event.preventDefault(); const p = offsets[event.key]; setView({ key: fitted, zoom, center: { x: center.x + p.x, y: center.y + p.y } }); }
      else if (["+", "=", "-", "Home"].includes(event.key)) { event.preventDefault(); if (event.key === "Home") fit(); else changeZoom(event.key === "-" ? -1 : 1); }
    }} onPointerDown={event => { if (event.button !== 0 || (event.target as Element).closest("button,a,select")) return; drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, center, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => {
      const state = drag.current; if (!state || state.pointer !== event.pointerId) return;
      const box = event.currentTarget.getBoundingClientRect(), dx = (event.clientX - state.x) * width / box.width, dy = (event.clientY - state.y) * height / box.height;
      state.moved ||= Math.abs(dx) + Math.abs(dy) > 5;
      setView({ key: fitted, zoom, center: { x: state.center.x - dx, y: state.center.y - dy } });
    }} onPointerUp={event => { if (drag.current?.pointer === event.pointerId) { drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); } }} onPointerCancel={() => { drag.current = null; }}>
      <svg className="agent-map-drawing" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><pattern id={`${id}-grid`} width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="currentColor" strokeWidth=".5" opacity=".12" /></pattern></defs>
        <rect width={width} height={height} fill="var(--agent-map-ground)" /><rect width={width} height={height} fill={`url(#${id}-grid)`} />
        {tiles.map(tile => <image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={MAP_TILE_SIZE + .5} height={MAP_TILE_SIZE + .5} onError={() => setFailedTiles(true)} />)}
        {routes.map(item => { const points = item.coordinates.filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)).map(project); const path = points.map((point, i) => `${i ? "L" : "M"}${point.x},${point.y}`).join(" "); return <g key={item.id}><path d={path} fill="none" stroke="white" strokeWidth={item.id === activeRoute?.id ? 9 : 7} opacity=".85" /><path d={path} fill="none" stroke={item.id === activeRoute?.id ? accent : "#747b86"} strokeWidth={item.id === activeRoute?.id ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={item.id === activeRoute?.id ? "1 10" : "1 9"} opacity={item.id === activeRoute?.id ? 1 : .65} /></g>; })}
        {!routes.length && validStops.length > 1 && <path d={validStops.map((stop, index) => { const point = project(stop); return `${index ? "L" : "M"}${point.x},${point.y}`; }).join(" ")} fill="none" stroke={accent} strokeWidth="3" strokeDasharray="5 7" />}
      </svg>
      {validStops.map((stop, index) => { const point = project(stop); const left = point.x / width * 100, top = point.y / height * 100; if (left < -10 || left > 110 || top < -10 || top > 110) return null; return <button key={stop.id} type="button" className="agent-map-marker" style={{ left: `${left}%`, top: `${top}%` }} aria-label={`Select ${stop.name} ${index + 1}`} aria-pressed={activeId === stop.id} onClick={() => choose(stop.id)}><span className="agent-map-marker-label">{stop.name}</span>{" "}<span className="agent-map-marker-pin" aria-hidden="true">{index + 1}</span></button>; })}
      <div className="agent-map-toolbar">
        {routes.length ? <label className="agent-map-route"><Route size={15} /><select aria-label="Map route" value={activeRoute?.id ?? ""} onChange={event => { if (route === undefined) setLocalRoute(event.target.value); onRouteChange?.(event.target.value); fit(); }}>{routes.map(item => <option key={item.id} value={item.id}>{item.label}{item.duration ? ` · ${item.duration}` : ""}</option>)}</select></label> : <span className="agent-map-route"><MapPin size={15} />{validStops.length} places</span>}
        {showExpand && <button type="button" className="agent-map-expand" aria-label={expanded ? "Close full screen map" : "Expand map"} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={17} /> : <Maximize2 size={17} />}</button>}
      </div>
      <div className="agent-map-zoom"><button type="button" aria-label="Zoom in" disabled={zoom === 18} onClick={() => changeZoom(1)}><Plus size={17} /></button><button type="button" aria-label="Zoom out" disabled={zoom === 1} onClick={() => changeZoom(-1)}><Minus size={17} /></button><button type="button" aria-label="Fit all places" onClick={fit}><LocateFixed size={17} /></button></div>
      {activeRoute && <div className="agent-map-summary">{(() => { const Icon = modeIcons[activeRoute.mode ?? "walk"]; return <Icon size={15} />; })()}<span>{activeRoute.duration ?? activeRoute.label}</span></div>}
      {(!tileUrl || failedTiles) && <span className="agent-map-offline">{tileUrl ? "Map tiles unavailable. Route preview remains usable." : "Route preview"}</span>}
      {!validStops.length && <p className="agent-map-empty">Add places with latitude and longitude to show a map.</p>}
      <div className="agent-map-attribution">{tileAttribution ?? (tileUrl === DEFAULT_TILES ? <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> : "")}</div>
    </div>
    {showCards && validStops.length > 0 && <ol className="agent-map-stops" aria-label="Map stops">{stopCards}</ol>}
    {children && <div className="agent-map-composer">{children}</div>}
  </div>;
  return expanded ? createPortal(content, document.body) : content;
}
