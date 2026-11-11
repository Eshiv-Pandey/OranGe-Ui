"use client";

import { useState } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { KEEPSAKE_PHOTOS, type KeepsakePhoto } from "./keepsake-photos";
import "../../styles/interaction-cards.css";

export type FocusCardsProps = AppearanceProps & { items?: readonly KeepsakePhoto[]; onSelect?: (item: KeepsakePhoto) => void; label?: string; theme?: CreativeTheme };
const DEFAULT_CARDS = KEEPSAKE_PHOTOS.slice(0, 3);
export function FocusCards({ items = DEFAULT_CARDS, onSelect, label = "Find your next escape", theme = "auto", appearance = "polished", className }: FocusCardsProps) {
  const [hovered, setHovered] = useState<string | null>(null), [focused, setFocused] = useState<string | null>(null), [selected, setSelected] = useState<string | null>(null);
  const active = hovered ?? focused ?? selected, resolved = useCreativeTheme(theme);
  return <div className={["creative-surface interaction-surface focus-cards", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} role="group" aria-label={label} onPointerLeave={() => setHovered(null)}>
    {items.length === 0 && <p className="ix-caption">Add images to build your focus collection.</p>}
    {items.map((item) => <button key={item.id} type="button" className="focus-card" data-muted={Boolean(active && active !== item.id)} aria-pressed={selected === item.id} onPointerEnter={() => setHovered(item.id)} onFocus={() => setFocused(item.id)} onBlur={() => setFocused(null)} onClick={() => { setSelected(selected === item.id ? null : item.id); onSelect?.(item); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={item.alt} draggable="false" /><span className="focus-card-copy"><strong>{item.title}</strong>{item.note && <span>{item.note}</span>}</span>
    </button>)}
  </div>;
}
