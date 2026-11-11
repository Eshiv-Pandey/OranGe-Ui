"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowUpRight, Code2, Copy, Download, Eye, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { type BlockCategory, type BlockDefinition } from "../../lib/blocks";
import { BlockDemo } from "./block-demo";
import "../../styles/blocks-library.css";
import "../../styles/block-collection.css";

export type BlockCollectionProps = { category: BlockCategory; entries: BlockDefinition[] };

const subscribe = () => () => {};
const widths = [
  { value: "full", label: "Full", icon: Monitor, maxWidth: "100%" },
  { value: "tablet", label: "Tablet", icon: Tablet, maxWidth: 768 },
  { value: "phone", label: "Phone", icon: Smartphone, maxWidth: 390 },
] as const;
type PreviewWidth = typeof widths[number]["value"];
type SourceFiles = Record<string, string>;
type CopyFallback = { text: string; label: string };

function readSource(value: unknown): SourceFiles {
  if (!value || typeof value !== "object" || !("files" in value)) throw new Error("The source response is incomplete. Try again or download the ZIP.");
  const files = value.files;
  if (!files || typeof files !== "object" || Array.isArray(files) || !Object.keys(files).length || !Object.values(files).every(file => typeof file === "string")) {
    throw new Error("The source response is incomplete. Try again or download the ZIP.");
  }
  return files as SourceFiles;
}

