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
  const [seed, setSeed] = useState("sunday-studio"), [hair, setHair] = useState<HumanHair | "seeded">("sweep"), [expression, setExpression] = useState<HumanExpression | "seeded">("calm");
  const [skin, setSkin] = useState("#fffdf7"), [ink, setInk] = useState("#101114"), [accent, setAccent] = useState("#ffb83f"), [glasses, setGlasses] = useState(false), [sticker, setSticker] = useState(true), [interactive, setInteractive] = useState(true), [exporting, setExporting] = useState(false), [feedback, setFeedback] = useState("");
  const current = useRef<HTMLDivElement>(null), theme = useCreativeTheme();
  const avatar = <HumanAvatar appearance={appearance} seed={seed} hair={hair === "seeded" ? undefined : hair} expression={expression === "seeded" ? undefined : expression} skinTone={skin} hairColor={ink} accentColor={accent} glasses={glasses} sticker={sticker} interactive={interactive} size={thumbnail ? 155 : 320} />;
  function randomize() {
    const random = Math.random();
    setSeed(`friend-${Math.random().toString(36).slice(2, 8)}`);
    setHair(HUMAN_HAIR[(Math.max(0, HUMAN_HAIR.indexOf(hair as HumanHair)) + 1 + Math.floor(random * (HUMAN_HAIR.length - 1))) % HUMAN_HAIR.length]);
    setExpression(HUMAN_EXPRESSIONS[Math.floor(Math.random() * HUMAN_EXPRESSIONS.length)]);
    setAccent(["#ff754f", "#51b771", "#ffbe41", "#709ede", "#dd82c5", "#ee5057"][Math.floor(Math.random() * 6)]);
    setGlasses(Math.random() > .8);
    setFeedback("A new face, ready to make your own.");
  }
  const preview = <div className="human-avatar-board"><div className="human-avatar-hero" ref={current}>{avatar}</div>{!thumbnail && <button type="button" className="creative-button human-randomize" onClick={randomize}><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="2.5" width="15" height="15" rx="3" /><path d="M6 6h.01M14 6h.01M10 10h.01M6 14h.01M14 14h.01" strokeWidth="2.8" strokeLinecap="round" /></svg>Randomize avatar</button>}<div className="human-avatar-cast" aria-label="Human avatar presets">{["fern", "kai", "ren", "jules", "ash", "luca"].map((name, index) => <button type="button" key={name} aria-label={`Try ${name} avatar`} onClick={() => { setSeed(name); setHair(HUMAN_HAIR[index % HUMAN_HAIR.length]); setExpression(HUMAN_EXPRESSIONS[index % HUMAN_EXPRESSIONS.length]); setAccent(["#ff754f", "#51b771", "#ffbe41", "#709ede", "#dd82c5", "#ee5057"][index]); }}><HumanAvatar seed={name} hair={HUMAN_HAIR[index % HUMAN_HAIR.length]} expression={HUMAN_EXPRESSIONS[index % HUMAN_EXPRESSIONS.length]} size={thumbnail ? 37 : 72} accentColor={["#ff754f", "#51b771", "#ffbe41", "#709ede", "#dd82c5", "#ee5057"][index]} interactive={false} /></button>)}</div></div>;
  async function download(format: "svg" | "png") { const svg = current.current?.querySelector("svg"); if (!svg) return; setExporting(true); setFeedback(""); try { const markup = await standaloneCreativeSvg(svg); downloadCreativeBlob(format === "svg" ? new Blob([markup], { type: "image/svg+xml" }) : await creativeSvgPng(markup, 768, 768), `human-avatar.${format}`); setFeedback(`${format.toUpperCase()} prepared.`); } catch { setFeedback("The portrait could not be exported. Try again."); } finally { setExporting(false); } }
  return <div className={`creative-surface reference-demo ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <label>Avatar seed<input value={seed} onChange={(event) => { setSeed(event.target.value); setHair("seeded"); setExpression("seeded"); }} /></label><Select label="Hair" value={hair} options={["seeded", ...HUMAN_HAIR]} onChange={setHair} /><Select label="Expression" value={expression} options={["seeded", ...HUMAN_EXPRESSIONS]} onChange={setExpression} />
    <Color label="Skin tone" value={skin} onChange={setSkin} /><Color label="Hair color" value={ink} onChange={setInk} /><Color label="Accent color" value={accent} onChange={setAccent} /><Check label="Glasses" value={glasses} onChange={setGlasses} /><Check label="Sticker outline" value={sticker} onChange={setSticker} /><Check label="Follow the pointer" value={interactive} onChange={setInteractive} />
    <div className="creative-actions creative-wide"><button type="button" className="creative-button" disabled={exporting} onClick={() => void download("svg")}>Download SVG</button><button type="button" className="creative-button" disabled={exporting} onClick={() => void download("png")}>Download PNG</button></div>{feedback && <p className="creative-feedback creative-wide" role="status">{feedback}</p>}
  </CreativeWorkbench>}</div>;
}
