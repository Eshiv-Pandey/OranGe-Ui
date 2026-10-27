"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { componentCategories, components } from "../../lib/components";
import type { Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet } from "../ui/sheet";
import { ThemeToggle } from "../landing/theme-toggle";
import { PixelLogo } from "../landing/pixel-icon";
import "../../styles/library.css";

const AppearanceContext = createContext<{ appearance: Appearance; href: (path: string) => string }>({ appearance: "polished", href: (path) => path });
export const useLibrary = () => useContext(AppearanceContext);
function subscribe(callback: () => void) { window.addEventListener("orange-appearance", callback); return () => window.removeEventListener("orange-appearance", callback); }
function storedAppearance(): Appearance { try { return localStorage.getItem("orangeui-appearance") === "pixel" ? "pixel" : "polished"; } catch { return "polished"; } }

export function LibraryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const search = useSearchParams(); const router = useRouter();
  const stored = useSyncExternalStore(subscribe, storedAppearance, () => "polished" as Appearance);
  const requested = search.get("style");
  const appearance = requested === "pixel" || requested === "polished" ? requested : stored;
  const [menu, setMenu] = useState(false);
  const href = (path: string) => `${path}?style=${appearance}`;
  function choose(next: Appearance) {
    try { localStorage.setItem("orangeui-appearance", next); window.dispatchEvent(new Event("orange-appearance")); } catch { /* URL remains the source of truth when storage is unavailable. */ }
    router.replace(`${pathname}?style=${next}`, { scroll: false });
  }
  return <AppearanceContext.Provider value={{ appearance, href }}><div className="library-shell">
    <a href="#library-main" className="skip-link">Skip to content</a>
    <header className="library-header"><Link href="/" className="wordmark" aria-label="oRangeUi home"><PixelLogo /><span>oRangeUi<span className="wordmark-dot">.</span></span></Link><nav aria-label="Main navigation"><Link href={href("/components")} aria-current={pathname.startsWith("/components") ? "page" : undefined}>Components</Link><Link href={href("/docs")} aria-current={pathname === "/docs" ? "page" : undefined}>Documentation</Link></nav><div className="library-header-actions"><ThemeToggle /><div className="library-mobile-menu"><Sheet open={menu} onOpenChange={setMenu} side="left" trigger={<Button variant="secondary" aria-label="Open component navigation menu">Menu</Button>} title="Find your building block"><LibraryNav close={() => setMenu(false)} /></Sheet></div></div></header>
    <div className="library-layout"><aside className="library-sidebar"><LibraryNav /></aside><main id="library-main" className="library-main"><div className="library-topline"><span>THE COMPONENT COLLECTION</span><div className="appearance-picker" role="group" aria-label="Component appearance"><button type="button" aria-pressed={appearance === "polished"} onClick={() => choose("polished")}>Polished</button><button type="button" aria-pressed={appearance === "pixel"} onClick={() => choose("pixel")}>Pixelated <span aria-hidden="true">✦</span></button></div></div>{children}<footer className="library-footer"><span>A pixel soul. A polished finish.</span><Link href="/">Back to the little orange →</Link></footer></main></div>
  </div></AppearanceContext.Provider>;
}

function LibraryNav({ close }: { close?: () => void }) {
  const { href, appearance } = useLibrary(); const pathname = usePathname(); const [query, setQuery] = useState(""); const id = useId();
  const filtered = components.filter((c) => `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <nav className="library-nav" aria-label="Component navigation"><Input id={id} label="Search navigation" hideLabel type="search" placeholder="Find a component..." value={query} onChange={(event) => setQuery(event.target.value)} /><div className="library-nav-intro"><Link onClick={close} href={href("/docs")} aria-current={pathname === "/docs" ? "page" : undefined}>Getting started <span>↗</span></Link><Link onClick={close} href={href("/components")} aria-current={pathname === "/components" ? "page" : undefined}>All components <span>{components.length}</span></Link><Link onClick={close} href="/components?style=pixel" aria-current={pathname === "/components" && appearance === "pixel" ? "page" : undefined}>Pixelated collection <span>✦</span></Link></div>{componentCategories.map((category) => <div className="library-nav-group" key={category}>{filtered.some((c) => c.category === category) && <><p>{category}</p>{filtered.filter((c) => c.category === category).map((c) => <Link href={href(`/components/${c.slug}`)} key={c.slug} onClick={close} aria-current={pathname === `/components/${c.slug}` ? "page" : undefined}>{c.name}{c.slug === "gamer-boy" && <span className="nav-new">PLAY</span>}</Link>)}</>}</div>)}{!filtered.length && <p role="status" className="ui-help">No matching components.</p>}<p className="library-nav-note">32 building blocks.<br />Two ways to make them yours.</p></nav>;
}
