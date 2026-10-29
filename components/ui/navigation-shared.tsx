"use client";

import { useEffect, useId, useState, type AnchorHTMLAttributes, type ReactElement, type ReactNode } from "react";

export type NavigationLink = {
  value: string;
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  target?: AnchorHTMLAttributes<HTMLAnchorElement>["target"];
  rel?: string;
};
export type NavigationSection = { value: string; label?: string; links: readonly NavigationLink[] };
export type NavigationLinkRenderer = (link: NavigationLink, props: AnchorHTMLAttributes<HTMLAnchorElement>) => ReactElement;
export type NavigationLinkContext = { activeValue?: string; onNavigate?: (link: NavigationLink) => void; renderLink?: NavigationLinkRenderer; collapsed?: boolean; className?: string };

export function useControllableValue<T>(controlled: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [local, setLocal] = useState(defaultValue);
  const value = controlled === undefined ? local : controlled;
  const update = (next: T) => {
    if (Object.is(value, next)) return;
    if (controlled === undefined) setLocal(next);
    onChange?.(next);
  };
  return [value, update] as const;
}

/** Close mobile overlays when a resize crosses the desktop boundary, without reading during SSR. */
export function useCloseOnDesktop(close: () => void) {
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const change = () => { if (media.matches) close(); };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [close]);
}

export function navigationLinkElement(link: NavigationLink, { activeValue, onNavigate, renderLink, collapsed, className = "ui-navigation-link" }: NavigationLinkContext = {}): ReactElement {
  const active = link.active ?? link.value === activeValue;
  const children = <>
    {collapsed || link.icon ? <span className="ui-navigation-icon" aria-hidden="true">{link.icon ?? link.label.slice(0, 1)}</span> : null}
    <span className={collapsed ? "sr-only" : "ui-navigation-link-text"}><span>{link.label}</span>{link.description && <small>{link.description}</small>}</span>
  </>;
  if (link.disabled) return <span className={className} role="link" aria-disabled="true" title={collapsed ? link.label : undefined}>{children}</span>;
  const props: AnchorHTMLAttributes<HTMLAnchorElement> = {
    href: link.href, className, children,
    "aria-current": active ? "page" : undefined,
    target: link.target,
    rel: link.target === "_blank" ? `${link.rel ?? ""} noopener noreferrer`.trim() : link.rel,
    title: collapsed ? link.label : undefined,
    onClick: (event) => {
      if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) onNavigate?.(link);
    },
  };
  return renderLink ? renderLink(link, props) : <a {...props} />;
}

export function NavigationLinkSections({ sections, ...context }: NavigationLinkContext & { sections: readonly NavigationSection[] }) {
  const id = useId();
  return <>{sections.map((section, index) => <section className="ui-navigation-section" key={section.value} aria-labelledby={section.label ? `${id}-${index}` : undefined}>
    {section.label && <h3 id={`${id}-${index}`} className={context.collapsed ? "sr-only" : "ui-navigation-section-title"}>{section.label}</h3>}
    <ul className="ui-navigation-link-list">{section.links.map((link) => <li key={link.value}>{navigationLinkElement(link, context)}</li>)}</ul>
  </section>)}</>;
}

export function NavigationGlyph({ kind }: { kind: "menu" | "collapse" | "expand" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "menu" ? <path d="M4 6H20M4 12H20M4 18H20" /> : <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4V20" /><path d={kind === "collapse" ? "M16 9L13 12L16 15" : "M14 9L17 12L14 15"} /></>}
  </svg>;
}
