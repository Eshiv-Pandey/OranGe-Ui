"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { componentUsage, components, type ComponentDefinition } from "../../lib/components";
import { APPEARANCES, APPEARANCE_VALUES } from "../ui/appearance";
import { Button } from "../ui/button";
import { ComponentDemo } from "./component-demo";
import { useLibrary } from "./library-shell";
import { WorkbenchInspectorProvider } from "../ui/workbench-inspector";

const subscribeOrigin = () => () => {};
const views = ["preview", "usage", "source"] as const;
type View = typeof views[number];

export function ComponentDetail({ component, source }: { component: ComponentDefinition; source: string }) {
  const { appearance: hostAppearance, href } = useLibrary();
  const appearance = component.collection ?? hostAppearance;
  const [view, setView] = useState<View>("preview");
  const [reset, setReset] = useState(0);
  const [copy, setCopy] = useState("");
  const [fallback, setFallback] = useState("");
  const [inspector, setInspector] = useState<HTMLDivElement | null>(null);
  const origin = useSyncExternalStore(subscribeOrigin, () => window.location.origin, () => "http://localhost:3000");
  const index = components.findIndex((entry) => entry.slug === component.slug);
  const previous = components[index - 1], next = components[index + 1];
  const usage = componentUsage(component, appearance);
  const code = view === "source" ? source : usage;
  const install = `npx shadcn@latest add "${origin}/r/${component.slug}.json?style=${appearance}"`;
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
        <div className="workspace-stage">
          <div role="tabpanel" id="example-panel" aria-labelledby={`tab-${view}`} tabIndex={0} className="workspace-view">
            <div hidden={view !== "preview"} className={`detail-demo demo-${component.slug}`} data-testid="live-demo"><div className="detail-demo-content" data-main-preview={component.customizerPreview ? undefined : ""}><ComponentDemo key={`${appearance}-${reset}`} slug={component.slug} appearance={appearance} /></div></div>
            {view !== "preview" && <pre className="code-block" tabIndex={0}><code>{code}</code></pre>}
          </div>
          <div className="workspace-stage-toolbar">
            <span className="workspace-component-name">{component.name}</span>
            <div role="tablist" aria-label="Example view">{views.map((tab) => <button type="button" key={tab} role="tab" id={`tab-${tab}`} aria-controls="example-panel" aria-selected={view === tab} tabIndex={view === tab ? 0 : -1} onClick={() => selectView(tab)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const position = event.key === "Home" ? 0 : event.key === "End" ? 2 : (views.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              selectView(views[position]); document.getElementById(`tab-${views[position]}`)?.focus();
            }}>{tab === "preview" ? "Preview" : tab === "usage" ? "Usage" : "Source"}</button>)}</div>
            <a href="#component-api" className="workspace-docs-link" aria-label="Read component documentation">Docs <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10m-4-4 4 4 4-4" /></svg></a>
          </div>
        </div>
        <aside className="workspace-inspector" aria-label="Preview settings">
          <header className="workspace-inspector-heading"><h2>Props</h2><button type="button" onClick={() => setReset(reset + 1)} aria-label="Reset demo"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6a5 5 0 1 1 0 4M3 2v4h4" /></svg>Reset</button><button type="button" onClick={() => copyText("code")} aria-label="Copy code"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M10 5V2H2v9h3" /></svg>Copy JSX</button></header>
          <div className="workspace-inspector-body">
            <div ref={setInspector} className="workspace-controls ui" data-appearance={appearance} />
            <div className="workspace-default-properties"><p>{component.description}</p><dl>{component.props.map((prop) => <div key={prop.name}><dt><code>{prop.name}</code><span>{prop.defaultValue}</span></dt><dd>{prop.description}</dd></div>)}</dl><p className="workspace-try-hint">Try the live preview to explore this component.</p></div>
          </div>
          <footer className="workspace-install"><div><h2>Install</h2><span>npm</span></div><button type="button" className="workspace-install-command" onClick={() => copyText("install")} aria-label="Copy install command"><code>{install}</code><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M10 5V2H2v9h3" /></svg></button><div className="workspace-install-links"><a href={`/api/components/${component.slug}?style=${appearance}`} download={`orangeui-${component.slug}.zip`}>Download source</a><button type="button" onClick={() => copyText("prompt")}>Copy prompt</button></div></footer>
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
