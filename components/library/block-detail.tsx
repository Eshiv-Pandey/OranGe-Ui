"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowUpRight, Copy, Download, MessageSquare, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { asComponent, blocks, blockCategoryHref, type BlockDefinition } from "../../lib/blocks";
import { blockAgentPrompt } from "../../lib/block-prompt";
import { componentUsage } from "../../lib/components";
import { Button } from "../ui/button";
import { Popover } from "../ui/popover";
import { BlockDemo } from "./block-demo";
import "../../styles/blocks-library.css";

const subscribe = () => () => {};
export function BlockDetail({ block }: { block: BlockDefinition }) {
  const [view, setView] = useState("preview"), [width, setWidth] = useState("Full"), [theme, setTheme] = useState<"light" | "dark">("light"), [reset, setReset] = useState(0);
  const [files, setFiles] = useState<Record<string, string>>(), [file, setFile] = useState(block.file), [error, setError] = useState(""), [retry, setRetry] = useState(0), [copy, setCopy] = useState(""), [fallback, setFallback] = useState("");
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "http://localhost:3000");
  const install = `npx shadcn@latest add "${origin}/r/block-${block.slug}.json"`;
  const usage = componentUsage(asComponent(block), "polished");
  useEffect(() => {
    if (view !== "source" || files || error) return;
    const controller = new AbortController();
    fetch(`/api/blocks/${block.slug}?format=source`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Source could not be loaded. Try again or download the ZIP.");
      const data = await response.json();
      if (!data?.files || typeof data.files !== "object" || Array.isArray(data.files) || !Object.keys(data.files).length || !Object.values(data.files).every(value => typeof value === "string")) throw new Error("The source response is incomplete. Try again or download the ZIP.");
      return data.files as Record<string, string>;
    }).then(source => { if (!controller.signal.aborted) { setFiles(source); if (!(file in source)) setFile(Object.keys(source).sort()[0]); } }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Source unavailable."); });
    return () => controller.abort();
  }, [view, files, error, file, block.slug, retry]);
  useEffect(() => { if (fallback) { fallbackRef.current?.focus(); fallbackRef.current?.select(); } }, [fallback]);
  async function copyText(text: string) { try { await navigator.clipboard.writeText(text); setCopy("Copied to clipboard."); setFallback(""); } catch { setCopy("Select and copy the text below."); setFallback(text); } }
  const siblings = blocks.filter(item => item.category === block.category);
  const next = siblings.length > 1 ? siblings[(siblings.findIndex(item => item.slug === block.slug) + 1) % siblings.length] : blocks[(blocks.findIndex(item => item.slug === block.slug) + 1) % blocks.length];
  return <div className="block-detail"><Link className="blocks-back" href={blockCategoryHref(block.category)}><ArrowLeft size={16} />{block.category} blocks</Link><header className="block-detail-heading"><div><h1>{block.title}</h1><p>{block.description}</p><span>{block.category} / Polished / Light + dark</span></div><Button asChild variant="secondary"><a href={`/api/blocks/${block.slug}`} download><Download size={17} />Download source</a></Button></header>
    <div className="block-workbench"><div className="block-workbench-toolbar">
      <div className="block-view-switch" role="group" aria-label="Block view">{["preview", "usage", "source"].map(item => <button type="button" key={item} aria-pressed={view === item} onClick={() => { setView(item); setCopy(""); setFallback(""); }}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
      <div className="block-preview-toolbar" hidden={view !== "preview"}>
        <div role="group" aria-label="Preview width">{[{label: "Full", icon: Monitor}, {label: "Tablet", icon: Tablet}, {label: "Phone", icon: Smartphone}].map(({label, icon: Icon}) => <button type="button" key={label} aria-label={label} title={`${label} width`} aria-pressed={width === label} onClick={() => setWidth(label)}><Icon size={16} aria-hidden="true" /></button>)}</div>
        <div className="block-preview-options"><select aria-label="Preview palette" value={theme} onChange={event => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select><button type="button" onClick={() => setReset(value => value + 1)} aria-label="Reset block preview" title="Reset preview"><RotateCcw size={16} aria-hidden="true" /></button></div>
      </div>
      <div className="block-compact-settings" hidden={view !== "preview"}><Popover title="Preview settings" align="end" trigger={<button type="button" aria-label="Block preview settings" className="block-settings-trigger"><Monitor size={16} aria-hidden="true" /></button>}>
        <div className="block-compact-width" role="group" aria-label="Compact preview width">{["Full", "Tablet", "Phone"].map(label => <button type="button" key={label} aria-pressed={width === label} onClick={() => setWidth(label)}>{label}</button>)}</div>
        <label className="block-compact-palette">Palette<select value={theme} onChange={event => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <button type="button" className="block-settings-trigger" onClick={() => setReset(value => value + 1)}><RotateCcw size={16} aria-hidden="true" />Reset preview</button>
      </Popover></div>
      <div className="block-workbench-actions"><button type="button" className="block-prompt-action" onClick={() => copyText(blockAgentPrompt(block, origin, theme))} aria-label={`Copy ${block.name} prompt for your agent`}><MessageSquare size={15} aria-hidden="true" />Prompt</button><a href={`/preview/blocks/${block.slug}`} target="_blank" rel="noreferrer" aria-label="Open full preview" title="Open full preview"><ArrowUpRight size={16} aria-hidden="true" /></a></div>
    </div>
      <div hidden={view !== "preview"}><div className="block-preview-stage"><div className="block-preview-canvas" data-theme={theme} style={{ maxWidth: width === "Phone" ? 390 : width === "Tablet" ? 768 : "100%" }}><BlockDemo key={reset} slug={block.slug} theme={theme} /></div></div></div>
      {view === "usage" && <div className="block-code-view"><div><span>Example.tsx</span><button type="button" onClick={() => copyText(usage)}><Copy size={15} />Copy example</button></div><pre><code>{usage}</code></pre><p>Replace the example callbacks with your application&apos;s services. Keep callback props inside a client component in Next.js.</p></div>}
      {view === "source" && <div className="block-source-view">{error ? <div className="blocks-empty"><p role="alert">{error}</p><Button variant="secondary" onClick={() => { setError(""); setRetry(value => value + 1); }}>Retry source</Button></div> : !files ? <p className="block-source-loading" role="status">Loading complete source...</p> : <><label>Source file<select value={file} onChange={event => setFile(event.target.value)}>{Object.keys(files).sort().map(name => <option key={name}>{name}</option>)}</select></label><div className="block-code-view"><div><span>{file}</span><button type="button" onClick={() => copyText(files[file] ?? "")}><Copy size={15} />Copy file</button></div><pre><code>{files[file]}</code></pre></div><p>Binary photographs and fonts are included in the ZIP. The registry embeds them for installation.</p></>}</div>}
    </div>
    <div className="block-install"><div><h2>Bring it into your project.</h2><p>Install the complete block and its dependencies in one command.</p></div><div><code>{install}</code><Button variant="secondary" onClick={() => copyText(install)}><Copy size={16} />Copy command</Button></div></div>
    <p role="status" className="block-copy-status">{copy}</p>{fallback && <textarea ref={fallbackRef} className="block-copy-fallback" readOnly aria-label="Text to copy manually" value={fallback} onFocus={event => event.currentTarget.select()} />}
    <section className="block-documentation"><h2>Made to be yours.</h2><div className="block-notes">{block.notes?.map(note => <p key={note}>{note}</p>)}</div><h3>Props</h3><p className="block-prop-hint">Scroll the table to read types and descriptions.</p><div className="block-prop-table" role="region" aria-label={`${block.name} props`} tabIndex={0}><table><thead><tr><th scope="col">Prop</th><th scope="col">Type / default</th><th scope="col">Purpose</th></tr></thead><tbody>{block.props.map(prop => <tr key={prop.name}><th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code><span>{prop.defaultValue}</span></td><td>{prop.description}</td></tr>)}</tbody></table></div><h3>Keyboard</h3><p>{block.keyboard}</p><h3>Source and licensing</h3><p>Registry and ZIP include local dependencies, styles, fonts and any sample photographs. Preserve the supplied notices. The samples use the Unsplash license; replace them with your own production assets.</p></section><Link className="block-next" href={`/blocks/${next.slug}`}><span>Explore the next block</span><strong>{next.title}<ArrowUpRight size={20} /></strong></Link>
  </div>;
}
