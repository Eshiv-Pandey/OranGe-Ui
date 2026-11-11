"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight } from "lucide-react";
import { blocks, blockCategories, blockCategoryHref, type BlockCategory } from "../../lib/blocks";
import { Input } from "../ui/input";
import { BlockThumbnail } from "./block-thumbnail";
import "../../styles/blocks-library.css";

export function BlockCatalogue() {
  const router = useRouter();
  const [query, setQuery] = useState(""), [view, setView] = useState("sections"), [family, setFamily] = useState("All");
  const examples = useMemo(() => blocks.filter(block => (family === "All" || block.family === family) && `${block.title} ${block.name} ${block.category} ${block.description}`.toLowerCase().includes(query.trim().toLowerCase())), [query, family]);
  const showExamples = view === "examples" || Boolean(query.trim());
  function clear() { setQuery(""); setFamily("All"); }
  return <div className="blocks-catalogue"><header className="blocks-intro"><h1>Blocks</h1>
    <div className="blocks-filters"><Input type="search" label="Search blocks" hideLabel icon={<Search size={17} />} placeholder="Search blocks..." value={query} onChange={event => setQuery(event.target.value)} /><label className="blocks-category-picker"><span className="blocks-visually-hidden">Open a section</span><select aria-label="Block category" value="All" onChange={event => { if (event.target.value !== "All") router.push(blockCategoryHref(event.target.value as BlockCategory)); }}><option value="All">All sections</option>{blockCategories.map(item => <option key={item}>{item}</option>)}</select></label></div></header>
    <div className="blocks-family-row"><div role="group" aria-label="Browse blocks"><button type="button" aria-pressed={!showExamples} onClick={() => { setView("sections"); clear(); }}>Browse sections</button><button type="button" aria-pressed={showExamples} onClick={() => setView("examples")}>All examples</button></div><span role="status">{showExamples ? `${examples.length} examples` : `${blockCategories.length} sections`}</span></div>
    {showExamples ? <><div className="blocks-family-row"><div role="group" aria-label="Block family">{["All", "Marketing", "Content", "Workspace", "Templates"].map(item => <button type="button" key={item} aria-pressed={family === item} onClick={() => setFamily(item)}>{item}</button>)}</div></div><div className="blocks-grid">{examples.map(block => <Link className="block-card" key={block.slug} href={`/blocks/${block.slug}`}><BlockThumbnail block={block} /><div className="block-card-copy"><h2>{block.title}<ArrowUpRight size={18} /></h2><span>{block.category}</span><p>{block.description}</p></div></Link>)}</div>{!examples.length && <div className="blocks-empty"><h2>No matching examples.</h2><p>Try another name or explore every section.</p><button type="button" onClick={clear}>Clear filters</button></div>}</>
      : <div className="blocks-grid block-categories-grid">{blockCategories.map(category => {
        const entries = blocks.filter(block => block.category === category);
        return <Link className="block-card block-category-card" key={category} href={blockCategoryHref(category)}><div className="block-category-label"><h2>{category}</h2><span>{entries.length} {entries.length === 1 ? "example" : "examples"}</span></div><BlockThumbnail block={entries[0]} /><div className="block-category-action">Explore {category.toLowerCase()}<ArrowUpRight size={17} /></div></Link>;
      })}</div>}
    <div className="blocks-catalogue-note"><Link href="/docs">Setup guide <ArrowUpRight size={16} /></Link></div>
  </div>;
}
