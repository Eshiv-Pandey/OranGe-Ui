"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, usePropPreference, clamp, type CreativeTheme } from "./creative-surface";
import { transliterateToHindi } from "./desi-transliteration";
import { standaloneCreativeSvg, creativeSvgPng, downloadCreativeBlob } from "./creative-export";
import { CreativeIcon } from "./creative-icons";
import "../../styles/desi-text.css";

export type StyledTextFont = "hindi" | "hinglish";
export type StyledTextProps = {
  text?: string; onTextChange?: (text: string) => void; font?: StyledTextFont; transliterate?: boolean;
  fontSize?: number; fill?: string; shadowColor?: string; shadowDistance?: number; outline?: number; outlineColor?: string;
  pattern?: "none" | "mandala" | "paisley"; background?: string; editable?: boolean; showControls?: boolean;
  onChange?: (config: StyledTextConfig) => void; theme?: CreativeTheme; appearance?: Appearance; className?: string; fontUrl?: string;
};
export type StyledTextConfig = { font: StyledTextFont; fontSize: number; fill: string; shadowColor: string; shadowDistance: number; outline: number; outlineColor: string; pattern: "none" | "mandala" | "paisley"; background: string };
type TextLayout = { source: string; lines: string[]; fontSize: number };
function graphemes(value: string) {
  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: "grapheme" }) => { segment(value: string): Iterable<{ segment: string }> };
  }).Segmenter;
  if (Segmenter) return [...new Segmenter("hi", { granularity: "grapheme" }).segment(value)].map((part) => part.segment);
  return Array.from(value);
}
export function layoutStyledText(text: string, size: number, measure: (text: string) => number = (value) => graphemes(value).length * size * 0.66): TextLayout {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let current = "";
    for (const token of paragraph.split(/(\s+)/)) {
      if (!token) continue;
      if (current && measure(current + token) > 644) { lines.push(current.trimEnd()); current = token.trimStart(); }
      else current += token;
      if (measure(current) > 644) {
        let chunk = "";
        for (const character of graphemes(current)) {
          if (chunk && measure(chunk + character) > 644) { lines.push(chunk); chunk = ""; }
          chunk += character;
        }
        current = chunk;
      }
    }
    lines.push(current.trimEnd());
  }
  return { source: text, lines, fontSize: size };
}

function DisplayPattern({ pattern, width, height, color }: { pattern: "mandala" | "paisley"; width: number; height: number; color: string }) {
  const petals: ReactNode[] = [];
  for (let index = 0; index < 16; index++) petals.push(<g key={index} transform={"rotate(" + index * 22.5 + ")"}><path d="M0-26Q-37-74 0-117Q37-74 0-26Z" /><path d="M0-140Q-24-167 0-193Q24-167 0-140Z" /><path d="M0-208q-13-17 0-32q13 15 0 32" /></g>);
  return <g fill="none" stroke={color} strokeWidth="1.7" opacity=".53" transform={"translate(" + width / 2 + " " + height / 2 + ")"}>
    {pattern === "mandala" ? <><circle r="24" /><circle r="126" /><circle r="201" />{petals}</> : Array.from({ length: 14 }, (_, index) => <path key={index} d="M0-30C-70-90-58-174-5-145C45-118 25-78 0-30ZM-6-50q-41-64 2-69q33 9-2 69" transform={"rotate(" + index * 360 / 14 + ")"} />)}
    <circle r="247" />{[0, 1, 2, 3].map((index) => <g key={index} transform={"rotate(" + index * 90 + ") translate(235 160) scale(.42)"}>{petals}</g>)}
  </g>;
}

