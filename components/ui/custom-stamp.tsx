"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, usePropPreference, clamp, type CreativeTheme } from "./creative-surface";
import { CITRUS_ART } from "./creative-art";
import { CreativeIcon } from "./creative-icons";
import { creativeFileData, standaloneCreativeSvg, creativeSvgPng, downloadCreativeBlob } from "./creative-export";
import "../../styles/creative-stamps.css";

export type StampColors = { background: string; border: string; text: string };
export type StampPerforation = "round" | "square" | { shape: "round" | "square"; size: number };
export type StampConfig = {
  image: string; title: string; subtitle: string; value: string; year: string; country: string;
  colors: StampColors; font: "sans" | "serif" | "mono"; perforation: StampPerforation;
  imagePosition: { x: number; y: number }; imageZoom: number; postmark: boolean;
};
export type CustomStampProps = {
  image?: string; title?: string; subtitle?: string; value?: string; year?: string | number; country?: string;
  colors?: Partial<StampColors>; font?: StampConfig["font"]; perforation?: StampPerforation;
  editable?: boolean; onChange?: (config: StampConfig) => void; showEditor?: boolean; config?: StampConfig;
  postmark?: boolean; sheet?: boolean; background?: string; theme?: CreativeTheme; appearance?: Appearance; className?: string;
};
const fontFamily = { sans: "oRange Geist, sans-serif", serif: "Georgia, serif", mono: "Consolas, monospace" };
export const DEFAULT_STAMP: StampConfig = {
  image: CITRUS_ART, title: "CITRUS CLUB", subtitle: "A LITTLE SUNSHINE", value: "50", year: "2026", country: "INDIA",
  colors: { background: "#fffdf3", border: "#fffef9", text: "#294d3b" }, font: "sans", perforation: "round", imagePosition: { x: 0, y: 0 }, imageZoom: 1, postmark: false,
};

function StampArtwork({ config, id }: { config: StampConfig; id: string }) {
  const shape = typeof config.perforation === "string" ? config.perforation : config.perforation.shape;
  const radius = typeof config.perforation === "string" ? 6 : clamp(config.perforation.size, 3, 10), step = radius * 2.7;
  const holes = [...Array.from({ length: Math.ceil(240 / step) }, (_, index) => [step / 2 + index * step, 0]), ...Array.from({ length: Math.ceil(240 / step) }, (_, index) => [step / 2 + index * step, 360]), ...Array.from({ length: Math.ceil(360 / step) }, (_, index) => [0, step / 2 + index * step]), ...Array.from({ length: Math.ceil(360 / step) }, (_, index) => [240, step / 2 + index * step])];
  return <g>
    <defs><mask id={id + "-edge"}><rect width="240" height="360" fill="#fff" />{holes.map(([x, y], index) => shape === "round" ? <circle key={index} cx={x} cy={y} r={radius} fill="#000" /> : <rect key={index} x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} fill="#000" />)}</mask><clipPath id={id + "-image"}><rect x="17" y="17" width="206" height="251" /></clipPath><pattern id={id + "-paper"} width="37" height="43" patternUnits="userSpaceOnUse"><path d="M2 4h.8m11 17h.7m14-9h.8M6 35h.7m22 4h.8" stroke="#6b5833" strokeWidth=".5" opacity=".15" /></pattern></defs>
    <g mask={"url(#" + id + "-edge)"}>
      <rect width="240" height="360" fill={config.colors.border} /><rect x="11" y="11" width="218" height="338" fill={config.colors.background} /><rect width="240" height="360" fill={"url(#" + id + "-paper)"} />
      <image href={config.image} x={17 - (206 * config.imageZoom - 206) / 2 + config.imagePosition.x * 0.6} y={17 - (251 * config.imageZoom - 251) / 2 + config.imagePosition.y * 0.6} width={206 * config.imageZoom} height={251 * config.imageZoom} preserveAspectRatio="xMidYMid slice" clipPath={"url(#" + id + "-image)"} />
      <g fill={config.colors.text} fontFamily={fontFamily[config.font]}><text x="18" y="294" fontSize="17" fontWeight="800" textLength={config.title.length > 15 ? 150 : undefined} lengthAdjust="spacingAndGlyphs">{config.title}</text><text x="18" y="310" fontSize="9" letterSpacing=".4">{config.subtitle}</text><text x="18" y="339" fontSize="9">{config.country + " / " + config.year}</text><text x="220" y="304" textAnchor="end" fontSize="34" fontWeight="800">{config.value}</text></g>
      {config.postmark && <g transform="translate(155 97) rotate(-18)" fill="none" stroke="#37423b" opacity=".62"><circle r="40" strokeWidth="1.5" /><circle r="34" /><path d="M-65 5q22-9 45 0t45 0t45 0M-65 15q22-9 45 0t45 0t45 0M-65 25q22-9 45 0t45 0t45 0" strokeWidth="1.5" /><text y="-13" textAnchor="middle" fill="#37423b" stroke="none" fontSize="9" fontFamily="sans-serif">ORANGE POST</text><text y="4" textAnchor="middle" fill="#37423b" stroke="none" fontSize="9">{config.year}</text></g>}
    </g>
  </g>;
}