function CollectionEntry({ block, origin }: { block: BlockDefinition; origin: string }) {
  const controlId = useId();
  const [view, setView] = useState<"preview" | "code">("preview");
  const [width, setWidth] = useState<PreviewWidth>("full");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [reset, setReset] = useState(0);
  const [files, setFiles] = useState<SourceFiles>();
  const [file, setFile] = useState(block.file);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const [fallback, setFallback] = useState<CopyFallback>();
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const install = `npx shadcn@latest add "${origin}/r/block-${block.slug}.json"`;
  const titleId = `${controlId}-title`;
  const previewId = `${controlId}-preview`;
  const codeId = `${controlId}-code`;
  const selectedFile = files && file in files ? file : Object.keys(files ?? {}).sort()[0] ?? "";

  useEffect(() => {
    if (view !== "code" || files || error) return;
    const controller = new AbortController();
    fetch(`/api/blocks/${block.slug}?format=source`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("The source could not be loaded. Try again or download the ZIP.");
        return readSource(await response.json());
      })
      .then(source => { if (!controller.signal.aborted) setFiles(source); })
      .catch(caught => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "The source could not be loaded. Try again or download the ZIP.");
      });
    return () => controller.abort();
  }, [view, files, error, block.slug, retry]);

  useEffect(() => {
    if (!fallback) return;
    fallbackRef.current?.focus();
    fallbackRef.current?.select();
  }, [fallback]);

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied.`);
      setFallback(undefined);
    } catch {
      setCopyStatus("Clipboard access is unavailable. Copy the selected text below.");
      setFallback({ text, label });
    }
  }

  function changeView(next: "preview" | "code") {
    setView(next);
    setCopyStatus("");
    setFallback(undefined);
  }

  return <section className="bc-entry" id={`block-${block.slug}`} aria-labelledby={titleId}>
    <header className="bc-entry-heading">
      <div>
        <h2 id={titleId}><a href={`#block-${block.slug}`}>{block.title}</a></h2>
      </div>
      <Link className="bc-documentation-link" href={`/blocks/${block.slug}`} aria-label={`${block.name} documentation and props`}>Documentation<ArrowUpRight size={15} aria-hidden="true" /></Link>
    </header>

    <div className="bc-workbench">
      <div className="bc-workbench-toolbar">
        <div className="bc-view-switch" role="group" aria-label={`${block.name} view`}>
          <button type="button" aria-pressed={view === "preview"} aria-controls={previewId} onClick={() => changeView("preview")} aria-label={`${block.name} preview`}><Eye size={15} aria-hidden="true" />Preview</button>
          <button type="button" aria-pressed={view === "code"} aria-controls={codeId} onClick={() => changeView("code")} aria-label={`${block.name} source code`}><Code2 size={15} aria-hidden="true" />Code</button>
        </div>
        <div className="bc-workbench-actions">
          <button className="bc-action bc-install-action" type="button" onClick={() => copyText(install, `${block.name} install command`)} aria-label={`Copy ${block.name} install command`}><Copy size={15} aria-hidden="true" />Copy install</button>
          <a className="bc-action" href={`/preview/blocks/${block.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${block.name} full preview in a new tab`}>Full preview<ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </div>

      <div className="bc-preview" id={previewId} hidden={view !== "preview"}>
        <div className="bc-preview-toolbar">
          <div className="bc-width-switch" role="group" aria-label={`${block.name} preview width`}>
            {widths.map(({ value, label, icon: Icon }) => <button type="button" key={value} aria-pressed={width === value} aria-label={`${block.name} ${label.toLowerCase()} width`} title={`${label} width`} onClick={() => setWidth(value)}><Icon size={15} aria-hidden="true" /><span>{label}</span></button>)}
          </div>
          <div className="bc-preview-options">
            <label htmlFor={`${controlId}-palette`}>Palette</label>
            <select id={`${controlId}-palette`} value={theme} aria-label={`${block.name} preview palette`} onChange={event => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select>
            <button className="bc-reset" type="button" onClick={() => setReset(value => value + 1)} aria-label={`Reset ${block.name} preview`} title="Reset preview"><RotateCcw size={15} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="bc-preview-stage">
          <div className="bc-preview-canvas" data-theme={theme} data-width={width} style={{ maxWidth: widths.find(item => item.value === width)?.maxWidth }} role="region" aria-label={`${block.name} live preview`}>
            <BlockDemo key={reset} slug={block.slug} theme={theme} />
          </div>
        </div>
      </div>

      <div className="bc-code" id={codeId} hidden={view !== "code"}>
        {view === "code" && (error ? <div className="bc-source-state">
          <p role="alert">{error}</p>
          <div><button className="bc-action" type="button" onClick={() => { setError(""); setRetry(value => value + 1); }} aria-label={`Retry ${block.name} source`}>Retry source</button><a className="bc-action" href={`/api/blocks/${block.slug}`} download aria-label={`Download ${block.name} source ZIP`}><Download size={15} aria-hidden="true" />Download ZIP</a></div>
        </div> : !files ? <div className="bc-source-state"><p role="status">Loading {block.name} source files...</p></div> : <>
          <div className="bc-source-toolbar">
            <div className="bc-file-picker"><label htmlFor={`${controlId}-source-file`}>Source file</label><select id={`${controlId}-source-file`} aria-label={`${block.name} source file`} value={selectedFile} onChange={event => setFile(event.target.value)}>{Object.keys(files).sort().map(name => <option key={name} value={name}>{name}</option>)}</select></div>
            <div className="bc-source-actions"><button className="bc-action" type="button" onClick={() => copyText(files[selectedFile], `${block.name} source file`)} aria-label={`Copy ${block.name} ${selectedFile}`}><Copy size={15} aria-hidden="true" />Copy file</button><a className="bc-action" href={`/api/blocks/${block.slug}`} download aria-label={`Download ${block.name} source ZIP`}><Download size={15} aria-hidden="true" />ZIP</a></div>
          </div>
          <pre className="bc-source-code" tabIndex={0} role="region" aria-label={`${block.name} ${selectedFile} source`}><code>{files[selectedFile]}</code></pre>
          <p className="bc-source-note">This is the complete source file. The ZIP also includes binary assets and their notices.</p>
        </>)}
      </div>

      <div className="bc-entry-footer"><span>{block.name}</span><code title={install}>{install}</code></div>
    </div>

    <div className="bc-copy-feedback" aria-live="polite" aria-atomic="true"><p>{copyStatus}</p></div>
    {fallback && <div className="bc-copy-fallback"><label htmlFor={`${controlId}-copy-fallback`}>{fallback.label}</label><p id={`${controlId}-copy-hint`}>Use your keyboard or context menu to copy the selected text.</p><textarea ref={fallbackRef} id={`${controlId}-copy-fallback`} readOnly value={fallback.text} aria-describedby={`${controlId}-copy-hint`} onFocus={event => event.currentTarget.select()} /></div>}
  </section>;
}

export function BlockCollection({ category, entries }: BlockCollectionProps) {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "http://localhost:3000");
  return <div className="block-collection">
    <Link className="bc-back" href="/blocks"><ArrowLeft size={16} aria-hidden="true" />All blocks</Link>
    <header className="bc-collection-heading">
      <h1>{category}</h1>
      <span className="bc-collection-count">{entries.length} {entries.length === 1 ? "example" : "examples"}</span>
    </header>
    <div className="bc-collection-entries">{entries.length ? entries.map(block => <CollectionEntry key={block.slug} block={block} origin={origin} />) : <p className="bc-empty" role="status">There are no blocks in this category yet. <Link href="/blocks">Browse all blocks.</Link></p>}</div>
  </div>;
}