export function StyledText({ text, onTextChange, font = "hindi", transliterate = false, fontSize = 88, fill, shadowColor, shadowDistance, outline = 0, outlineColor, pattern, background, editable = true, showControls = true, onChange, theme = "auto", appearance = "polished", className, fontUrl }: StyledTextProps) {
  const [input, setInput] = useState(font === "hindi" ? "रंगों की दुनिया" : "good वक्त"), source = text ?? input;
  const [roman, setRoman] = usePropPreference(transliterate), [chosenFont, setFont] = usePropPreference(font), [size, setSize] = usePropPreference(fontSize);
  const [ink, setInk] = usePropPreference(fill ?? (font === "hindi" ? "#17151b" : "#c3dbf0"));
  const [shadow, setShadow] = usePropPreference(shadowColor ?? "#180e17"), [offset, setOffset] = usePropPreference(shadowDistance ?? (font === "hindi" ? 0 : 8));
  const [stroke, setStroke] = usePropPreference(outline), [strokeColor, setStrokeColor] = usePropPreference(outlineColor ?? "#180e17");
  const [decoration, setDecoration] = usePropPreference(pattern ?? (font === "hindi" ? "none" : "mandala")), [paper, setPaper] = usePropPreference(background ?? (font === "hindi" ? "#fffefb" : "#4d2d36"));
  const output = roman ? transliterateToHindi(source) : source, resolved = useCreativeTheme(theme), svg = useRef<SVGSVGElement>(null), root = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  const [measured, setMeasured] = useState<TextLayout>(() => layoutStyledText(output, size)), [message, setMessage] = useState(""), id = useId();
  const family = chosenFont === "hindi" ? "Orange Hindi Display" : "Orange Hinglish Display", weight = chosenFont === "hindi" ? 400 : 800;
  useEffect(() => {
    const controller = new AbortController(); abort.current = controller;
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.load(weight + " " + clamp(size, 16, 160) + 'px "' + family + '"').then(() => {
      if (cancelled) return;
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return;
      context.font = weight + " " + size + 'px "' + family + '"';
      setMeasured(layoutStyledText(output, size, (value) => context.measureText(value).width));
    });
    return () => { cancelled = true; };
  }, [output, size, family, weight]);
  const layout = measured.source === output && measured.fontSize === size ? measured : layoutStyledText(output, size);
  const lineHeight = size * 1.42, height = Math.max(chosenFont === "hindi" ? 410 : 390, layout.lines.length * lineHeight + 150), top = (height - (layout.lines.length - 1) * lineHeight) / 2 + size * 0.3;
  const changed = (patch: Partial<StyledTextConfig>) => onChange?.({ font: chosenFont, fontSize: size, fill: ink, shadowColor: shadow, shadowDistance: offset, outline: stroke, outlineColor: strokeColor, pattern: decoration, background: paper, ...patch });
  const exportImage = async (kind: "svg" | "png") => {
    if (!svg.current) return;
    setMessage("Preparing your lettering...");
    try {
      const copy = svg.current.cloneNode(true) as SVGSVGElement;
      const token = getComputedStyle(root.current!).getPropertyValue(chosenFont === "hindi" ? "--font-hindi-display" : "--font-hinglish-display").trim() || family;
      copy.querySelectorAll("text").forEach((node) => node.setAttribute("font-family", token));
      const markup = await standaloneCreativeSvg(copy, { signal: abort.current?.signal, fonts: [{ family, url: fontUrl || (chosenFont === "hindi" ? "/fonts/desi/yatra-one.woff2" : "/fonts/desi/baloo-2.woff2") }] });
      const blob = kind === "svg" ? new Blob([markup], { type: "image/svg+xml" }) : await creativeSvgPng(markup, 720, Math.round(height));
      if (abort.current?.signal.aborted) return;
      downloadCreativeBlob(blob, "orange-lettering." + kind); setMessage("Your " + kind.toUpperCase() + " is ready.");
    } catch (error) { if ((error as DOMException).name !== "AbortError") setMessage((error as Error).message); }
  };
  return <div ref={root} className={cn("creative-surface styled-text", className)} data-theme={resolved} data-appearance={appearance}>
    <svg ref={svg} className="styled-text-output" viewBox={"0 0 720 " + height} role="img" aria-label={output || "Empty lettering canvas"}><rect width="720" height={height} fill={paper} />{decoration !== "none" && <DisplayPattern pattern={decoration} width={720} height={height} color={chosenFont === "hindi" ? "#c28b54" : "#d89998"} />}
      {layout.lines.map((line, index) => <g key={index} fontFamily={chosenFont === "hindi" ? "var(--font-hindi-display)" : "var(--font-hinglish-display)"} fontWeight={weight} fontSize={layout.fontSize} textAnchor="middle">
        {offset > 0 && <text x={360 + offset} y={top + index * lineHeight + offset} fill={shadow} stroke={shadow} strokeWidth={stroke + 1} paintOrder="stroke">{line}</text>}
        <text x="360" y={top + index * lineHeight} fill={ink} stroke={strokeColor} strokeWidth={stroke} paintOrder="stroke" strokeLinejoin="round">{line}</text>
      </g>)}
    </svg>
    {editable && <label className="styled-text-input" htmlFor={id}>Your words<textarea id={id} value={source} rows={2} placeholder={roman ? "Try namaste" : "Type in Hindi, English, or both"} onChange={(event) => { if (text === undefined) setInput(event.target.value); onTextChange?.(event.target.value); }} /></label>}
    <div className="styled-text-actions"><label><input type="checkbox" checked={roman} onChange={(event) => setRoman(event.target.checked)} />Roman to Hindi</label><div className="creative-actions"><button type="button" className="creative-button" onClick={() => void exportImage("png")}><CreativeIcon name="download" width="14" height="14" />PNG</button><button type="button" className="creative-button" onClick={() => void exportImage("svg")}>SVG</button></div></div>
    {showControls && <details className="creative-editor"><summary>Style your lettering</summary><div className="creative-controls">
      <label>Display font<select value={chosenFont} onChange={(event) => { setFont(event.target.value as StyledTextFont); changed({ font: event.target.value as StyledTextFont }); }}><option value="hindi">Hindi: Yatra One</option><option value="hinglish">Hinglish: Baloo 2</option></select></label>
      <label>Text size<input type="range" min="24" max="144" value={size} onChange={(event) => { setSize(Number(event.target.value)); changed({ fontSize: Number(event.target.value) }); }} /></label>
      <label>Fill color<input type="color" value={ink} onChange={(event) => { setInk(event.target.value); changed({ fill: event.target.value }); }} /></label>
      <label>Shadow color<input type="color" value={shadow} onChange={(event) => { setShadow(event.target.value); changed({ shadowColor: event.target.value }); }} /></label>
      <label>Shadow distance<input type="range" min="0" max="20" value={offset} onChange={(event) => { setOffset(Number(event.target.value)); changed({ shadowDistance: Number(event.target.value) }); }} /></label>
      <label>Outline width<input type="range" min="0" max="6" step=".5" value={stroke} onChange={(event) => { setStroke(Number(event.target.value)); changed({ outline: Number(event.target.value) }); }} /></label>
      <label>Outline color<input type="color" value={strokeColor} onChange={(event) => { setStrokeColor(event.target.value); changed({ outlineColor: event.target.value }); }} /></label>
      <label>Pattern<select value={decoration} onChange={(event) => { setDecoration(event.target.value as StyledTextConfig["pattern"]); changed({ pattern: event.target.value as StyledTextConfig["pattern"] }); }}><option value="none">None</option><option value="mandala">Mandala</option><option value="paisley">Paisley</option></select></label>
      <label>Background color<input type="color" value={paper} onChange={(event) => { setPaper(event.target.value); changed({ background: event.target.value }); }} /></label>
    </div></details>}
    {message && <p className="creative-feedback" role="status">{message}</p>}
  </div>;
}