export function CustomStamp({ image = DEFAULT_STAMP.image, title = DEFAULT_STAMP.title, subtitle = DEFAULT_STAMP.subtitle, value = DEFAULT_STAMP.value, year = DEFAULT_STAMP.year, country = DEFAULT_STAMP.country, colors, font = "sans", perforation = "round", editable = true, onChange, showEditor = false, config, postmark = false, sheet = false, background = "#579253", theme = "auto", appearance = "polished", className }: CustomStampProps) {
  const [local, setLocal] = useState<StampConfig>(() => ({ ...DEFAULT_STAMP, image, title, subtitle, value, year: String(year), country, colors: { ...DEFAULT_STAMP.colors, ...colors }, font, perforation, postmark }));
  const current = config ?? local, [isSheet, setSheet] = usePropPreference(sheet), resolved = useCreativeTheme(theme);
  const svg = useRef<SVGSVGElement>(null), id = useId().replace(/:/g, ""), [message, setMessage] = useState(""), controller = useRef<AbortController | null>(null);
  useEffect(() => { const active = new AbortController(); controller.current = active; return () => active.abort(); }, []);
  const update = (patch: Partial<StampConfig>) => { const next = { ...current, ...patch }; if (!config) setLocal(next); onChange?.(next); };
  const exportImage = async (kind: "svg" | "png") => {
    if (!svg.current) return;
    setMessage("Preparing your stamp...");
    try {
      const markup = await standaloneCreativeSvg(svg.current, { signal: controller.current?.signal, fonts: current.font === "sans" ? [{ family: "oRange Geist", url: "/fonts/geist-latin.woff2" }] : [] });
      const width = isSheet ? 992 : 480, height = isSheet ? 1472 : 720;
      const blob = kind === "svg" ? new Blob([markup], { type: "image/svg+xml" }) : await creativeSvgPng(markup, width, height);
      if (controller.current?.signal.aborted) return;
      downloadCreativeBlob(blob, "orange-" + (isSheet ? "stamp-sheet" : "stamp") + "." + kind); setMessage("Your " + kind.toUpperCase() + " is ready.");
    } catch (error) { if ((error as DOMException).name !== "AbortError") setMessage((error as Error).message); }
  };
  const perforationShape = typeof current.perforation === "string" ? current.perforation : current.perforation.shape;
  return <div className={cn("creative-surface custom-stamp", className)} data-theme={resolved} data-appearance={appearance}>
    <div className="custom-stamp-stage" style={{ "--stamp-stage": background } as CSSProperties}><svg ref={svg} viewBox={isSheet ? "0 0 496 736" : "0 0 240 360"} role="img" aria-label={current.title + " postage stamp"} className="custom-stamp-art">
      {isSheet ? [0, 1, 2, 3].map((index) => <g key={index} transform={"translate(" + index % 2 * 256 + " " + Math.floor(index / 2) * 376 + ")"}><StampArtwork config={current} id={id + index} /></g>) : <StampArtwork config={current} id={id} />}
    </svg></div>
    <div className="creative-actions stamp-export-actions"><button type="button" className="creative-button" onClick={() => void exportImage("png")}><CreativeIcon name="download" width="15" height="15" />PNG</button><button type="button" className="creative-button" onClick={() => void exportImage("svg")}>SVG</button><label><input type="checkbox" checked={isSheet} onChange={(event) => setSheet(event.target.checked)} /> Stamp sheet</label></div>
    {message && <p className="creative-feedback" role="status">{message}</p>}
    {editable && <details className="creative-editor" open={showEditor || undefined}><summary>Customize your stamp</summary><div className="creative-controls">
      <label>Title<input value={current.title} onChange={(event) => update({ title: event.target.value })} /></label><label>Subtitle<input value={current.subtitle} onChange={(event) => update({ subtitle: event.target.value })} /></label>
      <label>Value<input value={current.value} onChange={(event) => update({ value: event.target.value })} /></label><label>Year<input value={current.year} onChange={(event) => update({ year: event.target.value })} /></label><label>Country<input value={current.country} onChange={(event) => update({ country: event.target.value })} /></label>
      <label>Font<select value={current.font} onChange={(event) => update({ font: event.target.value as StampConfig["font"] })}><option value="sans">Studio sans</option><option value="serif">Classic serif</option><option value="mono">Typewriter</option></select></label>
      {(["background", "border", "text"] as const).map((key) => <label key={key}>{key + " color"}<input type="color" value={current.colors[key]} onChange={(event) => update({ colors: { ...current.colors, [key]: event.target.value } })} /></label>)}
      <label>Perforation<select value={perforationShape} onChange={(event) => update({ perforation: { shape: event.target.value as "round" | "square", size: typeof current.perforation === "string" ? 6 : current.perforation.size } })}><option value="round">Round</option><option value="square">Square</option></select></label>
      <label>Perforation size<input type="range" min="3" max="10" step="0.5" value={typeof current.perforation === "string" ? 6 : current.perforation.size} onChange={(event) => update({ perforation: { shape: perforationShape, size: Number(event.target.value) } })} /></label>
      <label>Image zoom<input type="range" min="1" max="3" step="0.05" value={current.imageZoom} onChange={(event) => update({ imageZoom: Number(event.target.value) })} /></label><label>Image horizontal position<input type="range" min="-100" max="100" value={current.imagePosition.x} onChange={(event) => update({ imagePosition: { ...current.imagePosition, x: Number(event.target.value) } })} /></label><label>Image vertical position<input type="range" min="-100" max="100" value={current.imagePosition.y} onChange={(event) => update({ imagePosition: { ...current.imagePosition, y: Number(event.target.value) } })} /></label>
      <label className="creative-check"><input type="checkbox" checked={current.postmark} onChange={(event) => update({ postmark: event.target.checked })} />Postmark</label>
      <label className="creative-wide">Upload your artwork<input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const data = await creativeFileData(file, controller.current?.signal); update({ image: data, imagePosition: { x: 0, y: 0 }, imageZoom: 1 }); } catch {} }} /></label>
    </div></details>}
  </div>;
}
