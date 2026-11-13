"use client";

import { HoverCard } from "radix-ui";
import { createContext, lazy, Suspense, useContext, useState, useSyncExternalStore, type Dispatch, type SetStateAction, type ReactElement, type ReactNode } from "react";
import { findComponent } from "../../lib/components";
import { useLibrary } from "./library-shell";

const ComponentDemo = lazy(() => import("./component-demo").then(module => ({ default: module.ComponentDemo })));
const media = "(min-width: 801px) and (hover: hover) and (pointer: fine)";
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(media);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const Preview = createContext<{ enabled: boolean; active: string; setActive: Dispatch<SetStateAction<string>> }>({ enabled: false, active: "", setActive: () => {} });

/** One live preview at a time; touch links retain their normal navigation. */
export function DocsPreviewProvider({ children }: { children: ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, () => window.matchMedia(media).matches, () => false);
  const [active, setActive] = useState("");
  return <Preview.Provider value={{ enabled, active, setActive }}>{children}</Preview.Provider>;
}

export function DocsPreviewLink({ slug, children }: { slug?: string; children: ReactElement }) {
  const { enabled, active, setActive } = useContext(Preview);
  const { appearance } = useLibrary();
  const component = slug ? findComponent(slug) : undefined;
  if (!component || !enabled) return children;
  const open = active === component.slug;
  const change = (next: boolean) => setActive(previous => next ? component.slug : previous === component.slug ? "" : previous);
  return <HoverCard.Root open={open} onOpenChange={change} openDelay={260} closeDelay={100}>
    <HoverCard.Trigger asChild onFocus={event => { if (event.currentTarget.matches(":focus-visible")) change(true); }} onBlur={() => change(false)} onClick={() => change(false)}>{children}</HoverCard.Trigger>
    {open && <HoverCard.Portal><HoverCard.Content className={`docs-link-preview tile-${component.slug}`} side="right" align="center" sideOffset={16} collisionPadding={12} aria-hidden="true" onEscapeKeyDown={() => change(false)}>
      <div className="component-thumbnail" inert>
        <div className="thumbnail-inner"><Suspense fallback={<div className="docs-preview-loading">Preparing preview...</div>}><ComponentDemo slug={component.slug} appearance={component.collection ?? appearance} thumbnail /></Suspense></div>
      </div>
      <div className="docs-preview-caption"><strong>{component.name}</strong><span>{component.category}</span></div>
    </HoverCard.Content></HoverCard.Portal>}
  </HoverCard.Root>;
}
