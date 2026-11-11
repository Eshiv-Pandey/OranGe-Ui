"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { blockCategories, blockCategoryHref, blocks } from "../../lib/blocks";
import "../../styles/block-collection.css";

export type BlockSectionNavProps = { query: string; pathname: string; close?: () => void };

export function BlockSectionNav({ query, pathname, close }: BlockSectionNavProps) {
  const needle = query.toLowerCase().trim();
  const groups = blockCategories.map(category => {
    const entries = blocks.filter(block => block.category === category);
    const matches = needle ? entries.filter(block => `${block.name} ${block.title} ${block.description} ${block.category}`.toLowerCase().includes(needle)) : entries;
    const href = blockCategoryHref(category);
    const active = pathname === href || entries.some(block => pathname === `/blocks/${block.slug}`);
    return { category, entries, matches, href, active };
  }).filter(group => group.matches.length > 0);

  return <section className="bc-section-nav" aria-label="Block categories">
    <h2 className="bc-nav-heading">Categories</h2>
    {groups.map(({ category, entries, matches, href, active }) => <div className="bc-nav-category" key={category} data-active={active ? "true" : undefined}>
      <Link className="bc-category-link" href={href} onClick={close} aria-current={pathname === href ? "page" : undefined}>
        <ChevronRight size={13} aria-hidden="true" className={active || needle ? "bc-category-chevron bc-category-chevron-open" : "bc-category-chevron"} /><span>{category}</span><span className="bc-category-count" aria-label={`${entries.length} ${entries.length === 1 ? "block" : "blocks"}`}>{entries.length}</span>
      </Link>
      {(active || needle) && <div className="bc-nav-items">{matches.map(block => <Link key={block.slug} href={`${href}#block-${block.slug}`} onClick={close} aria-current={pathname === `/blocks/${block.slug}` ? "page" : undefined}>{block.name}</Link>)}</div>}
    </div>)}
    {!groups.length && <p className="bc-nav-empty" role="status">No matching blocks. Try another name or category.</p>}
  </section>;
}
