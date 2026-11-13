"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { DOC_SECTIONS, SIGNATURE_LINKS, docsEssentialSections, docsNavigationGroups, matchesDocsEntry, type DocsNavigationEntry } from "../../lib/docs-navigation";
import { APPEARANCES } from "../ui/appearance";
import { BlockSectionNav } from "./block-section-nav";
import { useLibrary } from "./library-shell";
import "../../styles/docs-navigation.css";

const subscribeHash = (notify: () => void) => {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => { window.removeEventListener("hashchange", notify); window.removeEventListener("popstate", notify); };
};
const readHash = () => typeof window === "undefined" ? "" : window.location.hash.slice(1);

export type DocsNavigationProps = { close?: () => void; query?: string };

/** One navigation tree for the desktop sidebar and mobile sheet. */
export function DocsNavigation({ close, query = "" }: DocsNavigationProps) {
  const pathname = usePathname(), hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const { href, appearance } = useLibrary();
  const id = useId(), [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const searching = !!query.trim();
  const showingBlocks = pathname.startsWith("/blocks");
  const signatures = SIGNATURE_LINKS.filter(entry => matchesDocsEntry(entry, query));
  const groups = docsNavigationGroups.map(group => ({ ...group, entries: group.entries.filter(entry => matchesDocsEntry(entry, query)) })).filter(group => group.entries.length);
  const setup = DOC_SECTIONS.filter(section => matchesDocsEntry({ ...section, href: `/docs#${section.id}`, description: "Getting started and setup" }, query));
  const collections = APPEARANCES.filter(item => `${item.label} ${item.description} collection`.toLowerCase().includes(query.toLowerCase().trim()));

  function navigationLink(entry: DocsNavigationEntry) {
    return <Link key={entry.id} prefetch={false} href={entry.href.startsWith("/components/") ? href(entry.href) : entry.href} onClick={close} aria-current={pathname === entry.href ? "page" : undefined}>{entry.label}</Link>;
  }
  function disclosure(key: string, label: string, count: number, active: boolean, children: ReactNode) {
    const locationKey = `${pathname}#${hash}:${key}`;
    const open = searching || (expanded[locationKey] ?? active);
    return <div className="docs-nav-group" key={key} data-open={open || undefined}>
      <button type="button" className="docs-nav-disclosure" aria-expanded={open} aria-controls={`${id}-${key}`} onClick={() => setExpanded(previous => ({ ...previous, [locationKey]: !open }))}>
        <span>{label}</span><span className="docs-nav-group-meta" aria-hidden="true"><span className="docs-nav-count">{count}</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 4 4-4 4" /></svg></span>
      </button>
      <div id={`${id}-${key}`} className="docs-nav-group-links" hidden={!open}>{children}</div>
    </div>;
  }
  const resultCount = signatures.length + groups.reduce((count, group) => count + group.entries.length, 0) + setup.length + collections.length;

  return <nav className="library-nav docs-navigation" aria-label="Component navigation">
    <Link className="docs-nav-start" prefetch={false} href={href("/docs")} onClick={close} aria-current={pathname === "/docs" ? "page" : undefined}>Getting started</Link>
    {!!signatures.length && <div className="docs-nav-signatures" role="group" aria-label="Signature components">{signatures.map(navigationLink)}</div>}
    {!searching && <div className="docs-nav-browse"><Link prefetch={false} href={href("/components")} onClick={close} aria-current={pathname === "/components" ? "page" : undefined}>All components</Link><Link prefetch={false} href="/blocks" onClick={close} aria-current={pathname.startsWith("/blocks") ? "page" : undefined}>Blocks</Link></div>}
    {showingBlocks ? <BlockSectionNav query={query} pathname={pathname} close={close} /> : <div className="docs-nav-collections">{groups.map(group => disclosure(group.id, group.label, group.entries.length, group.entries.some(entry => pathname === entry.href), group.id === "essentials" ? docsEssentialSections(group.entries).map(section => <div className="docs-nav-subgroup" key={section.id}><p>{section.label}</p>{section.entries.map(navigationLink)}</div>) : group.entries.map(navigationLink)))}</div>}
    {!!collections.length && disclosure("collections", "Collections", collections.length, pathname === "/components" && appearance !== "polished", collections.map(item => <Link key={item.value} prefetch={false} href={`/components?style=${item.value}`} onClick={close} aria-current={pathname === "/components" && appearance === item.value ? "page" : undefined}>{item.label}</Link>))}
    {!!setup.length && disclosure("setup", "Setup guide", setup.length, pathname === "/docs" && DOC_SECTIONS.some(section => section.id === hash), setup.map(section => pathname === "/docs" ? <a key={section.id} href={`#${section.id}`} onClick={close} aria-current={hash === section.id ? "location" : undefined}>{section.label}</a> : <Link key={section.id} prefetch={false} href={`${href("/docs")}#${section.id}`} onClick={close}>{section.label}</Link>))}
    {searching && !showingBlocks && <p className="docs-nav-results" role="status">{resultCount ? `${resultCount} matching links` : "No matching links. Try a component name."}</p>}
  </nav>;
}
