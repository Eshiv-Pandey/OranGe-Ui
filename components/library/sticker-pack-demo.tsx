"use client";
import Link from "next/link";
import { useState } from "react";
import { Sticker, STICKERS, type StickerName } from "../ui/sticker-pack";
import type { Appearance } from "../ui/appearance";
import "../../styles/sticker-gallery.css";

export function StickerPackDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const [name, setName] = useState<StickerName>("orbit-snail");
  if (thumbnail) return <div className="sticker-pack-thumbnail">{["orbit-snail", "miso-moth", "checkered-daisy", "peach-planet"].map((item, i) => <Sticker key={item} name={item as StickerName} size={80} rotate={i % 2 ? 9 : -9} decorative />)}</div>;
  return <div className="sticker-pack-demo"><Sticker appearance={appearance} name={name} size={200} finish="sharp" interactive /><label>Choose a sticker<select value={name} onChange={event => setName(event.target.value as StickerName)}>{STICKERS.map(sticker => <option key={sticker.name} value={sticker.name}>{sticker.title}</option>)}</select></label><Link href="/stickers">Explore all 70 stickers</Link></div>;
}
