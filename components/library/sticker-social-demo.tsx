"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { StickerSocialIcons, SOCIAL_STICKER_PRESETS } from "../ui/sticker-social-icons";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { ShaderCheck } from "./shader-demo-controls";
import "../../styles/sticker-social-demo.css";

const accents: Record<string, string> = { github: "#ecd899", linkedin: "#67acff", medium: "#f18bdd", leetcode: "#f6ce61", x: "#b6bac4", instagram: "#ff90c9", discord: "#adb8ff", youtube: "#ff8076", reddit: "#ffab7c", dribbble: "#ffa8cc", behance: "#83a9ff", twitch: "#c3a3ff", bluesky: "#8ed2ff", telegram: "#89dbe9", pinterest: "#ff94a6", substack: "#ffad73", spotify: "#92dba0", threads: "#ded3bc", whatsapp: "#89d4ab", mastodon: "#c7b4ff", facebook: "#93bafa", stackoverflow: "#f3c181", dev: "#d4e0c4", hashnode: "#aac0ff", patreon: "#f9b0a8" };

export function StickerSocialDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [cards, setCards] = useState(true), [labels, setLabels] = useState(true);
  const profiles = SOCIAL_STICKER_PRESETS.slice(0, thumbnail ? 6 : undefined).map(preset => ({ ...preset, href: `https://example.com/${preset.appearance}`, hoverCard: cards ? {
    name: "Sample Studio", handle: "@sample.studio", platform: preset.name, badge: "Sample profile",
    bio: preset.appearance === "substack" ? "A notebook about design, small projects and the ideas behind them." : "Making thoughtful things for the web. Sharing the sketches, stories and little experiments along the way.",
    location: "Your city, Anywhere", accent: accents[preset.appearance], stats: [{ value: "12", label: "Notes" }, { value: "04", label: "Projects" }],
  } : undefined }));
  const preview = <div className="sticker-social-demo"><StickerSocialIcons profiles={profiles} appearance={appearance} showLabels={labels} />{!thumbnail && <p>Hover or focus a sticker to meet the sample profile.</p>}</div>;
  return thumbnail ? preview : <div className="creative-demo"><CreativeWorkbench preview={preview}><ShaderCheck label="Profile hover cards" value={cards} onChange={setCards} /><ShaderCheck label="Show platform labels" value={labels} onChange={setLabels} /></CreativeWorkbench></div>;
}
