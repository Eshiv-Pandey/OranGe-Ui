"use client";
import Link from "next/link";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { StatCard, type StatCardProps } from "../ui/stat-card";
import { Icon } from "./icon";

const cards = [
  { accent: "lime", title: "Button", subtitle: "Small click. Solid impression.", stats: [{ label: "Variants", value: "03" }, { label: "Appearances", value: "02" }], footer: "Ready for action", art: "button", href: "/components/button" },
  { accent: "mint", title: "Input", subtitle: "A little room for your next idea.", stats: [{ label: "Appearances", value: "02" }, { label: "Native input", value: "100%" }], footer: "Every detail counts", art: "input", href: "/components/input" },
  { accent: "amber", title: "StatCard", subtitle: "Good numbers. Great company.", stats: [{ label: "Accents", value: "05" }, { label: "Stats per card", value: "02" }], footer: "Made to stand out", art: "card", href: "/components/stat-card?style=pixel" },
  { accent: "sky", title: "Dialog", subtitle: "A little space for the important things.", stats: [{ label: "Appearances", value: "02" }, { label: "Palettes", value: "02" }], footer: "Room to focus", art: "grid", href: "/components/dialog" },
  { accent: "coral", title: "GamerBoy", subtitle: "Take a break. Find your next star.", stats: [{ label: "Stars to find", value: "04" }, { label: "Appearances", value: "02" }], footer: "Press play", art: "heart", href: "/components/gamer-boy" },
] satisfies (Omit<StatCardProps, "counter" | "art"> & { art: string })[];

function CardArt({ kind }: { kind: string }) {
  return <svg width="112" height="112" viewBox="0 0 32 32" aria-hidden="true" shapeRendering="crispEdges">
    <path fill="#242b20" d="M7 5h20v2h2v22H7v-2H5V7h2z" />
    <path fill="#fffaf0" d="M5 3h20v2h2v20h-2v2H5v-2H3V5h2z" />
    <path fill="#242b20" d="M5 3h20v2H5zM3 5h2v20H3zM5 25h20v2H5zM25 5h2v20h-2z" />
    {kind === "button" && <><path fill="var(--primary)" d="M8 11h14v7H8z" /><path fill="#242b20" d="M8 18h16v2H8zM22 11h2v7h-2zM14 13h4v2h2v2h-6z" /></>}
    {kind === "input" && <><path fill="#242b20" d="M7 10h16v11H7z" /><path fill="#d1ed89" d="M9 12h12v7H9z" /><path fill="#242b20" d="M11 13h2v5h-2zM15 16h4v2h-4z" /></>}
    {kind === "card" && <><path fill="var(--primary)" d="M9 8h12v14H9z" /><path fill="#242b20" d="M9 8h12v2H9zM9 10h2v12H9zM11 20h10v2H11zM19 10h2v10h-2zM12 12h6v3h-6zM12 17h2v2h-2zM16 17h2v2h-2z" /></>}
    {kind === "grid" && <><path fill="#a9d4ef" d="M8 8h6v6H8zM16 8h6v6h-6zM8 16h6v6H8zM16 16h6v6h-6z" /><path fill="#242b20" d="M8 14h6v2H8zM16 14h6v2h-6zM8 22h6v2H8zM16 22h6v2h-6z" /></>}
    {kind === "heart" && <path fill="var(--primary)" d="M9 10h4v2h4v-2h4v2h2v5h-2v2h-2v2h-2v2h-4v-2h-2v-2H9v-2H7v-5h2z" />}
    <path fill="#fffaf0" d="M0 4h2v2h2v2H2v2H0zM28 21h2v2h2v2h-2v2h-2v-2h-2v-2h2z" />
  </svg>;
}

