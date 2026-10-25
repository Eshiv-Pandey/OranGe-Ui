"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { StatCard, type StatCardProps } from "../ui/stat-card";
import { PixelIcon } from "./pixel-icon";

const cards = [
  { accent: "lime", title: "Button", subtitle: "Small click. Solid impression.", stats: [{ label: "Variants", value: "03" }, { label: "States", value: "06" }], footer: "Ready for action", art: "button", href: "#button-preview" },
  { accent: "mint", title: "Input", subtitle: "A little room for your next idea.", stats: [{ label: "Styles", value: "03" }, { label: "Native input", value: "100%" }], footer: "Every detail counts", art: "input", href: "#input-preview" },
  { accent: "amber", title: "StatCard", subtitle: "Good numbers. Great company.", stats: [{ label: "Accents", value: "05" }, { label: "Stats per card", value: "02" }], footer: "Made to stand out", art: "card", href: "#statcard-preview" },
  { accent: "sky", title: "Foundations", subtitle: "One shared pixel language.", stats: [{ label: "Grid", value: "8px" }, { label: "Palettes", value: "02" }], footer: "Light and dark", art: "grid", href: "#foundations-preview" },
  { accent: "coral", title: "Playground", subtitle: "Try a little. Make it yours.", stats: [{ label: "Components", value: "03" }, { label: "License", value: "MIT" }], footer: "Open to everyone", art: "heart", href: "#playground" },
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

function InteractivePreview() {
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validated, setValidated] = useState(false);
  const error = validated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email address." : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidated(true);
    setSubmitted(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  return <section id="playground" className="playground" aria-labelledby="playground-title">
    <div className="section-heading"><div><p className="eyebrow">NO INSTALL REQUIRED</p><h2 id="playground-title" className="pixel-type">Give it a little click.</h2></div><span className="section-note">Real components. Right here.</span></div>
    <div className="preview-grid">
      <article id="button-preview" className="preview-panel">
        <div className="preview-label"><span>01 / BUTTON</span><PixelIcon name="arrow" /></div>
        <div className="preview-controls"><Button onClick={() => setSaved(!saved)} aria-pressed={saved}><PixelIcon name={saved ? "check" : "heart"} />{saved ? "Saved!" : "Save a little joy"}</Button><Button variant="secondary" onClick={() => setSaved(false)}>Reset</Button><Button variant="ghost" disabled>Unavailable</Button></div>
        <p role="status" className="preview-feedback">{saved ? "A small action, beautifully handled." : "Press, focus, and hover. Every state feels right."}</p>
        <code>{'<Button variant="primary">Save a little joy</Button>'}</code>
      </article>
      <article id="input-preview" className="preview-panel">
        <div className="preview-label"><span>02 / INPUT</span><PixelIcon name="arrow" /></div>
        <form onSubmit={submit} noValidate><Input label="Your email" type="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setSubmitted(false); }} error={error} description="A local demo. Nothing is sent or stored." icon={<PixelIcon name="sparkle" />} required /><Button variant="secondary" type="submit">Try validation<PixelIcon name="arrow" /></Button></form>
        <p role="status" className="preview-feedback">{submitted ? "Looks good. You are ready to go!" : "Clear labels. Helpful errors. Native behavior."}</p>
        <code>{'<Input label="Your email" type="email" />'}</code>
      </article>
    </div>
    <div className="foundation-strip" id="foundations-preview"><div><PixelIcon name="sparkle" /><span><strong>One pixel language.</strong> An 8px grid, hard shadows, and two thoughtful palettes.</span></div><a href="#statcard-preview">See the cards<PixelIcon name="arrow" /></a></div>
  </section>;
}

export function ComponentShowcase() {
  const [query, setQuery] = useState("");
  const catalogRef = useRef<HTMLElement>(null);
  const normalized = query.trim().toLowerCase();
  const filtered = cards.filter((card) => `${card.title} ${card.subtitle} ${card.footer}`.toLowerCase().includes(normalized));

  return <>
    <form className="hero-search" role="search" onSubmit={(event) => { event.preventDefault(); catalogRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); document.getElementById("components-title")?.focus({ preventScroll: true }); }}>
      <Input label="Search components" hideLabel type="search" placeholder="Search components..." value={query} onChange={(event) => setQuery(event.target.value)} icon={<PixelIcon name="sparkle" />} />
      <Button type="submit" aria-label="Find components"><PixelIcon name="arrow" /></Button>
    </form>
    <p className="search-hint">A few good pixels. A whole lot of possibility.</p>
    <section className="feature-field" id="features" aria-labelledby="features-title">
      <div className="page-width"><p className="eyebrow">SMALL LIBRARY. BIG ON THE DETAILS.</p><h2 id="features-title" className="pixel-type">Built for real work.</h2>
        <div className="feature-grid">
          <article className="feature-card"><span className="feature-icon"><PixelIcon name="sparkle" /></span><div><h3>Polished by default</h3><p>Every state designed, down to the last pixel.</p></div></article>
          <article className="feature-card"><span className="feature-icon feature-icon--mint"><PixelIcon name="check" /></span><div><h3>Accessible always</h3><p>Keyboard, focus, and screen readers built in.</p></div></article>
          <article className="feature-card"><span className="feature-icon feature-icon--lime"><PixelIcon name="code" /></span><div><h3>Readable by AI</h3><p>Metadata that coding tools can actually use.</p></div></article>
        </div>
      </div>
    </section>
    <div className="page-width catalog-width">
      <section ref={catalogRef} id="components" aria-labelledby="components-title" className="catalog">
        <div className="section-heading"><div><p className="eyebrow">THE GOOD STUFF</p><h2 id="components-title" className="pixel-type" tabIndex={-1}>Meet your new building blocks.</h2></div><span className="section-note"><span className="status-dot" />Source you can make your own</span></div>
        <p className="catalog-intro">Start with the essentials. Keep the character.</p>
        {normalized && <div className="search-results"><p role="status">{filtered.length} {filtered.length === 1 ? "result" : "results"} for &quot;{query.trim()}&quot;</p><Button variant="ghost" onClick={() => setQuery("")}>Clear search<PixelIcon name="close" /></Button></div>}
        <div className="stat-card-grid" id="statcard-preview">{filtered.map((card) => <StatCard key={card.title} {...card} art={<CardArt kind={card.art} />} counter={`0${cards.indexOf(card) + 1} / 05`} />)}</div>
        {!filtered.length && <p className="empty-search">No matches yet. Try Button, Input, or StatCard.</p>}
      </section>
      <InteractivePreview />
    </div>
  </>;
}
