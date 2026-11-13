"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import { componentUsage, components, type ComponentDefinition } from "../../lib/components";
import { APPEARANCES, APPEARANCE_VALUES } from "../ui/appearance";
import { Button } from "../ui/button";
import { ComponentDemo } from "./component-demo";
import { useLibrary } from "./library-shell";
import { WorkbenchInspectorProvider } from "../ui/workbench-inspector";
import { EditorRange } from "../ui/editor-controls";

const subscribeOrigin = () => () => {};
const views = ["preview", "usage", "source"] as const;
type View = typeof views[number];

function ViewIcon({ view }: { view: View | "docs" }) {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{view === "preview" ? <><path d="M1.5 10s3-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3 5.5-8.5 5.5S1.5 10 1.5 10Z"/><circle cx="10" cy="10" r="2.4"/></> : view === "usage" ? <><path d="m6.5 5-5 5 5 5m7-10 5 5-5 5m-2-12-3 14"/></> : view === "source" ? <><path d="M6 2.5h6l4 4v11H4v-15h2Zm6 0v4h4M7 10h6M7 13h6"/></> : <><path d="M10 4c-3-2-6-2-8-1v13c2-1 5-1 8 1 3-2 6-2 8-1V3c-2-1-5-1-8 1Zm0 0v13"/></>}</svg>;
}

