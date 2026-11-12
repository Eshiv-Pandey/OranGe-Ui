"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Search, X, ArrowUpRight, SlidersHorizontal, MousePointer2, LayoutGrid, RotateCcw } from "lucide-react";
import { Sticker, STICKERS, STICKER_CATEGORIES, getSticker, stickerSvg, type StickerName, type StickerCategory } from "../ui/sticker-pack";
import { WiggleText } from "../ui/wiggle-text";
import { StickerPlayground } from "./sticker-playground";
import { StickerEditorDialog } from "./sticker-editor-dialog";
import { StickerControls } from "./sticker-controls";
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
  const install = "npm install orangeui-stickers@0.1.2";
  const registryInstall = `npx shadcn@latest add "${origin}/r/sticker-pack.json?style=polished"`;
  const inspector = useRef<HTMLElement>(null), selectedControl = useRef<HTMLButtonElement | null>(null), playgroundControl = useRef<HTMLButtonElement>(null);
  const previewBoard = useRef<HTMLButtonElement>(null);
  const [previewRoom, setPreviewRoom] = useState(112);
  const [view, setView] = useState<"browse" | "playground">("browse");
  const [previewOpen, setPreviewOpen] = useState(false), [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState(""), [category, setCategory] = useState<StickerCategory | "All">("All");
  const [selected, setSelected] = useState<StickerName>("essential-heart"), [options, setOptions] = useState<StickerOptions>(DEFAULT_STICKER_OPTIONS);
  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState(""), [exporting, setExporting] = useState(false), [pulse, setPulse] = useState(0), [titleActive, setTitleActive] = useState(false);
  const current = getSticker(selected), normalized = query.trim().toLowerCase();
  const previewFit = Math.min(1, previewRoom / stickerMotionExtent(options));
  useEffect(() => {
    const element = previewBoard.current;
    if (!element) return;
    const measure = () => { const rect = element.getBoundingClientRect(); if (rect.width && rect.height) setPreviewRoom(Math.max(32, Math.min(rect.width, rect.height) - 12)); };
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, []);
  const filtered = STICKERS.filter(sticker => (category === "All" || sticker.category === category) && `${sticker.title} ${sticker.name} ${sticker.tags} ${sticker.category}`.toLowerCase().includes(normalized)).sort((a,b) => Number(b.category === "Everyday") - Number(a.category === "Everyday"));
  function update(patch: Partial<StickerOptions>) { setOptions(previous => ({ ...previous, ...patch })); setCopied(""); }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); setStatus(`${label} copied.`); }
    catch { setCopied(""); setStatus("Clipboard access is unavailable. Download the React component instead."); }
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
  function closePlayground() { setView("browse"); requestAnimationFrame(() => playgroundControl.current?.focus()); }
  function reactDownload() { downloadBlob(new Blob([`${stickerReactCode(selected, options)}\n`], { type: "text/plain" }), `${selected}-sticker.tsx`); setStatus(`${current.title} React code downloaded.`); }
  const svgDownload = () => { downloadBlob(new Blob([stickerSvg(selected, options.size, options.finish)], { type: "image/svg+xml" }), `${selected}-${options.finish}.svg`); setStatus(`${current.title} SVG downloaded.`); };
  return <div className="sticker-gallery">
    <header className="sticker-gallery-intro">
      <div><h1 onPointerEnter={() => setTitleActive(true)} onPointerLeave={() => setTitleActive(false)}>A little sticker. <span>A lot of <WiggleText className="sticker-title-wiggle" strength={.9} speed={160} paused={!titleActive}>character.</WiggleText></span></h1><p>{STICKERS.length} originals. Sharp or playful. Make them yours.</p><a className="sticker-source-link" href="/api/stickers" download="orangeui-stickers.zip"><Download size={14} aria-hidden="true" /> All SVGs</a></div>
      <div className="sticker-fan" aria-label="Try the featured stickers">{featured.map((name, i) => <Sticker key={name} name={name} size={76} rotate={[-17, 9, -5, 14, -10][i]} finish={options.finish} interactive />)}</div>
    </header>
    <div className="sticker-workspace-bar"><div className="sticker-view-tabs" role="group" aria-label="Sticker workspace"><span className="sticker-collection-label"><LayoutGrid size={15} aria-hidden="true" /> Collection <span>{STICKERS.length}</span></span><button ref={playgroundControl} type="button" className="sticker-open-playground" onClick={() => setView("playground")}><MousePointer2 size={15} aria-hidden="true" /> Playground <ArrowUpRight size={14} aria-hidden="true" /></button></div><div className="sticker-finish-choice" role="group" aria-label="Artwork finish">{(["sharp", "playful"] as const).map(finish => <button type="button" key={finish} aria-pressed={options.finish === finish} onClick={() => update({ finish })}>{finish === "sharp" ? "Sharp" : "Playful"}</button>)}</div></div>
    <div hidden={view !== "browse"}>
      <div className="sticker-gallery-layout"><section className="sticker-results" aria-label="Sticker catalogue">
      <div className="sticker-browse-bar"><div className="sticker-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor="sticker-search">Search stickers</label><input id="sticker-search" type="search" placeholder="Heart, coffee, music..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear sticker search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button>}</div><div className="sticker-categories" role="group" aria-label="Sticker collections">{(["All", ...STICKER_CATEGORIES] as const).map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => setCategory(item)}>{item === "All" ? "All stickers" : item}<span>{item === "All" ? STICKERS.length : STICKERS.filter(sticker => sticker.category === item).length}</span></button>)}</div></div>
      <div className="sticker-results-heading"><p className="sticker-result-count" role="status">{filtered.length} {filtered.length === 1 ? "sticker" : "stickers"}{category !== "All" ? ` in ${category}` : " · Everyday favorites first"}</p><span>Click to try one</span></div>
        {filtered.length ? <div className="sticker-grid">{filtered.map((sticker, i) => <button type="button" className="sticker-card" key={sticker.name} aria-label={`Preview ${sticker.title}`} aria-pressed={sticker.name === selected} onClick={event => select(sticker.name, event.currentTarget)}><Sticker name={sticker.name} size={104} finish={options.finish} motion={options.motion} duration={options.duration} intensity={options.intensity} shadow={options.shadow} animationKey={sticker.name === selected ? pulse : 0} rotate={[-4, 3, 0, -2][i % 4]} decorative /><span>{sticker.title}</span>{sticker.name === selected && <Check className="sticker-card-check" size={15} aria-hidden="true" />}</button>)}</div> : <div className="sticker-empty"><h2>No matches yet.</h2><p>Try another name, color, or collection.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all {STICKERS.length} stickers</button></div>}
      </section><aside ref={inspector} className="sticker-inspector" data-preview-open={previewOpen} aria-label="Sticker preview and downloads">
        <div className="sticker-live-preview"><button type="button" ref={previewBoard} className="sticker-peel-preview" aria-label={`Animate ${current.title}`} onClick={() => setPulse(value => value + 1)}><span className="sticker-inspector-fit" style={{ width: options.size, height: options.size, transform: `scale(${previewFit})` }}><Sticker key={selected} name={selected} {...options} animationKey={pulse} decorative /></span></button><button className="sticker-replay" type="button" onClick={() => setPulse(value => value + 1)} aria-label="Replay sticker animation"><RotateCcw size={14} aria-hidden="true" /></button></div>
        <div className="sticker-inspector-body"><button type="button" className="sticker-preview-close" onClick={closePreview}>Back to stickers</button><div className="sticker-selected-title"><h2>{current.title}</h2><button type="button" className="sticker-edit-icon" onClick={() => setEditorOpen(true)} aria-label="Edit sticker"><SlidersHorizontal size={16} aria-hidden="true" /></button></div>
          <StickerControls options={options} onChange={update} />
          <div className="sticker-export-actions"><button type="button" onClick={() => copy(stickerReactCode(selected, options), "Code")} aria-label="Copy sticker React code">{copied === "Code" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copied === "Code" ? "Copied" : "Copy"}</button><button type="button" onClick={reactDownload} aria-label="Download sticker React code"><Download size={14} aria-hidden="true" /> React</button><button type="button" onClick={svgDownload}><Download size={14} aria-hidden="true" /> SVG</button><button type="button" disabled={exporting} onClick={png}><Download size={14} aria-hidden="true" /> {exporting ? "Exporting..." : "PNG"}</button></div><p className="sticker-action-status" role="status">{status}</p><Link className="sticker-api-link" href="/components/sticker-pack">Component API <ArrowUpRight size={12} aria-hidden="true" /></Link>
        </div></aside></div>
    </div>
    <StickerPlayground name={selected} finish={options.finish} options={options} expanded={view === "playground"} onClose={closePlayground} />
    <section className="sticker-install" aria-label="Install the sticker package"><div><h2>Take them with you.</h2><p>A real npm package, with React components, TypeScript types, and standalone CSS. MIT licensed. No Next.js or Tailwind required.</p><a className="sticker-package-download" href="/downloads/orangeui-stickers-0.1.2.tgz" download>Download npm package <Download size={14} aria-hidden="true" /></a></div><div><div className="sticker-install-command"><code>{install}</code><button type="button" aria-label="Copy sticker installation command" onClick={() => copy(install, "Installation")}>{copied === "Installation" ? <Check size={16} /> : <Copy size={16} />}</button></div><p>Install from npm. Import from <code>orangeui-stickers</code> and include <code>orangeui-stickers/styles.css</code>.</p><details className="sticker-registry-install"><summary>Prefer to own the source?</summary><div className="sticker-install-command"><code>{registryInstall}</code><button type="button" aria-label="Copy source installation command" onClick={() => copy(registryInstall, "Source installation")}><Copy size={16} /></button></div><p><a href="/api/components/sticker-pack?style=polished" download>Download React source ZIP</a></p></details></div></section>
    {editorOpen && <StickerEditorDialog name={selected} options={options} onChange={setOptions} onClose={() => setEditorOpen(false)} onPlayground={() => { setEditorOpen(false); setView("playground"); }} />}
  </div>;
}
