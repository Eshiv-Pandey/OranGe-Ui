"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { PaperCut, type PaperCutPalette } from "../ui/paper-cut";
import { Button } from "../ui/button";
import { CustomizerRange, CustomizerSelect, CustomizerToggle } from "../ui/artwork-customizer";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import "../../styles/paper-cut-demo.css";

export default function PaperCutDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const [palette, setPalette] = useState<PaperCutPalette>("ocean");
  const [seed, setSeed] = useState(7), [layers, setLayers] = useState(8), [depth, setDepth] = useState(1);
  const [strength, setStrength] = useState(1), [ratio, setRatio] = useState("1.55");
  const [interactive, setInteractive] = useState(true), [paused, setPaused] = useState(false);
  if (thumbnail) return <div className="paper-cut-thumbnail"><PaperCut interactive={false} appearance={appearance} /></div>;
  const reset = () => { setPalette("ocean"); setSeed(7); setLayers(8); setDepth(1); setStrength(1); setRatio("1.55"); setInteractive(true); setPaused(false); };
  return <section className="paper-cut-demo artwork-customizer" data-appearance={appearance}>
    <div className="artwork-customizer-preview paper-cut-demo-preview"><div className="paper-cut-demo-art"><PaperCut palette={palette} seed={seed} layers={layers} depth={depth} strength={strength} aspectRatio={Number(ratio)} interactive={interactive} paused={paused} appearance={appearance} /></div>
      <p className="paper-cut-demo-caption">Move across the layers to shift the perspective. Focus the artwork to explore with arrow keys.</p></div>
    <WorkbenchInspector><div className="artwork-customizer-settings paper-cut-demo-controls">
      <div className="paper-cut-demo-actions"><Button appearance="polished" onClick={() => setSeed(value => value + 1)}>New contours</Button><Button appearance="polished" variant="secondary" onClick={reset}>Reset artwork</Button></div>
      <CustomizerSelect label="Paper palette" value={palette} options={[{ value: "ocean", label: "Ocean blue" }, { value: "citrus", label: "Warm citrus" }, { value: "graphite", label: "Soft graphite" }]} onChange={value => setPalette(value as PaperCutPalette)} />
      <CustomizerSelect label="Composition" value={ratio} options={[{ value: "1.55", label: "Landscape" }, { value: "2.5", label: "Wide banner" }, { value: "1", label: "Square" }, { value: ".75", label: "Portrait" }]} onChange={setRatio} />
      <CustomizerRange label="Paper layers" min={5} max={10} step={1} value={layers} onChange={setLayers} />
      <CustomizerRange label="Paper depth" min={0} max={2} step={.1} value={depth} onChange={setDepth} />
      <CustomizerRange label="Cursor strength" min={0} max={2} step={.1} value={strength} onChange={setStrength} />
      <div className="artwork-customizer-grid"><CustomizerToggle label="Cursor interaction" checked={interactive} onChange={setInteractive} /><CustomizerToggle label="Pause motion" checked={paused} onChange={setPaused} /></div>
      <p className="paper-cut-demo-note">The artwork remains visible without JavaScript. Motion respects your system preference and stops when the layers settle.</p>
    </div></WorkbenchInspector>
  </section>;
}
