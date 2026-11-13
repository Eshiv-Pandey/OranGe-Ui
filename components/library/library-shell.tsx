"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { findComponent } from "../../lib/components";
import { DocsNavigation } from "./docs-navigation";
import { APPEARANCES, isAppearance, parseAppearance, type Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";
import { ThemeToggle } from "../landing/theme-toggle";
import { PixelLogo } from "../landing/pixel-icon";
import { CommandSearch } from "./command-search";
import { ThemeTools } from "./theme-tools";
import packageInfo from "../../package.json";
import "../../styles/library.css";
import "../../styles/launch-docs.css";
import "../../styles/component-workbench.css";
import "../../styles/library-navigation.css";
import "../../styles/library-workspace.css";

const { version } = packageInfo;

const AppearanceContext = createContext<{ appearance: Appearance; href: (path: string) => string }>({ appearance: "polished", href: (path) => path });
export const useLibrary = () => useContext(AppearanceContext);
function subscribe(callback: () => void) { window.addEventListener("orange-appearance", callback); return () => window.removeEventListener("orange-appearance", callback); }
function storedAppearance(): Appearance { try { return parseAppearance(localStorage.getItem("orangeui-appearance")); } catch { return "polished"; } }
function subscribeSidebar(callback: () => void) { window.addEventListener("orange-sidebar", callback); return () => window.removeEventListener("orange-sidebar", callback); }
function storedSidebar() { try { return localStorage.getItem("orangeui-sidebar") === "collapsed"; } catch { return false; } }

function Brand() {
  return <Link href="/" className="wordmark" aria-label="oRangeUi home"><PixelLogo /><span>oRangeUi<span className="wordmark-dot">.</span></span></Link>;
}
function PanelIcon() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3.5" width="14" height="13" rx="2" /><path d="M8 4v12" /></svg>;
}

/** Isolate the URL-dependent hook so the docs and CSS canvas fallback prerender. */
function AppearanceQuery({ onChange }: { onChange: (appearance: string | null) => void }) {
  const search = useSearchParams(), requested = search.get("style");
  useEffect(() => onChange(requested), [requested, onChange]);
  return null;
}

export function LibraryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const [requested, setRequested] = useState<string | null>(null);
  const stored = useSyncExternalStore(subscribe, storedAppearance, () => "polished" as Appearance);
  const collapsed = useSyncExternalStore(subscribeSidebar, storedSidebar, () => false);
  const appearance = (pathname.startsWith("/blocks") || pathname.startsWith("/stickers")) ? "polished" : isAppearance(requested) ? requested : stored;
  const [menu, setMenu] = useState(false), [localCollapsed, setLocalCollapsed] = useState<boolean>();
  const isCollapsed = localCollapsed ?? collapsed;
  const href = (path: string) => {
    const destination = new URL(path, "https://orangeui.local");
    if ((destination.pathname.startsWith("/components") || destination.pathname === "/docs") && !destination.searchParams.has("style")) {
      const collection = destination.pathname.startsWith("/components/") ? findComponent(destination.pathname.split("/").at(-1) || "")?.collection : undefined;
      destination.searchParams.set("style", collection ?? appearance);
    }
    return destination.pathname + destination.search + destination.hash;
  };
  function choose(next: Appearance) {
    try { localStorage.setItem("orangeui-appearance", next); window.dispatchEvent(new Event("orange-appearance")); } catch { /* Direct URLs also preserve appearance. */ }
    router.replace(`${pathname}?style=${next}`, { scroll: false });
  }
  function toggleSidebar() {
    setLocalCollapsed(!isCollapsed);
    try { localStorage.setItem("orangeui-sidebar", isCollapsed ? "expanded" : "collapsed"); window.dispatchEvent(new Event("orange-sidebar")); } catch { /* The mounted control works without storage. */ }
  }
  return <AppearanceContext.Provider value={{ appearance, href }}><div className="library-shell library-navigation-shell" data-sidebar={isCollapsed ? "collapsed" : "expanded"} onClickCapture={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin === window.location.origin && destination.pathname.startsWith("/components/") && !destination.hash) {
      window.dispatchEvent(new Event("orangeui:open-playground"));
    }
  }}>
    <Suspense fallback={null}><AppearanceQuery onChange={setRequested} /></Suspense>
    <a href="#library-main" className="skip-link">Skip to content</a>
    <aside className="library-sidebar" aria-label="Documentation sidebar">
      <div className="library-sidebar-head">
        <div className="library-sidebar-brand"><Brand /><button className="sidebar-collapse" type="button" onClick={toggleSidebar} aria-expanded={!isCollapsed} aria-controls="desktop-component-navigation" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}><PanelIcon /></button></div>
        <CommandSearch className="sidebar-search" />
      </div>
      <div id="desktop-component-navigation" className="library-sidebar-scroll" hidden={isCollapsed}><DocsNavigation /></div>
      <div className="library-sidebar-footer"><a href="https://github.com/Eshiv-Pandey/OranGe-Ui" aria-label="oRangeUi on GitHub">GitHub</a><Link href="/docs#version">v{version}</Link></div>
    </aside>
    <div className="library-content-column">
      <header className="library-header"><div className="library-mobile-brand"><Brand /></div><nav aria-label="Main navigation"><Link href={href("/components")} aria-current={pathname.startsWith("/components") && pathname !== "/components/morphing-icons" ? "page" : undefined}>Components</Link><Link href="/stickers" aria-current={pathname.startsWith("/stickers") ? "page" : undefined}>Stickers</Link><Link href={href("/components/morphing-icons")} aria-current={pathname === "/components/morphing-icons" ? "page" : undefined}>Morph icons</Link><Link href="/blocks" aria-current={pathname.startsWith("/blocks") ? "page" : undefined}>Blocks</Link><Link href={href("/docs")} aria-current={pathname === "/docs" ? "page" : undefined}>Docs</Link></nav><div className="library-header-actions"><div className="library-mobile-search"><CommandSearch /></div><label className="header-appearance" hidden={pathname.startsWith("/blocks") || pathname.startsWith("/stickers")}><span className="sr-only">Component appearance</span><select value={appearance} onChange={(event) => choose(parseAppearance(event.target.value))}>{APPEARANCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><ThemeTools appearance={appearance} /><ThemeToggle /><div className="library-mobile-menu"><Sheet open={menu} onOpenChange={setMenu} side="left" trigger={<Button variant="secondary" aria-label="Open documentation navigation"><PanelIcon /></Button>} title="oRangeUi navigation"><DocsNavigation close={() => setMenu(false)} /></Sheet></div></div></header>
      <div className="library-layout"><main id="library-main" className="library-main">{children}<footer className="library-footer"><span>A pixel soul. A polished finish.</span><Link href="/">Back to the little orange</Link></footer></main></div>
    </div>
  </div></AppearanceContext.Provider>;
}
