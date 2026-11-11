"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { blocks, blockCategories } from "../../lib/blocks";
import { Input } from "../ui/input";
import { BlockThumbnail } from "./block-thumbnail";
import "../../styles/blocks-library.css";

export function BlockCatalogue() {
  const [query, setQuery] = useState(""), [category, setCategory] = useState("All"), [family, setFamily] = useState("All");
  const filtered = useMemo(() => blocks.filter(block => (category === "All" || block.category === category) && (family === "All" || block.family === family) && `${block.title} ${block.name} ${block.category} ${block.description}`.toLowerCase().includes(query.trim().toLowerCase())), [query, category, family]);
  function clear() { setQuery(""); setCategory("All"); setFamily("All"); }
  return <div className="blocks-catalogue"><header className="blocks-intro"><h1>Blocks for good pages.</h1><p>Original sections with room to make them yours. Explore authentication, marketing and workspace blocks, all built from the same polished system.</p><div className="blocks-intro-meta"><span>{blocks.length} considered blocks</span><span>27 section types + 2 templates</span><span>Polished / Light + dark</span></div></header>
    <div className="blocks-filters"><Input type="search" label="Search blocks" hideLabel icon={<Search size={17} />} placeholder="Auth, hero, pricing..." value={query} onChange={event => setQuery(event.target.value)} /><label>Section<select aria-label="Block category" value={category} onChange={event => { setCategory(event.target.value); setFamily("All"); }}><option value="All">All sections</option>{blockCategories.map(item => <option key={item}>{item}</option>)}</select></label></div>
    <div className="blocks-family-row"><div role="group" aria-label="Block family">{["All", "Marketing", "Content", "Workspace", "Templates"].map(item => <button type="button" key={item} aria-pressed={family === item} onClick={() => { setFamily(item); setCategory("All"); }}>{item}</button>)}</div><span role="status">{filtered.length} {filtered.length === 1 ? "block" : "blocks"}</span></div>
    <div className="blocks-grid">{filtered.map(block => <Link className="block-card" key={block.slug} href={`/blocks/${block.slug}`}><BlockThumbnail block={block} /><div className="block-card-copy"><h2>{block.title}<ArrowUpRight size={18} /></h2><span>{block.category}</span><p>{block.description}</p></div></Link>)}</div>
    {!filtered.length && <div className="blocks-empty"><h2>No blocks here yet.</h2><p>Try a different name or return to the full collection.</p><button type="button" onClick={clear}>Clear filters</button></div>}
    <div className="blocks-catalogue-note"><p>Every block includes a live preview, typed props, a registry command and complete source. Daylight content is fictional; supply your own copy and connect callbacks to your application.</p><Link href="/docs">Read the setup guide <ArrowUpRight size={16} /></Link></div>
  </div>;
}
