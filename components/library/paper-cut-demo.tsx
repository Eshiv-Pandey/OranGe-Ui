"use client";
import { useState } from "react";
import Link from "next/link";
import type { Appearance } from "../ui/appearance";
import { PaperCut, type PaperCutPalette } from "../ui/paper-cut";
import { Button } from "../ui/button";
import { CustomizerRange, CustomizerSelect, CustomizerToggle } from "../ui/artwork-customizer";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import "../../styles/paper-cut-demo.css";

export default function PaperCutDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const [palette, setPalette] = useState<PaperCutPalette>("ocean");
  const [seed, setSeed] = useState(7), [layers, setLayers] = useState(8), [depth, setDepth] = useState(.8);
  const [strength, setStrength] = useState(.7), [composition, setComposition] = useState("banner");
  const [heading, setHeading] = useState("Your next chapter."), [description, setDescription] = useState("A layered paper background for your portfolio, collection or announcement.");
  const [interactive, setInteractive] = useState(true), [paused, setPaused] = useState(false);
  if (thumbnail) return <div className="paper-cut-thumbnail"><PaperCut interactive={false} appearance={appearance} aspectRatio={1.55}><div className="paper-cut-demo-copy"><h2>Your next chapter.</h2></div></PaperCut></div>;
  const ratio = composition === "banner" ? 2 : composition === "card" ? 1 : 1.55;
  const reset = () => { setPalette("ocean"); setSeed(7); setLayers(8); setDepth(.8); setStrength(.7); setComposition("banner"); setHeading("Your next chapter."); setDescription("A layered paper background for your portfolio, collection or announcement."); setInteractive(true); setPaused(false); };
  return <section className="paper-cut-demo artwork-customizer" data-appearance={appearance}>
    <div className="artwork-customizer-preview paper-cut-demo-preview"><div className="paper-cut-demo-art" data-composition={composition}><PaperCut palette={palette} seed={seed} layers={layers} depth={depth} strength={strength} aspectRatio={ratio} interactive={interactive} paused={paused} appearance={appearance}>
      {composition !== "artwork" && <div className="paper-cut-demo-copy"><h2>{heading}</h2><p>{description}</p><Link href="/components">Explore components<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg></Link></div>}
    </PaperCut></div>
      <p className="paper-cut-demo-caption">Try it as a banner or card. Move over the paper to see its depth.</p></div>
    <WorkbenchInspector><div className="artwork-customizer-settings paper-cut-demo-controls">
      <div className="paper-cut-demo-actions"><Button appearance="polished" onClick={() => setSeed(value => value + 1)}>New contours</Button><Button appearance="polished" variant="secondary" onClick={reset}>Reset artwork</Button></div>
      <CustomizerSelect label="Paper palette" value={palette} options={[{ value: "ocean", label: "Ocean blue" }, { value: "citrus", label: "Warm citrus" }, { value: "graphite", label: "Soft graphite" }]} onChange={value => setPalette(value as PaperCutPalette)} />
      <CustomizerSelect label="Composition" value={composition} options={[{ value: "banner", label: "Content banner" }, { value: "card", label: "Feature card" }, { value: "artwork", label: "Artwork only" }]} onChange={setComposition} />
      {composition !== "artwork" && <><label className="paper-cut-demo-field">Heading<input value={heading} maxLength={70} onChange={event => setHeading(event.target.value)} /></label><label className="paper-cut-demo-field">Description<textarea value={description} maxLength={160} rows={2} onChange={event => setDescription(event.target.value)} /></label></>}
      <CustomizerRange label="Paper layers" min={5} max={10} step={1} value={layers} onChange={setLayers} />
      <CustomizerRange label="Paper depth" min={0} max={2} step={.1} value={depth} onChange={setDepth} />
      <CustomizerRange label="Cursor strength" min={0} max={2} step={.1} value={strength} onChange={setStrength} />
      <div className="artwork-customizer-grid"><CustomizerToggle label="Cursor interaction" checked={interactive} onChange={setInteractive} /><CustomizerToggle label="Pause motion" checked={paused} onChange={setPaused} /></div>
    </div></WorkbenchInspector>
  </section>;
}