function subscribeHash(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}
function selectComponent(name: string) {
  history.replaceState(null, "", `#${name}-preview`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function InteractivePreview() {
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const selected = hash === "#input-preview" ? "input" : hash === "#statcard-preview" ? "statcard" : "button";
  const [code, setCode] = useState(false);
  const [variant, setVariant] = useState<"primary" | "secondary" | "ghost">("primary");
  const [accent, setAccent] = useState<"lime" | "mint" | "amber" | "sky" | "coral">("lime");
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validated, setValidated] = useState(false);
  const error = validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email address." : undefined;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setValidated(true); setSubmitted(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }
  const snippet = selected === "button" ? `import { Button } from "./components/ui/button";\n\n<Button variant="${variant}">\n  Save a little joy\n</Button>` : selected === "input" ? 'import { Input } from "./components/ui/input";\n\n<Input\n  label="Your email"\n  type="email"\n  placeholder="you@example.com"\n  description="A little room for your next idea."\n/>' : `import { StatCard } from "./components/ui/stat-card";\n\n<StatCard\n  accent="${accent}"\n  counter="01 / 01"\n  art={<span>✦</span>}\n  title="Small wins"\n  subtitle="Every little detail adds up."\n  stats={[\n    { label: "Ideas", value: "24" },\n    { label: "Made real", value: "08" },\n  ]}\n  footer="A good day to build"\n/>`;

  return <section id="playground" className="playground" aria-labelledby="playground-title">
    <div className="section-heading"><div><p className="eyebrow">THE PLAYGROUND</p><h2 id="playground-title">Make yourself at home.</h2></div><p className="section-note">Real components.<br />Room to experiment.</p></div>
    <div className="playground-shell">
      <div className="playground-toolbar">
        <div className="component-picker" role="group" aria-label="Choose a component">{(["button", "input", "statcard"] as const).map((name) => <button key={name} id={`${name}-preview`} type="button" aria-pressed={selected === name} onClick={() => { selectComponent(name); setCode(false); }}>{name === "statcard" ? "StatCard" : name === "button" ? "Button" : "Input"}</button>)}</div>
        <div className="view-picker" role="group" aria-label="Playground view"><button type="button" aria-pressed={!code} onClick={() => setCode(false)}>Preview</button><button type="button" aria-pressed={code} onClick={() => setCode(true)}><Icon name="code" />Code</button></div>
      </div>
      <div className="playground-content">
        <aside className="playground-settings">
          <p className="eyebrow">{selected === "button" ? "SMALL CLICK. SOLID IMPRESSION." : selected === "input" ? "A SPACE FOR YOUR NEXT IDEA." : "GOOD NUMBERS. GREAT COMPANY."}</p>
          <h3>{selected === "button" ? "A satisfying little click." : selected === "input" ? "Every detail, considered." : "Give your numbers character."}</h3>
          <p>{selected === "button" ? "Soft edges. A subtle lift. All the states an everyday action needs." : selected === "input" ? "Clear labels and useful feedback, with all the native behaviour you expect." : "Five colours, two stats, and a little pixel soul. Make it your own."}</p>
          {selected === "button" && <label className="setting-label">Variant<select aria-label="Button variant" value={variant} onChange={(event) => setVariant(event.target.value as typeof variant)}><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="ghost">Ghost</option></select></label>}
          {selected === "statcard" && <label className="setting-label">Accent<select aria-label="Card accent" value={accent} onChange={(event) => setAccent(event.target.value as typeof accent)}>{["lime", "mint", "amber", "sky", "coral"].map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
          <span className="playground-footnote"><Icon name="check" />Keyboard and screen reader ready</span>
        </aside>
        <div className={`preview-stage${code ? " preview-stage--code" : ""}`}>
          {code ? <pre tabIndex={0} aria-label={`${selected} code example`}><code>{snippet}</code></pre> : <>
            {selected === "button" && <div className="button-demo"><Button variant={variant} onClick={() => setSaved(!saved)} aria-pressed={saved}><Icon name={saved ? "check" : "heart"} />{saved ? "Saved!" : "Save a little joy"}</Button><div className="demo-secondary"><Button variant="ghost" onClick={() => setSaved(false)}>Reset</Button><Button variant="ghost" disabled>Unavailable</Button></div><p role="status" className="preview-feedback">{saved ? "A small action, beautifully handled." : "Press, focus, and hover. Every state feels right."}</p></div>}
            {selected === "input" && <form className="input-demo" onSubmit={submit} noValidate><Input label="Your email" type="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setSubmitted(false); }} error={error} description="A local demo. Nothing is sent or stored." required /><Button variant="secondary" type="submit">Try validation<Icon name="arrow" /></Button><p role="status" className="preview-feedback">{submitted ? "Looks good. You are ready to go!" : "Clear labels. Helpful errors. Native behavior."}</p></form>}
            {selected === "statcard" && <div className="card-demo"><StatCard appearance="pixel" accent={accent} counter="01 / 01" art={<span className="sample-star">✦</span>} title="Small wins" subtitle="Every little detail adds up." stats={[{ label: "Ideas", value: "24" }, { label: "Made real", value: "08" }]} footer="A good day to build" /></div>}
          </>}
        </div>
      </div>
    </div>
    <div className="foundation-strip" id="foundations-preview"><span><Icon name="sparkle" /><strong>One thoughtful foundation.</strong></span><span>An 8px spacing grid. Softer controls. Two palettes.</span><a href="#components">Meet the collection<Icon name="arrow" /></a></div>
  </section>;
}

export function ComponentShowcase() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = cards.filter((card) => `${card.title} ${card.subtitle} ${card.footer}`.toLowerCase().includes(normalized));
  return <div className="page-width catalog-width">
    <section id="components" aria-labelledby="components-title" className="catalog">
      <div className="section-heading"><div><p className="eyebrow">SMALL COLLECTION. BIG PERSONALITY.</p><h2 id="components-title" tabIndex={-1}>Your next good idea<br />starts here.</h2></div>
        <form className="catalog-search" role="search" onSubmit={(event) => { event.preventDefault(); document.getElementById("components-title")?.focus({ preventScroll: true }); }}>
          <Input label="Search components" hideLabel type="search" placeholder="Find your building block..." value={query} onChange={(event) => setQuery(event.target.value)} icon={<Icon name="search" />} />
          <Button type="submit" variant="ghost" aria-label="Find components"><Icon name="arrow" /></Button>
        </form>
      </div>
      <p className="catalog-intro">Five favourites from a collection of 32. Each has a polished and pixelated side.</p>
      {normalized && <div className="search-results"><p role="status">{filtered.length} {filtered.length === 1 ? "result" : "results"} for &quot;{query.trim()}&quot;</p><Button variant="ghost" onClick={() => setQuery("")}>Clear search<Icon name="close" /></Button></div>}
      <div className="stat-card-grid">{filtered.map((card) => <StatCard appearance="pixel" key={card.title} {...card} art={<CardArt kind={card.art} />} counter={`0${cards.indexOf(card) + 1} / 05`} />)}</div>
      {!filtered.length && <p className="empty-search">No matches yet. Try Button, Input, or StatCard.</p>}
      <div className="collection-notes"><span><Icon name="check" />Polished by default</span><span><Icon name="heart" />A pixelated side</span><span><Icon name="code" />Source included</span><Link href="/components">Explore all 32 components →</Link></div>
    </section>
    <InteractivePreview />
  </div>;
}
