"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent, type FocusEvent } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { EditorRange } from "../ui/editor-controls";
import { MORPH_ICONS, MorphIcon, morphIconSvg, useMorphReducedMotion, type MorphIconName } from "../ui/morphing-icons";
import "../../styles/morph-icons-demo.css";

const categories = ["All", "Navigation", "Workspace", "Media", "Actions", "Communication"] as const;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};

/** Only the showcase owns playback. Application icons follow their controlled active prop. */
export function MorphIconsDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const root = useRef<HTMLDivElement>(null), visible = useRef(new Set<MorphIconName>());
  const hovered = useRef(new Set<MorphIconName>()), focused = useRef(new Set<MorphIconName>()), held = useRef(new Set<MorphIconName>());
  const [states, setStates] = useState<Partial<Record<MorphIconName, boolean>>>({});
  const [selected, setSelected] = useState<MorphIconName>("menu");
  const [search, setSearch] = useState(""), [category, setCategory] = useState<typeof categories[number]>("All");
  const [playing, setPlaying] = useState(true), [heldCount, setHeldCount] = useState(0), [onScreen, setOnScreen] = useState(false);
  const [size, setSize] = useState(80), [stroke, setStroke] = useState(1.75), [duration, setDuration] = useState(260);
  const [feedback, setFeedback] = useState(""), [copyFallback, setCopyFallback] = useState("");
  const reduced = useMorphReducedMotion();
  const documentVisible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const items = thumbnail ? MORPH_ICONS.filter(icon => ["menu", "play-pause", "sun-moon", "heart", "copy", "lock"].includes(icon.name)) : MORPH_ICONS.filter(icon => (category === "All" || icon.category === category) && `${icon.title} ${icon.name} ${icon.states.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()));
  const definition = MORPH_ICONS.find(icon => icon.name === selected)!;
  const active = !!states[selected];
  const running = playing && !reduced && documentVisible && onScreen;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      visible.current = new Set(Array.from(node.querySelectorAll<HTMLElement>("[data-preview-name]")).map(item => item.dataset.previewName as MorphIconName));
      const frame = requestAnimationFrame(() => setOnScreen(true));
      return () => cancelAnimationFrame(frame);
    }
    const sceneObserver = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: .01 });
    const iconObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const name = (entry.target as HTMLElement).dataset.previewName as MorphIconName;
        if (entry.isIntersecting) visible.current.add(name); else visible.current.delete(name);
      });
    }, { threshold: .2 });
    visible.current.clear();
    sceneObserver.observe(node);
    node.querySelectorAll("[data-preview-name]").forEach(item => iconObserver.observe(item));
    return () => { sceneObserver.disconnect(); iconObserver.disconnect(); visible.current.clear(); };
  }, [search, category, thumbnail]);

  useEffect(() => {
    if (!running) return;
    let phase = 0;
    const timer = window.setInterval(() => {
      const current = phase++ % 4;
      const names = MORPH_ICONS.filter((icon, index) => index % 4 === current && visible.current.has(icon.name) && !hovered.current.has(icon.name) && !focused.current.has(icon.name) && !held.current.has(icon.name)).map(icon => icon.name);
      if (names.length) setStates(previous => {
        const next = { ...previous };
        names.forEach(name => { next[name] = !previous[name]; });
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [running]);

  function toggle(name: MorphIconName) {
    setSelected(name);
    setStates(previous => ({ ...previous, [name]: !previous[name] }));
    setFeedback(""); setCopyFallback("");
  }
  function pointerEnter(name: MorphIconName, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== "touch") hovered.current.add(name);
  }
  function pointerDown(name: MorphIconName, event: PointerEvent<HTMLButtonElement>) {
    focused.current.delete(name);
    if (event.pointerType === "touch") { held.current.add(name); setHeldCount(held.current.size); }
  }
  function focus(name: MorphIconName, event: FocusEvent<HTMLButtonElement>) {
    if (event.currentTarget.matches(":focus-visible")) focused.current.add(name);
  }
  function playback() {
    if (!playing || heldCount) { held.current.clear(); setHeldCount(0); setPlaying(true); }
    else setPlaying(false);
  }
  function chooseState(value: boolean) {
    held.current.add(selected); setHeldCount(held.current.size);
    setStates(previous => ({ ...previous, [selected]: value }));
    setFeedback(""); setCopyFallback("");
  }
  const reactCode = `import { MorphIcon } from "./orangeui/components/ui/morphing-icons";\n\n<MorphIcon\n  name="${selected}"\n  active={${active}}\n  size={${size}}\n  strokeWidth={${stroke}}\n  duration={${duration}}\n/>`;
  async function copyReact() {
    try { await navigator.clipboard.writeText(reactCode); setFeedback("React code copied."); setCopyFallback(""); }
    catch { setCopyFallback(reactCode); setFeedback("Select and copy the code below."); }
  }
  function downloadSvg() {
    const url = URL.createObjectURL(new Blob([morphIconSvg(selected, active, size, stroke)], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${selected}-${active ? "active" : "idle"}.svg`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("SVG downloaded. This is the selected still state.");
  }

  const preview = <div ref={root} className="morph-icons-gallery" data-morph-gallery data-running={running} data-thumbnail={thumbnail || undefined}>
    {!thumbnail && <>
      <header className="morph-icons-heading"><div><h2>Morphing icons</h2><p>Hover to hold. Click to switch.</p></div><button type="button" className="morph-playback" onClick={playback} disabled={reduced} aria-label={reduced ? "Motion off: reduced motion is on" : playing && !heldCount ? "Pause previews" : "Resume previews"}><MorphIcon name="play-pause" active={playing && !heldCount && !reduced} size={16} /><span>{reduced ? "Motion off" : playing && !heldCount ? "Pause" : "Resume"}</span></button></header>
      <label className="morph-icons-search"><MorphIcon name="search" size={18} /><span className="sr-only">Search morphing icons</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search icons or states..." /></label>
      <div className="morph-icons-filters" role="group" aria-label="Icon categories">{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
      <p className="morph-icons-count" role="status">{items.length} {items.length === 1 ? "icon" : "icons"}{reduced ? " · Reduced motion is on" : heldCount ? " · Resume releases held previews" : " · Two states each"}</p>
    </>}
    <div className="morph-icons-grid">{items.map(icon => <button type="button" key={icon.name} data-preview-name={icon.name} data-selected={!thumbnail && selected === icon.name || undefined} className="morph-icon-tile" aria-label={`${icon.name === "notification" ? "Alerts" : icon.title}, ${icon.states[states[icon.name] ? 1 : 0]}. Switch state`} onPointerEnter={event => pointerEnter(icon.name, event)} onPointerLeave={() => hovered.current.delete(icon.name)} onPointerDown={event => pointerDown(icon.name, event)} onFocus={event => focus(icon.name, event)} onBlur={() => focused.current.delete(icon.name)} onClick={() => toggle(icon.name)}><MorphIcon name={icon.name} active={!!states[icon.name]} size={thumbnail ? 40 : 48} strokeWidth={stroke} duration={duration} appearance={appearance} />{!thumbnail && <span>{icon.name === "notification" ? "Alerts" : icon.title}</span>}</button>)}</div>
    {!items.length && <div className="morph-icons-empty"><MorphIcon name="search" size={32} /><p>No matching icons.</p><button type="button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
  </div>;

  if (thumbnail) return preview;
  return <div className="creative-demo morph-icons-demo"><CreativeWorkbench preview={preview}>
    <div className="morph-icon-controls">
      <div className="morph-selected-heading"><h3>{definition.title}</h3><span>{definition.category}</span></div>
      <div className="morph-selected-stage"><button type="button" className="morph-selected-preview" aria-label={`Switch ${definition.title} state`} onPointerEnter={event => pointerEnter(selected, event)} onPointerLeave={() => hovered.current.delete(selected)} onPointerDown={event => pointerDown(selected, event)} onFocus={event => focus(selected, event)} onBlur={() => focused.current.delete(selected)} onClick={() => toggle(selected)}><MorphIcon name={selected} active={active} size={size} strokeWidth={stroke} duration={duration} appearance={appearance} /></button>
      <div className="morph-state-picker" role="group" aria-label="Selected icon state">{definition.states.map((state, index) => <button type="button" key={state} aria-pressed={active === !!index} onClick={() => chooseState(!!index)}>{state}</button>)}</div></div>
      <EditorRange label="Icon size" value={size} min={16} max={128} step={4} onChange={setSize} formatValue={value => `${value}px`} />
      <EditorRange label="Stroke" value={stroke} min={1} max={3} step={.25} onChange={setStroke} formatValue={value => `${value}px`} />
      <EditorRange label="Duration" value={duration} min={120} max={600} step={20} onChange={setDuration} formatValue={value => `${value}ms`} />
      <div className="morph-icon-actions"><button type="button" onClick={copyReact}><MorphIcon name="copy" size={16} />Copy React</button><button type="button" onClick={downloadSvg}><MorphIcon name="download" size={16} />SVG</button></div>
      <p className="morph-icon-feedback" role="status">{feedback || "Connect active to your app state."}</p>
      {copyFallback && <label className="morph-copy-fallback">React code<textarea readOnly rows={7} value={copyFallback} onFocus={event => event.currentTarget.select()} /></label>}
    </div>
  </CreativeWorkbench></div>;
}
