"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { componentCategories, components } from "../../lib/components";
import { APPEARANCES, isAppearance, parseAppearance, type Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet } from "../ui/sheet";
import { ThemeToggle } from "../landing/theme-toggle";
import { PixelLogo } from "../landing/pixel-icon";
import { CommandSearch } from "./command-search";
import { ThemeTools } from "./theme-tools";
import { version } from "../../package.json";
import "../../styles/library.css";
import "../../styles/launch-docs.css";

const AppearanceContext = createContext<{ appearance: Appearance; href: (path: string) => string }>({ appearance: "polished", href: (path) => path });
export const useLibrary = () => useContext(AppearanceContext);
function subscribe(callback: () => void) { window.addEventListener("orange-appearance", callback); return () => window.removeEventListener("orange-appearance", callback); }
function storedAppearance(): Appearance { try { return parseAppearance(localStorage.getItem("orangeui-appearance")); } catch { return "polished"; } }

export function LibraryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const search = useSearchParams(); const router = useRouter();
  const stored = useSyncExternalStore(subscribe, storedAppearance, () => "polished" as Appearance);
  const requested = search.get("style");
  const appearance = isAppearance(requested) ? requested : stored;
  const [menu, setMenu] = useState(false);
  const href = (path: string) => `${path}?style=${appearance}`;
  function choose(next: Appearance) {
    try { localStorage.setItem("orangeui-appearance", next); window.dispatchEvent(new Event("orange-appearance")); } catch { /* URL remains the source of truth when storage is unavailable. */ }
    router.replace(`${pathname}?style=${next}`, { scroll: false });
  }
  return <AppearanceContext.Provider value={{ appearance, href }}><div className="library-shell">
    <a href="#library-main" className="skip-link">Skip to content</a>
    <header className="library-header"><Link href="/" className="wordmark" aria-label="oRangeUi home"><PixelLogo /><span>oRangeUi<span className="wordmark-dot">.</span></span></Link><a className="header-version" href="/docs#version" aria-label={`v${version} changelog`}>v{version}</a><nav aria-label="Main navigation"><Link href={href("/components")} aria-current={pathname.startsWith("/components") ? "page" : undefined}>Components</Link><Link href={href("/docs")} aria-current={pathname === "/docs" ? "page" : undefined}>Documentation</Link></nav><div className="library-header-actions"><CommandSearch /><ThemeTools appearance={appearance} /><ThemeToggle /><a className="header-github" href="https://github.com/Eshiv-Pandey/OranGe-Ui">GitHub</a><div className="library-mobile-menu"><Sheet open={menu} onOpenChange={setMenu} side="left" trigger={<Button variant="secondary" aria-label="Open component navigation menu">Menu</Button>} title="Find your building block"><LibraryNav close={() => setMenu(false)} /></Sheet></div></div></header>
    <div className="library-layout"><aside className="library-sidebar"><LibraryNav /></aside><main id="library-main" className="library-main"><div className="library-topline"><div className="appearance-picker" role="group" aria-label="Component appearance">{APPEARANCES.map((item) => <button type="button" key={item.value} title={item.description} aria-pressed={appearance === item.value} onClick={() => choose(item.value)}>{item.label}</button>)}</div></div>{children}<footer className="library-footer"><span>A pixel soul. A polished finish.</span><Link href="/">Back to the little orange →</Link></footer></main></div>
  </div></AppearanceContext.Provider>;
}

function LibraryNav({ close }: { close?: () => void }) {
  const { href, appearance } = useLibrary(); const pathname = usePathname(); const [query, setQuery] = useState(""); const id = useId();
  const filtered = components.filter((c) => `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <nav className="library-nav" aria-label="Component navigation"><Input id={id} label="Search navigation" hideLabel type="search" placeholder="Find a component..." value={query} onChange={(event) => setQuery(event.target.value)} /><div className="library-nav-intro"><Link onClick={close} href={href("/docs")} aria-current={pathname === "/docs" ? "page" : undefined}>Getting started <span>↗</span></Link><Link onClick={close} href={href("/components")} aria-current={pathname === "/components" ? "page" : undefined}>All components <span>{components.length}</span></Link>{APPEARANCES.filter((item) => item.value !== "polished").map((item) => <Link key={item.value} onClick={close} href={`/components?style=${item.value}`} aria-current={pathname === "/components" && appearance === item.value ? "page" : undefined}>{item.label} collection</Link>)}</div>{componentCategories.map((category) => <div className="library-nav-group" key={category}>{filtered.some((c) => c.category === category) && <><p>{category}</p>{filtered.filter((c) => c.category === category).map((c) => <Link href={href(`/components/${c.slug}`)} key={c.slug} onClick={close} aria-current={pathname === `/components/${c.slug}` ? "page" : undefined}>{c.name}{c.slug === "gamer-boy" && <span className="nav-new">PLAY</span>}</Link>)}</>}</div>)}{!filtered.length && <p role="status" className="ui-help">No matching components.</p>}<a href="https://github.com/Eshiv-Pandey/OranGe-Ui">GitHub repository</a><a href="/docs#version">Changelog <span>v{version}</span></a><p className="library-nav-note">{components.length} building blocks.<br />Five ways to make them yours.</p></nav>;
}
