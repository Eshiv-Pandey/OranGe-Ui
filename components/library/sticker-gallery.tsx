"use client";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Search, X, ArrowUpRight, SlidersHorizontal, MousePointer2, LayoutGrid, RotateCcw } from "lucide-react";
import { Sticker, STICKERS, STICKER_CATEGORIES, getSticker, stickerSvg, type StickerName, type StickerCategory, type StickerFinish, type StickerMotion } from "../ui/sticker-pack";
import { WiggleText } from "../ui/wiggle-text";
import { StickerPlayground } from "./sticker-playground";
import { StickerEditorDialog } from "./sticker-editor-dialog";
import { DEFAULT_STICKER_OPTIONS, stickerReactCode, stickerMotionExtent, type StickerOptions } from "../../lib/sticker-options";
import "../../styles/sticker-gallery.css";

const featured: StickerName[] = ["four-point-spark", "essential-heart", "approval-seal", "pointer-pop", "world-wide"];
const subscribeOrigin = () => () => {};
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function StickerGallery() {
  const origin = useSyncExternalStore(subscribeOrigin, () => window.location.origin, () => "http://localhost:3000");
  const install = "npm install orangeui-stickers@0.1.0";
  const registryInstall = `npx shadcn@latest add "${origin}/r/sticker-pack.json?style=polished"`;
  const inspector = useRef<HTMLElement>(null), selectedControl = useRef<HTMLButtonElement | null>(null);
  const [view, setView] = useState<"browse" | "playground">("browse");
  const [previewOpen, setPreviewOpen] = useState(false), [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState(""), [category, setCategory] = useState<StickerCategory | "All">("All");
  const [selected, setSelected] = useState<StickerName>("essential-heart"), [options, setOptions] = useState<StickerOptions>(DEFAULT_STICKER_OPTIONS);
  const [format, setFormat] = useState<"React" | "SVG">("React"), [copied, setCopied] = useState("");
  const [status, setStatus] = useState(""), [exporting, setExporting] = useState(false), [pulse, setPulse] = useState(0), [titleActive, setTitleActive] = useState(false);
  const current = getSticker(selected), normalized = query.trim().toLowerCase();
  const previewFit = Math.min(1, 222 / stickerMotionExtent(options));
  const filtered = STICKERS.filter(sticker => (category === "All" || sticker.category === category) && `${sticker.title} ${sticker.name} ${sticker.tags} ${sticker.category}`.toLowerCase().includes(normalized)).sort((a,b) => Number(b.category === "Everyday") - Number(a.category === "Everyday"));
  const code = format === "React" ? stickerReactCode(selected, options) : stickerSvg(selected, options.size, options.finish);
  function update(patch: Partial<StickerOptions>) { setOptions(previous => ({ ...previous, ...patch })); setCopied(""); }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); setStatus(`${label} copied.`); }
    catch { setCopied(""); setStatus("Clipboard access is unavailable. Select the code below and copy it manually."); }
  }
  async function png() {
    setExporting(true); setStatus("");
    const svgUrl = URL.createObjectURL(new Blob([stickerSvg(selected, 1024, options.finish)], { type: "image/svg+xml" }));
    try {
      const image = new Image(); image.src = svgUrl; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 1024;
      const context = canvas.getContext("2d"); if (!context) throw new Error("No image exporter");
      context.drawImage(image, 0, 0); const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image export failed");
      downloadBlob(blob, `${selected}-${options.finish}.png`); setStatus(`${current.title} PNG downloaded.`);
    } catch { setStatus("PNG export failed. Download the SVG instead."); }
    finally { URL.revokeObjectURL(svgUrl); setExporting(false); }
  }
  function select(name: StickerName, control: HTMLButtonElement) {
    setSelected(name); setCopied(""); setStatus(""); setPreviewOpen(true); setPulse(value => value + 1); selectedControl.current = control;
    if (window.matchMedia("(max-width: 700px)").matches) requestAnimationFrame(() => {
      inspector.current?.querySelector<HTMLButtonElement>(".sticker-peel-preview")?.focus({ preventScroll: true });
      inspector.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function closePreview() { setPreviewOpen(false); requestAnimationFrame(() => selectedControl.current?.focus()); }
  const svgDownload = () => { downloadBlob(new Blob([stickerSvg(selected, options.size, options.finish)], { type: "image/svg+xml" }), `${selected}-${options.finish}.svg`); setStatus(`${current.title} SVG downloaded.`); };
  return <div className="sticker-gallery">
    <header className="sticker-gallery-intro">
      <div><h1 onPointerEnter={() => setTitleActive(true)} onPointerLeave={() => setTitleActive(false)}>A little sticker.<br /><span>A lot of <WiggleText className="sticker-title-wiggle" strength={.9} speed={160} paused={!titleActive}>character.</WiggleText></span></h1><p>{STICKERS.length} original designs. Two finishes. Put a little personality on a website, a profile, or anything you’re making.</p><div className="sticker-intro-actions"><button type="button" className="sticker-primary-action" onClick={() => setView("playground")}><MousePointer2 size={15} aria-hidden="true" /> Try the playground</button><a className="sticker-source-link" href="/api/stickers" download="orangeui-stickers.zip"><Download size={15} aria-hidden="true" /> All SVGs</a></div></div>
      <div className="sticker-fan" aria-label="Try the featured stickers">{featured.map((name, i) => <Sticker key={name} name={name} size={112} rotate={[-17, 9, -5, 14, -10][i]} finish={options.finish} interactive />)}</div>
    </header>
    <div className="sticker-workspace-bar"><div className="sticker-view-tabs" role="group" aria-label="Sticker workspace"><button type="button" aria-pressed={view === "browse"} onClick={() => setView("browse")}><LayoutGrid size={15} aria-hidden="true" /> Collection <span>{STICKERS.length}</span></button><button type="button" aria-pressed={view === "playground"} onClick={() => setView("playground")}><MousePointer2 size={15} aria-hidden="true" /> Playground</button></div><div className="sticker-finish-choice" role="group" aria-label="Artwork finish">{(["sharp", "playful"] as const).map(finish => <button type="button" key={finish} aria-pressed={options.finish === finish} onClick={() => update({ finish })}>{finish === "sharp" ? "Sharp" : "Playful"}</button>)}</div></div>
    <div hidden={view !== "browse"}>
      <div className="sticker-browse-bar"><div className="sticker-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor="sticker-search">Search stickers</label><input id="sticker-search" type="search" placeholder="Heart, coffee, music..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear sticker search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button>}</div><div className="sticker-categories" role="group" aria-label="Sticker collections">{(["All", ...STICKER_CATEGORIES] as const).map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => setCategory(item)}>{item === "All" ? "All stickers" : item}<span>{item === "All" ? STICKERS.length : STICKERS.filter(sticker => sticker.category === item).length}</span></button>)}</div></div>
      <div className="sticker-gallery-layout"><section className="sticker-results" aria-label="Sticker catalogue"><div className="sticker-results-heading"><p className="sticker-result-count" role="status">{filtered.length} {filtered.length === 1 ? "sticker" : "stickers"}{category !== "All" ? ` in ${category}` : " · Everyday favorites first"}</p><span>Click to try one</span></div>
        {filtered.length ? <div className="sticker-grid">{filtered.map((sticker, i) => <button type="button" className="sticker-card" key={sticker.name} aria-label={`Preview ${sticker.title}`} aria-pressed={sticker.name === selected} onClick={event => select(sticker.name, event.currentTarget)}><Sticker name={sticker.name} size={104} finish={options.finish} motion={options.motion} duration={options.duration} intensity={options.intensity} shadow={options.shadow} animationKey={sticker.name === selected ? pulse : 0} rotate={[-4, 3, 0, -2][i % 4]} decorative /><span>{sticker.title}</span>{sticker.name === selected && <Check className="sticker-card-check" size={15} aria-hidden="true" />}</button>)}</div> : <div className="sticker-empty"><h2>No matches yet.</h2><p>Try another name, color, or collection.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all {STICKERS.length} stickers</button></div>}
      </section><aside ref={inspector} className="sticker-inspector" data-preview-open={previewOpen} aria-label="Sticker preview and downloads"><div className="sticker-live-preview"><button type="button" className="sticker-peel-preview" aria-label={`Animate ${current.title}`} onClick={() => setPulse(value => value + 1)}><span className="sticker-inspector-fit" style={{ width: options.size, height: options.size, transform: `scale(${previewFit})` }}><Sticker key={selected} name={selected} {...options} animationKey={pulse} decorative /></span></button><span>{options.motion === "none" ? "Motion is off" : "Click or press Enter to play"}</span><button className="sticker-replay" type="button" onClick={() => setPulse(value => value + 1)} aria-label="Replay sticker animation"><RotateCcw size={14} aria-hidden="true" /></button></div><div className="sticker-inspector-body"><button type="button" className="sticker-preview-close" onClick={closePreview}>Back to stickers</button><div className="sticker-selected-title"><h2>{current.title}</h2><p>{current.category} · {options.finish === "sharp" ? "Sharp finish" : "Playful finish"}</p></div><label className="sticker-size-label" htmlFor="sticker-size">Size <output htmlFor="sticker-size">{options.size} px</output></label><input id="sticker-size" type="range" min="48" max="240" step="8" value={Math.min(options.size,240)} onChange={event => update({ size: Number(event.target.value) })} /><label className="sticker-motion-label">On click<select aria-label="Click animation" value={options.motion} onChange={event => { update({ motion: event.target.value as StickerMotion }); setPulse(value => value + 1); }}><option value="bounce">Bounce</option><option value="wiggle">Wiggle</option><option value="spin">Spin</option><option value="none">None</option></select></label><button type="button" className="sticker-edit-button" onClick={() => setEditorOpen(true)}><SlidersHorizontal size={15} aria-hidden="true" /> Edit sticker <span>More options</span></button>
        <div className="sticker-code-heading"><div>{(["React", "SVG"] as const).map(item => <button type="button" key={item} aria-pressed={format === item} onClick={() => { setFormat(item); setCopied(""); }}>{item}</button>)}</div><button type="button" aria-label="Copy sticker code" onClick={() => copy(code, "Code")}>{copied === "Code" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied === "Code" ? "Copied" : "Copy"}</button></div><pre className="sticker-code" tabIndex={0} role="region" aria-label="Sticker code"><code>{code}</code></pre><div className="sticker-downloads"><button type="button" onClick={svgDownload}><Download size={14} aria-hidden="true" /> SVG</button><button type="button" disabled={exporting} onClick={png}><Download size={14} aria-hidden="true" /> {exporting ? "Exporting..." : "PNG"}</button></div><button type="button" className="sticker-add-link" onClick={() => setView("playground")}><MousePointer2 size={14} aria-hidden="true" /> Place in playground <ArrowUpRight size={13} aria-hidden="true" /></button><p className="sticker-action-status" role="status">{status}</p><Link className="sticker-api-link" href="/components/sticker-pack">Component API <ArrowUpRight size={12} aria-hidden="true" /></Link></div></aside></div>
    </div>
    <div hidden={view !== "playground"}><StickerPlayground name={selected} finish={options.finish as StickerFinish} options={options} /></div>
    <section className="sticker-install" aria-label="Install the sticker package"><div><h2>Take them with you.</h2><p>A real npm package, with React components, TypeScript types, and standalone CSS. MIT licensed. No Next.js or Tailwind required.</p><a className="sticker-package-download" href="/downloads/orangeui-stickers-0.1.0.tgz" download>Download npm package <Download size={14} aria-hidden="true" /></a></div><div><div className="sticker-install-command"><code>{install}</code><button type="button" aria-label="Copy sticker installation command" onClick={() => copy(install, "Installation")}>{copied === "Installation" ? <Check size={16} /> : <Copy size={16} />}</button></div><p>Install from npm. Import from <code>orangeui-stickers</code> and include <code>orangeui-stickers/styles.css</code>.</p><details className="sticker-registry-install"><summary>Prefer to own the source?</summary><div className="sticker-install-command"><code>{registryInstall}</code><button type="button" aria-label="Copy source installation command" onClick={() => copy(registryInstall, "Source installation")}><Copy size={16} /></button></div><p><a href="/api/components/sticker-pack?style=polished" download>Download React source ZIP</a></p></details></div></section>
    {editorOpen && <StickerEditorDialog name={selected} options={options} onChange={setOptions} onClose={() => setEditorOpen(false)} onPlayground={() => { setEditorOpen(false); setView("playground"); }} />}
  </div>;
}