export function ComponentDetail({ component, source }: { component: ComponentDefinition; source: string }) {
  const { appearance: hostAppearance, href } = useLibrary();
  const appearance = component.collection ?? hostAppearance;
  const [view, setView] = useState<View>("preview");
  const [reset, setReset] = useState(0);
  const [copy, setCopy] = useState("");
  const [fallback, setFallback] = useState("");
  const [inspector, setInspector] = useState<HTMLDivElement | null>(null);
  const [inspectorView, setInspectorView] = useState<"edit" | "api">("edit");
  const [surface, setSurface] = useState<"auto" | "light" | "dark">("auto");
  const [scale, setScale] = useState(100);
  const resetEntryScroll = useRef(true);
  // Shader appearances update live. Remounting here recompiles the GPU programs
  // and discards edits when the URL's appearance finishes loading.
  const previewKey = ["shader-canvas", "flowing-water", "flowing-grass", "drifting-clouds"].includes(component.slug) ? reset : `${appearance}-${reset}`;
  const origin = useSyncExternalStore(subscribeOrigin, () => window.location.origin, () => "http://localhost:3000");
  const index = components.findIndex((entry) => entry.slug === component.slug);
  const previous = components[index - 1], next = components[index + 1];
  const usage = componentUsage(component, appearance);
  const code = view === "source" ? source : usage;
  const install = `npx shadcn@latest add "${origin}/r/${component.slug}.json?style=${appearance}"`;
  useLayoutEffect(() => {
    // Next can retain document scroll when the shared layout is already visible.
    // Every component entry starts at its canvas; deliberate in-page Docs links still work.
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const enter = () => { resetEntryScroll.current = true; toTop(); setView("preview"); setInspectorView("edit"); };
    const restore = () => { if (!window.location.hash) enter(); };
    // An explicit anchor can be followed before hydration. Preserve that intent.
    if (!window.location.hash) toTop();
    const frame = requestAnimationFrame(() => { if (resetEntryScroll.current && !window.location.hash) toTop(); });
    window.addEventListener("pageshow", enter);
    window.addEventListener("popstate", restore);
    window.addEventListener("orangeui:open-playground", enter);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pageshow", enter);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("orangeui:open-playground", enter);
      history.scrollRestoration = previousRestoration;
    };
  }, [component.slug]);
  function readDocumentation(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    resetEntryScroll.current = false;
    if (window.location.hash === "#component-api") history.replaceState(history.state, "", window.location.pathname + window.location.search);
    document.getElementById("component-api")?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  async function copyText(kind: "code" | "prompt" | "install") {
    const text = kind === "install" ? install : kind === "code" ? code : `Use the oRangeUi ${component.name} component in my React 19 and TypeScript project.\n\n${component.description}\n\nInstall it with:\n${install}\n\nUse appearance="${appearance}" and support light and dark palettes. Keep the component's keyboard behavior: ${component.keyboard}\n\nStart with this example and connect its callbacks to my application:\n\n${usage}\n\nRead ${origin}/components/${component.slug}?style=${appearance} for prop documentation.`;
    try { await navigator.clipboard.writeText(text); setCopy(kind === "prompt" ? "Prompt copied to clipboard." : kind === "install" ? "Install command copied." : "Copied to clipboard."); setFallback(""); }
    catch { setFallback(text); setCopy("Copy unavailable. Select and copy the text below."); }
  }
  function selectView(nextView: View) { setView(nextView); setCopy(""); setFallback(""); }
  return <>
    <div className="detail-heading sr-only"><h1>{component.name}</h1><p>{component.description}</p></div>
    <WorkbenchInspectorProvider value={inspector}>
      <section className="component-workspace" aria-label={`${component.name} playground`}>
        <div className="workspace-stage" data-preview-surface={surface} style={{ "--preview-scale": scale / 100 } as CSSProperties}>
          <div role="tabpanel" id="example-panel" aria-labelledby={`tab-${view}`} tabIndex={0} className="workspace-view">
            <div hidden={view !== "preview"} className={`detail-demo demo-${component.slug}`} data-testid="live-demo"><h2 className="sr-only">Live preview</h2><div className="detail-demo-content" data-main-preview={component.customizerPreview ? undefined : ""}><ComponentDemo key={previewKey} slug={component.slug} appearance={appearance} /></div></div>
            {view !== "preview" && <pre className="code-block" tabIndex={0}><code>{code}</code></pre>}
          </div>
          <div className="workspace-stage-toolbar" aria-label="Playground views">
            <div role="tablist" aria-label="Example view">{views.map((tab) => <button type="button" key={tab} role="tab" id={`tab-${tab}`} aria-controls="example-panel" aria-selected={view === tab} tabIndex={view === tab ? 0 : -1} onClick={() => selectView(tab)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const position = event.key === "Home" ? 0 : event.key === "End" ? 2 : (views.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              selectView(views[position]); document.getElementById(`tab-${views[position]}`)?.focus();
            }}><ViewIcon view={tab} /><span>{tab === "preview" ? "Preview" : tab === "usage" ? "Usage" : "Source"}</span></button>)}</div>
            <a href="#component-api" onClick={readDocumentation} className="workspace-docs-link" aria-label="Read component documentation" title="Documentation"><ViewIcon view="docs" /></a>
          </div>
        </div>
        <aside className="workspace-inspector" aria-label="Preview settings">
          <header className="workspace-inspector-heading"><div><h2>{component.name}</h2><p>Make it your own.</p></div><button type="button" onClick={() => { setReset(reset + 1); setSurface("auto"); setScale(100); }} aria-label="Reset demo" title="Reset demo"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6a5 5 0 1 1 0 4M3 2v4h4" /></svg></button><button type="button" onClick={() => copyText("code")} aria-label="Copy code" title="Copy example JSX"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M10 5V2H2v9h3" /></svg></button></header>
          <div className="workspace-inspector-switch" role="group" aria-label="Inspector view"><button type="button" aria-pressed={inspectorView === "edit"} onClick={() => setInspectorView("edit")}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 3v5m0 4v5M10 3v9m0 4v1m6-14v1m0 4v9M1 8h6m0 4h6m0-8h6"/></svg>Customize</button><button type="button" aria-pressed={inspectorView === "api"} onClick={() => setInspectorView("api")}><ViewIcon view="docs" />API reference</button></div>
          <div className="workspace-inspector-body">
            <div className="workspace-editor" hidden={inspectorView !== "edit"}>
              <div ref={setInspector} className="workspace-controls ui" data-appearance={appearance} />
              <details className="workspace-stage-settings"><summary>Canvas settings<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><div><div className="workspace-surface-picker"><span>Background</span><div role="group" aria-label="Preview background">{(["auto", "light", "dark"] as const).map((tone) => <button type="button" key={tone} data-tone={tone} aria-pressed={surface === tone} onClick={() => setSurface(tone)}><i aria-hidden="true" />{tone[0].toUpperCase() + tone.slice(1)}</button>)}</div></div>{!component.customizerPreview && <EditorRange label="Preview size" value={scale} min={50} max={150} step={5} onChange={setScale} formatValue={(value) => `${value}%`} />}</div></details>
              <div className="workspace-demo-instructions"><p>{component.description}</p><p>Try it on the canvas. Open API reference for the props you can use in your project.</p><a href="#component-api" onClick={readDocumentation}>Read the component guide</a></div>
            </div>
            <div className="workspace-default-properties" hidden={inspectorView !== "api"}><p>{component.description}</p><dl>{component.props.map((prop) => <div key={prop.name}><dt><code>{prop.name}</code><span>{prop.defaultValue}</span></dt><dd>{prop.description}</dd></div>)}</dl><a href="#component-api" onClick={readDocumentation} className="workspace-try-hint">Full props and installation guide</a></div>
          </div>
          <footer className="workspace-install"><div><h2>Install</h2><span>npm</span></div><button type="button" className="workspace-install-command" onClick={() => copyText("install")} aria-label={`Copy install command: ${install}`}><code>{install}</code><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M10 5V2H2v9h3" /></svg></button><div className="workspace-install-links"><a href={`/api/components/${component.slug}?style=${appearance}`} download={`orangeui-${component.slug}.zip`}>Download source</a><button type="button" onClick={() => copyText("prompt")}>Copy prompt</button></div></footer>
        </aside>
      </section>
    </WorkbenchInspectorProvider>
    <p className="workspace-feedback" role="status">{copy}</p>
    {fallback && <label className="detail-copy-fallback">Text to copy<textarea readOnly value={fallback} rows={6} onFocus={(event) => event.currentTarget.select()} /></label>}
    <div id="component-api" className="workspace-documentation-intro"><h2>{component.name}</h2><p>{component.description}</p></div>
    <section className="detail-section">
      <div className="detail-section-title"><h2>Add to your project.</h2><Button asChild variant="secondary"><a href={`/api/components/${component.slug}?style=${appearance}`} download={`orangeui-${component.slug}.zip`}>Download source</a></Button></div>
      <p>Install the component, dependencies, styles and licensed fonts through the shadcn registry. Files are placed in an <code>orangeui/</code> folder so they stay together.</p>
      <pre className="install-command" tabIndex={0}><code>{install}</code></pre><Button variant="secondary" appearance={appearance} onClick={() => copyText("install")}>Copy install command</Button>
      <p>The ZIP is also available with an <code>Example.tsx</code> and editable source folders.</p>
      <Link className="text-link" href={href("/docs")}>Full installation and theming guide</Link>
    </section>
    <section className="detail-section"><h2>A few useful props.</h2><p className="props-scroll-hint">Scroll horizontally to view all columns.</p><div className="props-scroll" role="region" aria-label={`${component.name} properties`} tabIndex={0}><table className="props-table"><thead><tr><th scope="col">Prop</th><th scope="col">Type / default</th><th scope="col">What it does</th></tr></thead><tbody>{[
      { name: "appearance", type: APPEARANCE_VALUES.map((value) => `"${value}"`).join(" | "), defaultValue: '"' + (component.collection ?? "polished") + '"', description: component.collection ? "Host appearance metadata; this component retains the material of its " + APPEARANCES.find((item) => item.value === component.collection)!.label + " collection." : "Choose Polished, Pixelated, Neobrutalism, Retro OS, or Terminal styling." },
      { name: "className", type: "string", defaultValue: "Not set", description: "Extend the outer component styles." }, ...component.props,
    ].map((prop) => <tr key={prop.name}><th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code><small>{prop.defaultValue}</small></td><td>{prop.description}</td></tr>)}</tbody></table></div></section>
    {!!component.notes?.length && <section className="component-notes"><h2>Using this component.</h2>{component.notes.map((note) => <p key={note}>{note}</p>)}</section>}
    <section className="keyboard-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/></svg><div><h2>At home on a keyboard.</h2><p>{component.keyboard}</p></div></section>
    <nav className="component-pagination" aria-label="Adjacent components">{previous ? <Link href={href(`/components/${previous.slug}`)}><small>PREVIOUS</small>{previous.name}</Link> : <span />}{next ? <Link href={href(`/components/${next.slug}`)}><small>NEXT</small>{next.name}</Link> : <Link href={href("/components")}><small>BACK TO THE COLLECTION</small>All components</Link>}</nav>
  </>;
}
