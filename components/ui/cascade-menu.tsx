"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KineticArrow } from "./kinetic-elements";
import "../../styles/kinetic-components.css";

export type CascadeMenuItem = { id: string; label: string; href: string; description?: string; current?: boolean; target?: "_blank" | "_self" };
export type CascadeMenuProps = AppearanceProps & {
  items: readonly CascadeMenuItem[]; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void;
  onNavigate?: (item: CascadeMenuItem) => void; brand?: ReactNode; children?: ReactNode; footer?: ReactNode;
  fullScreen?: boolean; height?: number | string; accent?: string; label?: string; theme?: CreativeTheme;
};

/** Ruled navigation sheets reveal in sequence, with an optional full-screen dialog. */
export function CascadeMenu({ items, open: controlled, defaultOpen = false, onOpenChange, onNavigate, brand = "Studio", children, footer, fullScreen = false, height = 460, accent = "#c15f3c", label = "Site navigation", theme = "auto", appearance = "polished", className }: CascadeMenuProps) {
  const [local, setLocal] = useState(defaultOpen), open = controlled ?? local, resolved = useCreativeTheme(theme), id = useId();
  const trigger = useRef<HTMLButtonElement>(null), drawer = useRef<HTMLDivElement>(null);
  const latest = useRef({ controlled, onOpenChange });
  useEffect(() => { latest.current = { controlled, onOpenChange }; }, [controlled, onOpenChange]);
  function setOpen(next: boolean) { if (controlled === undefined) setLocal(next); onOpenChange?.(next); }
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : trigger.current;
    const overflow = document.body.style.overflow;
    if (fullScreen) document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => drawer.current?.querySelector<HTMLButtonElement>('button:not([tabindex="-1"])')?.focus());
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); if (latest.current.controlled === undefined) setLocal(false); latest.current.onOpenChange?.(false); }
      if (event.key !== "Tab" || !fullScreen) return;
      const targets = Array.from(drawer.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled):not([tabindex="-1"]),[tabindex="0"]') ?? []);
      if (!targets.length) return;
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !drawer.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", key);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", key); if (fullScreen) document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [open, fullScreen]);
  const menu = <div className="cascade-menu-drawer" ref={drawer} id={id} data-open={open} data-fullscreen={fullScreen} data-theme={resolved} data-appearance={appearance} inert={!open} role={fullScreen ? "dialog" : undefined} aria-modal={fullScreen && open ? true : undefined} aria-label={label} style={{ "--kinetic-accent": accent } as CSSProperties}>
    <button className="cascade-menu-backdrop" type="button" tabIndex={-1} aria-label="Close navigation" onClick={() => setOpen(false)} />
    <div className="cascade-menu-sheet cascade-menu-sheet-back" aria-hidden="true" /><div className="cascade-menu-sheet cascade-menu-sheet-middle" aria-hidden="true" />
    <div className="cascade-menu-panel"><div className="cascade-menu-panel-head"><span>{brand}</span><button type="button" className="kinetic-icon" aria-label="Close menu" onClick={() => setOpen(false)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
      <nav aria-label={label}><ul>{items.map((item, index) => <li key={item.id} style={{ "--cascade-order": index } as CSSProperties}><a href={item.href} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined} aria-current={item.current ? "page" : undefined} onClick={() => { setOpen(false); onNavigate?.(item); }}><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span><KineticArrow /></a></li>)}</ul>{!items.length && <p className="kinetic-empty">Add links to your navigation.</p>}</nav>
      {footer && <div className="cascade-menu-footer">{footer}</div>}
    </div>
  </div>;
  return <section className={["creative-surface cascade-menu", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} style={{ height, "--kinetic-accent": accent } as CSSProperties}>
    <header className="cascade-menu-header"><span>{brand}</span><button ref={trigger} type="button" className="cascade-menu-trigger" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Explore <span aria-hidden="true" data-open={open}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12h14" /></svg></span></button></header>
    <div className="cascade-menu-content">{children}</div>
    {fullScreen ? typeof document !== "undefined" && createPortal(menu, document.body) : menu}
  </section>;
}
