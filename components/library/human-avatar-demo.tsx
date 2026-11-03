"use client";

import { useRef, useState } from "react";
import type { Appearance } from "../ui/appearance";
import { HumanAvatar, HUMAN_HAIR, HUMAN_EXPRESSIONS, type HumanHair, type HumanExpression } from "../ui/human-avatar";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { standaloneCreativeSvg, creativeSvgPng, downloadCreativeBlob } from "../ui/creative-export";
import { ShaderSelect as Select, ShaderColor as Color, ShaderCheck as Check } from "./shader-demo-controls";
import "../../styles/reference-demos.css";

export default function HumanAvatarDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [seed, setSeed] = useState("sunday-studio"), [hair, setHair] = useState<HumanHair | "seeded">("wave"), [expression, setExpression] = useState<HumanExpression | "seeded">("happy");
  const [skin, setSkin] = useState("#fff0dc"), [ink, setInk] = useState("#1c1c20"), [accent, setAccent] = useState("#ff7552"), [glasses, setGlasses] = useState(false), [sticker, setSticker] = useState(true), [interactive, setInteractive] = useState(true), [exporting, setExporting] = useState(false), [feedback, setFeedback] = useState("");
  const current = useRef<HTMLDivElement>(null), theme = useCreativeTheme();
  const avatar = <HumanAvatar appearance={appearance} seed={seed} hair={hair === "seeded" ? undefined : hair} expression={expression === "seeded" ? undefined : expression} skinTone={skin} hairColor={ink} accentColor={accent} glasses={glasses} sticker={sticker} interactive={interactive} size={thumbnail ? 155 : 235} />;
  const preview = <div className="human-avatar-board"><div className="human-avatar-hero" ref={current}>{avatar}</div><div className="human-avatar-cast" aria-label="Human avatar presets">{["fern", "kai", "ren", "jules", "ash", "luca"].map((name, index) => <button type="button" key={name} aria-label={`Try ${name} avatar`} onClick={() => { setSeed(name); setHair(HUMAN_HAIR[index % HUMAN_HAIR.length]); setExpression(HUMAN_EXPRESSIONS[index % HUMAN_EXPRESSIONS.length]); setAccent(["#ff7552", "#8fa97b", "#daaf4c", "#8daed3", "#c793c5", "#f1a36d"][index]); }}><HumanAvatar seed={name} hair={HUMAN_HAIR[index % HUMAN_HAIR.length]} expression={HUMAN_EXPRESSIONS[index % HUMAN_EXPRESSIONS.length]} size={thumbnail ? 37 : 57} accentColor={["#ff7552", "#8fa97b", "#daaf4c", "#8daed3", "#c793c5", "#f1a36d"][index]} interactive={false} /></button>)}</div></div>;
  async function download(format: "svg" | "png") { const svg = current.current?.querySelector("svg"); if (!svg) return; setExporting(true); setFeedback(""); try { const markup = await standaloneCreativeSvg(svg); downloadCreativeBlob(format === "svg" ? new Blob([markup], { type: "image/svg+xml" }) : await creativeSvgPng(markup, 768, 768), `human-avatar.${format}`); setFeedback(`${format.toUpperCase()} prepared.`); } catch { setFeedback("The portrait could not be exported. Try again."); } finally { setExporting(false); } }
  return <div className={`creative-surface reference-demo ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <label>Avatar seed<input value={seed} onChange={(event) => { setSeed(event.target.value); setHair("seeded"); setExpression("seeded"); }} /></label><Select label="Hair" value={hair} options={["seeded", ...HUMAN_HAIR]} onChange={setHair} /><Select label="Expression" value={expression} options={["seeded", ...HUMAN_EXPRESSIONS]} onChange={setExpression} />
    <Color label="Skin tone" value={skin} onChange={setSkin} /><Color label="Hair color" value={ink} onChange={setInk} /><Color label="Accent color" value={accent} onChange={setAccent} /><Check label="Glasses" value={glasses} onChange={setGlasses} /><Check label="Sticker outline" value={sticker} onChange={setSticker} /><Check label="Follow the pointer" value={interactive} onChange={setInteractive} />
    <div className="creative-actions creative-wide"><button type="button" className="creative-button" disabled={exporting} onClick={() => void download("svg")}>Download SVG</button><button type="button" className="creative-button" disabled={exporting} onClick={() => void download("png")}>Download PNG</button></div>{feedback && <p className="creative-feedback creative-wide" role="status">{feedback}</p>}
  </CreativeWorkbench>}</div>;
}
