"use client";

import { useRef, useState, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { bounded } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/interaction-controls.css";

export type FloatingDockItem = { id: string; label: string; icon: ReactNode; href?: string; disabled?: boolean };
export type FloatingDockProps = AppearanceProps & { items?: readonly FloatingDockItem[]; value?: string; defaultValue?: string; onValueChange?: (id: string) => void; magnification?: number; label?: string; theme?: CreativeTheme };
const DEFAULT_ITEMS: readonly FloatingDockItem[] = [
  { id: "home", label: "Home", icon: <InteractionIcon name="home" /> },
  { id: "library", label: "Library", icon: <InteractionIcon name="grid" /> },
  { id: "palette", label: "Palette", icon: <InteractionIcon name="palette" /> },
  { id: "music", label: "Music", icon: <InteractionIcon name="music" /> },
  { id: "display", label: "Display", icon: <InteractionIcon name="sun" /> },
];

export function FloatingDock({ items = DEFAULT_ITEMS, value, defaultValue, onValueChange, magnification = 1.65, label = "Workspace shortcuts", theme = "auto", appearance = "polished", className }: FloatingDockProps) {
  const [local, setLocal] = useState(defaultValue ?? items.find((item) => !item.disabled)?.id);
  const [focus, setFocus] = useState(Math.max(0, items.findIndex((item) => !item.disabled)));
  const root = useRef<HTMLElement>(null), track = useRef<HTMLUListElement>(null);
  const pointer = useRef<number | null>(null), focused = useRef<number | null>(null);
  const springs = useRef<{ value: number; velocity: number }[]>([]);
  const resolved = useCreativeTheme(theme), selected = value ?? local;

  useMotionActivity(root, {
    onFrame: ({ delta }) => {
      const list = track.current;
      if (!list) return;
      const elements = Array.from(list.children) as HTMLElement[];
      const boxes = elements.map((element) => element.getBoundingClientRect());
      const base = Number.parseFloat(getComputedStyle(list).getPropertyValue("--dock-base")) || 52;
      const x = pointer.current ?? (focused.current === null ? null : (boxes[focused.current]?.left ?? 0) + (boxes[focused.current]?.width ?? 0) / 2);
      const dt = Math.min(delta / 1000, .025);
      elements.forEach((element, index) => {
        const distance = x === null || items[index]?.disabled ? 1 : Math.min(1, Math.abs(x - boxes[index].left - boxes[index].width / 2) / 135);
        const influence = (1 + Math.cos(distance * Math.PI)) / 2;
        const target = 1 + influence * (bounded(magnification, 1, 2, 1.65) - 1);
        const spring = springs.current[index] ??= { value: 1, velocity: 0 };
        spring.velocity += ((target - spring.value) * 260 - spring.velocity * 25) * dt;
        spring.value += spring.velocity * dt;
        // Grow the layout slot too, so enlarged neighbors never collide.
        element.style.setProperty("--dock-size", `${(base * spring.value).toFixed(2)}px`);
      });
    },
    onStatus: (status) => {
      if (status !== "reduced") return;
      springs.current = [];
      Array.from(track.current?.children ?? []).forEach((element) => (element as HTMLElement).style.removeProperty("--dock-size"));
    },
  });
  const activate = (item: FloatingDockItem) => { if (item.disabled) return; if (value === undefined) setLocal(item.id); onValueChange?.(item.id); };
  return <nav ref={root} className={["creative-surface interaction-surface floating-dock", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label}>
    <ul ref={track}
      onPointerMove={(event) => { if (event.pointerType !== "touch") pointer.current = event.clientX; }}
      onPointerLeave={() => { pointer.current = null; }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) focused.current = null; }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); pointer.current = null;
        const enabled = items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0);
        if (!enabled.length) return;
        const position = Math.max(0, enabled.indexOf(focus));
        const index = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled[enabled.length - 1] : enabled[(position + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
        (track.current?.children[index]?.querySelector("button, a") as HTMLElement | null)?.focus();
      }}>
      {items.map((item, index) => {
        const content = <><span className="dock-icon" aria-hidden="true">{item.icon}</span><span className="dock-tooltip" aria-hidden="true">{item.label}</span><span className="dock-active-dot" aria-hidden="true" /></>;
        const shared = { className: "floating-dock-item", "aria-label": item.label, tabIndex: !item.disabled && index === focus ? 0 : -1, onFocus: () => { setFocus(index); focused.current = index; } };
        return <li key={item.id} data-active={selected === item.id}>
          {item.href && !item.disabled ? <a {...shared} href={item.href} aria-current={selected === item.id ? "page" : undefined} onClick={() => activate(item)}>{content}</a> : <button {...shared} type="button" disabled={item.disabled} aria-pressed={selected === item.id} onClick={() => activate(item)}>{content}</button>}
        </li>;
      })}
    </ul>
  </nav>;
}
