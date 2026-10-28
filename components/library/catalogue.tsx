"use client";
import Link from "next/link";
import { useState } from "react";
import { componentCategories, components } from "../../lib/components";
import { APPEARANCES } from "../ui/appearance";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ComponentDemo } from "./component-demo";
import { useLibrary } from "./library-shell";

export function Catalogue() {
  const { appearance, href } = useLibrary(); const [query, setQuery] = useState(""); const [category, setCategory] = useState("All");
  const selected = APPEARANCES.find((item) => item.value === appearance)!;
  const filtered = components.filter((c) => (category === "All" || c.category === category) && `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <><div className="library-heading"><p className="library-kicker">{selected.label.toUpperCase() + " COLLECTION"}</p><h1>{{ polished: "Your next building block.", pixel: "Pixels with purpose.", neobrutalism: "Bold by design.", "retro-os": "A familiar kind of future.", terminal: "Ready for your next command." }[appearance]}</h1><p>{components.length} real React components. Five distinct appearances. Thoughtful details, useful defaults, and a little room to make them your own.</p><Link href={href("/docs")} className="text-link">New here? Get started →</Link></div><div className="catalogue-controls"><Input label="Search all components" hideLabel type="search" placeholder="Find your next good idea..." value={query} onChange={(event) => setQuery(event.target.value)} /><p role="status">{filtered.length} of {components.length} components</p></div><div className="catalogue-filters" role="group" aria-label="Component category">{["All", ...componentCategories].map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="component-grid" data-appearance={appearance}>{filtered.map((c, index) => <article className={`component-tile tile-${c.slug}`} key={c.slug}><div className="component-thumbnail" aria-hidden="true" inert><div className="thumbnail-inner"><ComponentDemo slug={c.slug} appearance={appearance} /></div><span className="thumbnail-number">{String(index + 1).padStart(2, "0")}</span></div><div className="component-tile-copy"><h2><Link href={href(`/components/${c.slug}`)}>{c.name}<span aria-hidden="true">↗</span></Link></h2><p>{c.description}</p><span className="tile-category">{c.category}</span></div></article>)}</div>{!filtered.length && <div className="catalogue-empty"><h2>A little too specific?</h2><p>Try a component name, or explore the whole collection.</p><Button variant="secondary" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</Button></div>}</>;
}
