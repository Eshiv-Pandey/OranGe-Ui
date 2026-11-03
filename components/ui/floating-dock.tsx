"use client";

import { useRef, useState, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/interaction-controls.css";

export type FloatingDockItem = { id: string; label: string; icon: ReactNode; href?: string; disabled?: boolean };
export type FloatingDockProps = AppearanceProps & { items?: readonly FloatingDockItem[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void; magnification?: number; label?: string; theme?: CreativeTheme };
const DEFAULT_ITEMS: readonly FloatingDockItem[] = [
  { id: "home", label: "Home", icon: <InteractionIcon name="home" /> }, { id: "library", label: "Library", icon: <InteractionIcon name="grid" /> }, { id: "palette", label: "Palette", icon: <InteractionIcon name="palette" /> }, { id: "music", label: "Music", icon: <InteractionIcon name="music" /> }, { id: "display", label: "Display", icon: <InteractionIcon name="sun" /> },
];
export function FloatingDock({ items = DEFAULT_ITEMS, value, defaultValue, onValueChange, magnification = 1.65, label = "Workspace shortcuts", theme = "auto", appearance = "polished", className }: FloatingDockProps) {
  const [local, setLocal] = useState(defaultValue ?? items.find((item) => !item.disabled)?.id), [focus, setFocus] = useState(Math.max(0, items.findIndex((item) => !item.disabled)));
  const track = useRef<HTMLUListElement>(null), resolved = useCreativeTheme(theme), selected = value ?? local;
  function magnify(x?: number) {
    const root = track.current; if (!root) return; const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Array.from(root.children).forEach((child) => { const element = child as HTMLElement; const distance = x === undefined ? 1 : Math.min(1, Math.abs(x - (element.offsetLeft + element.offsetWidth / 2)) / 100), amount = x === undefined || reduced ? 0 : Math.cos(distance * Math.PI / 2); element.style.setProperty("--dock-scale", String(1 + amount * (bounded(magnification, 1, 2, 1.65) - 1))); element.style.setProperty("--dock-lift", `${amount * -8}px`); });
  }
  const activate = (item: FloatingDockItem) => { if (item.disabled) return; if (value === undefined) setLocal(item.id); onValueChange?.(item.id); };
  return <nav className={["creative-surface interaction-surface floating-dock", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label}>
    <ul ref={track} onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); magnify(event.clientX - rect.left); }} onPointerLeave={() => magnify()} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) magnify(); }} onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const enabled = items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0); if (!enabled.length) return;
      const position = Math.max(0, enabled.indexOf(focus)), index = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled[enabled.length - 1] : enabled[(position + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
      (track.current?.children[index]?.querySelector("button, a") as HTMLElement | null)?.focus();
    }}>
      {items.map((item, index) => { const content = <><span className="dock-icon" aria-hidden="true">{item.icon}</span><span className="dock-tooltip" aria-hidden="true">{item.label}</span><span className="dock-active-dot" aria-hidden="true" /></>; const shared = { className: "floating-dock-item", "aria-label": item.label, tabIndex: !item.disabled && index === focus ? 0 : -1, onFocus: () => { setFocus(index); const element = track.current?.children[index] as HTMLElement | undefined; if (element) magnify(element.offsetLeft + element.offsetWidth / 2); } };
        return <li key={item.id} data-active={selected === item.id}>{item.href && !item.disabled ? <a {...shared} href={item.href} aria-current={selected === item.id ? "page" : undefined} onClick={() => activate(item)}>{content}</a> : <button {...shared} type="button" disabled={item.disabled} aria-pressed={selected === item.id} onClick={() => activate(item)}>{content}</button>}</li>;
      })}
    </ul>
  </nav>;
}
