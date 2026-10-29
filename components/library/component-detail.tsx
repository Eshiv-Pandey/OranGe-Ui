"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { componentUsage, components, type ComponentDefinition } from "../../lib/components";
import { APPEARANCES, APPEARANCE_VALUES } from "../ui/appearance";
import { Button } from "../ui/button";
import { ComponentDemo } from "./component-demo";
import { useLibrary } from "./library-shell";

const subscribeOrigin = () => () => {};
const views = ["preview", "usage", "source"] as const;
type View = typeof views[number];

export function ComponentDetail({ component, source }: { component: ComponentDefinition; source: string }) {
  const { appearance, href } = useLibrary();
  const [view, setView] = useState<View>("preview");
  const [reset, setReset] = useState(0);
  const [copy, setCopy] = useState("");
  const [fallback, setFallback] = useState("");
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
    <div className="library-heading detail-heading"><h1>{component.name}<svg className="detail-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" /></svg></h1><p>{component.description}</p></div>
    <section className="detail-preview" aria-label={`${component.name} playground`}>
      <h2 className="sr-only">{component.name} example</h2>
      <div className="detail-toolbar">
        <div role="tablist" aria-label="Example view">{views.map((tab) => <button type="button" key={tab} role="tab" id={`tab-${tab}`} aria-controls="example-panel" aria-selected={view === tab} tabIndex={view === tab ? 0 : -1} onClick={() => selectView(tab)} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const position = event.key === "Home" ? 0 : event.key === "End" ? 2 : (views.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
          selectView(views[position]); document.getElementById(`tab-${views[position]}`)?.focus();
        }}>{tab === "preview" ? "Preview" : tab === "usage" ? "Usage" : "Source"}</button>)}</div>
        <div className="detail-actions"><button type="button" onClick={() => copyText("prompt")}>Copy prompt</button><button type="button" onClick={() => copyText("code")}>Copy code</button>{view === "preview" && <button type="button" className="detail-reset" onClick={() => setReset(reset + 1)}>Reset demo</button>}</div>
      </div>
      {fallback && <label className="detail-copy-fallback">Text to copy<textarea readOnly value={fallback} rows={6} onFocus={(event) => event.currentTarget.select()} /></label>}
      <div role="tabpanel" id="example-panel" aria-labelledby={`tab-${view}`} tabIndex={0}>{view === "preview" ? <div className={`detail-demo demo-${component.slug}`} data-testid="live-demo"><div className="detail-demo-content" data-main-preview={component.customizerPreview ? undefined : ""}><ComponentDemo key={`${appearance}-${reset}`} slug={component.slug} appearance={appearance} /></div></div> : <pre className="code-block" tabIndex={0}><code>{code}</code></pre>}</div>
      <div className="detail-caption"><span role="status">{copy || (view === "source" ? "Main source file. Download includes local dependencies, styles, and fonts." : view === "usage" ? "A ready-to-use example for the source bundle." : `${APPEARANCES.find((item) => item.value === appearance)!.label} appearance. Real component, real interactions.`)}</span><span>React + TypeScript</span></div>
    </section>
    <section className="detail-section">
      <div className="detail-section-title"><h2>Add to your project.</h2><Button asChild variant="secondary"><a href={`/api/components/${component.slug}?style=${appearance}`} download={`orangeui-${component.slug}.zip`}>Download source</a></Button></div>
      <p>Install the component, dependencies, styles and licensed fonts through the shadcn registry. Files are placed in an <code>orangeui/</code> folder so they stay together.</p>
      <pre className="install-command" tabIndex={0}><code>{install}</code></pre><Button variant="secondary" appearance={appearance} onClick={() => copyText("install")}>Copy install command</Button>
      <p>The ZIP is also available with an <code>Example.tsx</code> and editable source folders.</p>
      <Link className="text-link" href={href("/docs")}>Full installation and theming guide</Link>
    </section>
    <section className="detail-section"><h2>A few useful props.</h2><div className="props-scroll" role="region" aria-label={`${component.name} properties`} tabIndex={0}><table className="props-table"><thead><tr><th scope="col">Prop</th><th scope="col">Type / default</th><th scope="col">What it does</th></tr></thead><tbody>{[
      { name: "appearance", type: APPEARANCE_VALUES.map((value) => `"${value}"`).join(" | "), defaultValue: '"polished"', description: "Choose Polished, Pixelated, Neobrutalism, Retro OS, or Terminal styling." },
      { name: "className", type: "string", defaultValue: "Not set", description: "Extend the outer component styles." }, ...component.props,
    ].map((prop) => <tr key={prop.name}><th scope="row"><code>{prop.name}</code></th><td><code>{prop.type}</code><small>{prop.defaultValue}</small></td><td>{prop.description}</td></tr>)}</tbody></table></div></section>
    <section className="keyboard-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/></svg><div><h2>At home on a keyboard.</h2><p>{component.keyboard}</p></div></section>
    <nav className="component-pagination" aria-label="Adjacent components">{previous ? <Link href={href(`/components/${previous.slug}`)}><small>PREVIOUS</small>{previous.name}</Link> : <span />}{next ? <Link href={href(`/components/${next.slug}`)}><small>NEXT</small>{next.name}</Link> : <Link href={href("/components")}><small>BACK TO THE COLLECTION</small>All components</Link>}</nav>
  </>;
}
