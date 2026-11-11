"use client";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Search, X, ArrowUpRight } from "lucide-react";
import { Sticker, STICKERS, STICKER_CATEGORIES, getSticker, stickerSvg, type StickerName, type StickerCategory } from "../ui/sticker-pack";
import "../../styles/sticker-gallery.css";

const featured: StickerName[] = ["miso-moth", "checkered-daisy", "orbit-snail", "sunday-skate", "peach-planet"];
const subscribeOrigin = () => () => {};
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StickerGallery() {
  const origin = useSyncExternalStore(subscribeOrigin, () => window.location.origin, () => "http://localhost:3000");
  const install = `npx shadcn@latest add "${origin}/r/sticker-pack.json?style=polished"`;
  const inspector = useRef<HTMLElement>(null);
  const selectedControl = useRef<HTMLButtonElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [query, setQuery] = useState(""), [category, setCategory] = useState<StickerCategory | "All">("All");
  const [selected, setSelected] = useState<StickerName>("orbit-snail"), [size, setSize] = useState(180), [peel, setPeel] = useState(true);
  const [format, setFormat] = useState<"React" | "SVG">("React"), [copied, setCopied] = useState("");
  const [status, setStatus] = useState(""), [exporting, setExporting] = useState(false);
  const current = getSticker(selected), normalized = query.trim().toLowerCase();
  const filtered = STICKERS.filter(sticker => (category === "All" || sticker.category === category) && `${sticker.title} ${sticker.name} ${sticker.tags} ${sticker.category}`.toLowerCase().includes(normalized));
  const reactCode = `import { Sticker } from "./orangeui/components/ui/sticker-pack";\n\n<Sticker\n  name="${selected}"\n  size={${size}}${peel ? "\n  hoverPeel" : ""}\n/>`;
  const code = format === "React" ? reactCode : stickerSvg(selected, size);
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopied(label); setStatus(`${label} copied.`); }
    catch { setCopied(""); setStatus("Clipboard access is unavailable. Select the code below and copy it manually."); }
  }
  async function png() {
    setExporting(true); setStatus("");
    const svgUrl = URL.createObjectURL(new Blob([stickerSvg(selected, 1024)], { type: "image/svg+xml" }));
    try {
      const image = new Image(); image.src = svgUrl; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 1024;
      const context = canvas.getContext("2d"); if (!context) throw new Error("No image exporter");
      context.drawImage(image, 0, 0); const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image export failed");
      downloadBlob(blob, `${selected}.png`); setStatus(`${current.title} PNG downloaded.`);
    } catch { setStatus("PNG export failed. Download the SVG instead."); }
    finally { URL.revokeObjectURL(svgUrl); setExporting(false); }
  }
  function select(name: StickerName, control: HTMLButtonElement) {
    setSelected(name); setCopied(""); setStatus(""); setPreviewOpen(true); selectedControl.current = control;
    if (window.matchMedia("(max-width: 700px)").matches) requestAnimationFrame(() => {
      inspector.current?.querySelector<HTMLButtonElement>(".sticker-peel-preview")?.focus({ preventScroll: true });
      inspector.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function closePreview() { setPreviewOpen(false); requestAnimationFrame(() => selectedControl.current?.focus()); }
  const svgDownload = () => { downloadBlob(new Blob([stickerSvg(selected)], { type: "image/svg+xml" }), `${selected}.svg`); setStatus(`${current.title} SVG downloaded.`); };
  return <div className="sticker-gallery">
    <header className="sticker-gallery-intro">
      <div><h1>Little stickers.<br /><span>Big personality.</span></h1><p>50 colorful originals for your next little corner of the internet. Pick one. Give it a peel. Make it yours.</p><a className="sticker-source-link" href="/api/stickers" download="orangeui-50-stickers.zip"><Download size={16} aria-hidden="true" /> Get all 50 SVGs <span>MIT licensed</span></a></div>
      <div className="sticker-fan" aria-hidden="true">{featured.map((name, i) => <Sticker key={name} name={name} size={122} rotate={[-17, 9, -5, 14, -10][i]} decorative />)}</div>
    </header>
    <div className="sticker-browse-bar"><div className="sticker-categories" role="group" aria-label="Sticker collections">{(["All", ...STICKER_CATEGORIES] as const).map(item => <button type="button" key={item} aria-pressed={item === category} onClick={() => setCategory(item)}>{item === "All" ? "All stickers" : item}<span>{item === "All" ? STICKERS.length : STICKERS.filter(sticker => sticker.category === item).length}</span></button>)}</div><div className="sticker-search"><Search size={16} aria-hidden="true" /><label className="sr-only" htmlFor="sticker-search">Search stickers</label><input id="sticker-search" type="search" placeholder="Find a little favorite..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear sticker search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button>}</div></div>
    <div className="sticker-gallery-layout"><section className="sticker-results" aria-label="Sticker catalogue"><p className="sticker-result-count" role="status">{filtered.length} {filtered.length === 1 ? "sticker" : "stickers"}{category !== "All" ? ` in ${category}` : " to make something with"}</p>
      {filtered.length ? <div className="sticker-grid">{filtered.map((sticker, i) => <button type="button" className="sticker-card" key={sticker.name} aria-label={`Preview ${sticker.title}`} aria-pressed={sticker.name === selected} onClick={event => select(sticker.name, event.currentTarget)}><Sticker name={sticker.name} size={112} hoverPeel={peel} rotate={[-4, 3, 0, -2][i % 4]} decorative /><span>{sticker.title}</span>{sticker.name === selected && <Check className="sticker-card-check" size={15} aria-hidden="true" />}</button>)}</div> : <div className="sticker-empty"><h2>No little matches.</h2><p>Try another name, color, or collection.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all 50 stickers</button></div>}
    </section><aside ref={inspector} className="sticker-inspector" data-preview-open={previewOpen} aria-label="Sticker preview and downloads"><div className="sticker-live-preview"><button type="button" className="sticker-peel-preview" aria-label={`Try the peel on ${current.title}`}><Sticker key={selected} name={selected} size={size} hoverPeel={peel} decorative /></button><span>{peel ? "Hover or focus to peel" : "A little flat favorite"}</span></div><div className="sticker-inspector-body"><button type="button" className="sticker-preview-close" onClick={closePreview}>Back to stickers</button><div className="sticker-selected-title"><h2>{current.title}</h2><p>{current.category}</p></div><label className="sticker-size-label" htmlFor="sticker-size">Size <output htmlFor="sticker-size">{size} px</output></label><input id="sticker-size" type="range" min="80" max="240" step="8" value={size} onChange={event => { setSize(Number(event.target.value)); setCopied(""); }} /><label className="sticker-peel-control"><input type="checkbox" checked={peel} onChange={event => { setPeel(event.target.checked); setCopied(""); }} />Hover peel</label>
      <div className="sticker-code-heading"><div role="group" aria-label="Code format">{(["React", "SVG"] as const).map(item => <button type="button" key={item} aria-pressed={format === item} onClick={() => { setFormat(item); setCopied(""); }}>{item}</button>)}</div><button type="button" aria-label="Copy sticker code" onClick={() => copy(code, "Sticker code")}>{copied === "Sticker code" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied === "Sticker code" ? "Copied" : "Copy"}</button></div><pre className="sticker-code" tabIndex={0} aria-label={`${format} sticker code`}><code>{code}</code></pre><div className="sticker-downloads"><button type="button" onClick={svgDownload}><Download size={15} aria-hidden="true" />SVG</button><button type="button" onClick={png} disabled={exporting}><Download size={15} aria-hidden="true" />{exporting ? "Exporting..." : "PNG"}</button></div><p className="sticker-action-status" role="status">{status}</p><Link className="sticker-api-link" href="/components/sticker-pack">Component API <ArrowUpRight size={15} aria-hidden="true" /></Link></div></aside></div>
    <section className="sticker-install" aria-labelledby="sticker-install-title"><div><h2 id="sticker-install-title">A little source goes a long way.</h2><p>Install the full pack once. Use a typed sticker name or a named component, like <code>OrbitSnailSticker</code>.</p></div><div><div className="sticker-install-command"><code>{install}</code><button type="button" aria-label="Copy sticker installation command" onClick={() => copy(install, "Installation command")}><Copy size={16} aria-hidden="true" /></button></div><p>Prefer a source download? <a href="/api/components/sticker-pack?style=polished" download="orangeui-sticker-pack.zip">Get the complete ZIP.</a> Keep its folders together and copy the public fonts when using the library styles.</p></div></section>
  </div>;
}
