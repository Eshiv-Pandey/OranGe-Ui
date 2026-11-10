"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowUpRight, Copy, Download, RotateCcw } from "lucide-react";
import { asComponent, blocks, type BlockDefinition } from "../../lib/blocks";
import { componentUsage } from "../../lib/components";
import { Button } from "../ui/button";
import { BlockDemo } from "./block-demo";
import "../../styles/blocks-library.css";

const subscribe = () => () => {};
export function BlockDetail({ block }: { block: BlockDefinition }) {
  const [view, setView] = useState("preview"), [width, setWidth] = useState("Full"), [theme, setTheme] = useState<"light" | "dark">("light"), [reset, setReset] = useState(0);
  const [files, setFiles] = useState<Record<string, string>>(), [file, setFile] = useState(block.file), [error, setError] = useState(""), [retry, setRetry] = useState(0), [copy, setCopy] = useState(""), [fallback, setFallback] = useState("");
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "http://localhost:3000");
  const install = `npx shadcn@latest add "${origin}/r/block-${block.slug}.json"`;
  const usage = componentUsage(asComponent(block), "polished");
  useEffect(() => {
    if (view !== "source" || files) return;
    const controller = new AbortController();
    fetch(`/api/blocks/${block.slug}?format=source`, { signal: controller.signal }).then(async response => { if (!response.ok) throw new Error("Source could not be loaded. Try again or download the ZIP."); return response.json() as Promise<{ files: Record<string, string> }>; }).then(data => { setFiles(data.files); setError(""); }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Source unavailable."); });
    return () => controller.abort();
  }, [view, files, block.slug, retry]);
  async function copyText(text: string) { try { await navigator.clipboard.writeText(text); setCopy("Copied to clipboard."); setFallback(""); } catch { setCopy("Select and copy the text below."); setFallback(text); } }
  const next = blocks[(blocks.findIndex(item => item.slug === block.slug) + 1) % blocks.length];
  return <div className="block-detail"><Link className="blocks-back" href="/blocks"><ArrowLeft size={16} />All blocks</Link><header className="block-detail-heading"><div><h1>{block.title}</h1><p>{block.description}</p><span>{block.category} / Polished / Light + dark</span></div><Button asChild variant="secondary"><a href={`/api/blocks/${block.slug}`} download><Download size={17} />Download source</a></Button></header>
    <div className="block-workbench"><div className="block-workbench-toolbar"><div className="block-view-switch" role="group" aria-label="Block view">{["preview", "usage", "source"].map(item => <button type="button" key={item} aria-pressed={view === item} onClick={() => { setView(item); setCopy(""); setFallback(""); }}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div><a href={`/preview/blocks/${block.slug}`} target="_blank" rel="noreferrer">Open full preview<ArrowUpRight size={15} /></a></div>
      <div hidden={view !== "preview"}><div className="block-preview-toolbar"><div role="group" aria-label="Preview width">{["Full", "Tablet", "Phone"].map(item => <button type="button" key={item} aria-pressed={width === item} onClick={() => setWidth(item)}>{item}</button>)}</div><div className="block-preview-options"><label>Palette<select aria-label="Preview palette" value={theme} onChange={event => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label><button type="button" onClick={() => setReset(value => value + 1)} aria-label="Reset block preview"><RotateCcw size={16} /></button></div></div><div className="block-preview-stage"><div className="block-preview-canvas" data-theme={theme} style={{ maxWidth: width === "Phone" ? 390 : width === "Tablet" ? 768 : "100%" }}><BlockDemo key={reset} slug={block.slug} /></div></div></div>
      {view === "usage" && <div className="block-code-view"><div><span>Example.tsx</span><button type="button" onClick={() => copyText(usage)}><Copy size={15} />Copy example</button></div><pre><code>{usage}</code></pre><p>Replace the example callbacks with your application&apos;s services. Keep callback props inside a client component in Next.js.</p></div>}
      {view === "source" && <div className="block-source-view">{error ? <div className="blocks-empty"><p role="alert">{error}</p><Button variant="secondary" onClick={() => { setError(""); setRetry(value => value + 1); }}>Retry source</Button></div> : !files ? <p className="block-source-loading" role="status">Loading complete source...</p> : <><label>Source file<select value={file} onChange={event => setFile(event.target.value)}>{Object.keys(files).sort().map(name => <option key={name}>{name}</option>)}</select></label><div className="block-code-view"><div><span>{file}</span><button type="button" onClick={() => copyText(files[file] ?? "")}><Copy size={15} />Copy file</button></div><pre><code>{files[file]}</code></pre></div><p>Binary photographs and fonts are included in the ZIP. The registry embeds them for installation.</p></>}</div>}
    </div>
    <div className="block-install"><div><h2>Bring it into your project.</h2><p>Install the complete block and its dependencies in one command.</p></div><div><code>{install}</code><Button variant="secondary" onClick={() => copyText(install)}><Copy size={16} />Copy command</Button></div></div>
    <p role="status" className="block-copy-status">{copy}</p>{fallback && <textarea className="block-copy-fallback" readOnly aria-label="Text to copy manually" value={fallback} onFocus={event => event.currentTarget.select()} />}
    <section className="block-documentation"><h2>Made to be yours.</h2><div className="block-notes">{block.notes?.map(note => <p key={note}>{note}</p>)}</div><h3>Props</h3><p className="block-prop-hint">Scroll the table to read types and descriptions.</p><div className="block-prop-table" role="region" aria-label={`${block.name} props`} tabIndex={0}><table><thead><tr><th scope="col">Prop</th><th scope="col">Type / default</th><th scope="col">Purpose</th></tr></thead><tbody>{block.props.map(prop => <tr key={prop.name}><th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code><span>{prop.defaultValue}</span></td><td>{prop.description}</td></tr>)}</tbody></table></div><h3>Keyboard</h3><p>{block.keyboard}</p><h3>Source and licensing</h3><p>Registry and ZIP include local dependencies, styles, fonts and any sample photographs. Preserve the supplied notices. The samples use the Unsplash license; replace them with your own production assets.</p></section><Link className="block-next" href={`/blocks/${next.slug}`}><span>Explore the next block</span><strong>{next.title}<ArrowUpRight size={20} /></strong></Link>
  </div>;
}
