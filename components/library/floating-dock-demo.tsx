"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { FloatingDock } from "../ui/floating-dock";
import { ShaderCheck, ShaderRange, ShaderSelect } from "./shader-demo-controls";
import "../../styles/floating-dock-demo.css";

const VIEWS: Record<string, { title: string; description: string }> = {
  home: { title: "A place for your ideas.", description: "A compact dock for the places you visit every day." },
  library: { title: "Everything within reach.", description: "Move along the icons. The closest shortcut rises to meet you." },
  palette: { title: "Find your next color.", description: "Buttons, links and your own icons share the same responsive dock." },
  music: { title: "Stay in the flow.", description: "A short launch bounce gives each selection a little feedback." },
  display: { title: "Make yourself at home.", description: "Tab enters the dock. Arrow keys move between shortcuts." },
};

export default function FloatingDockDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const [selected, setSelected] = useState("library"), [scale, setScale] = useState(1.5), [size, setSize] = useState(50);
  const [tiles, setTiles] = useState(true), [bounce, setBounce] = useState(true);
  const view = VIEWS[selected];
  const preview = <div className={`floating-dock-demo-stage${thumbnail ? " floating-dock-demo-thumbnail" : ""}`}>
    {!thumbnail && <div className="floating-dock-demo-copy"><h2>{view.title}</h2><p>{view.description}</p></div>}
    <FloatingDock appearance={appearance} value={selected} onValueChange={setSelected} magnification={scale} itemSize={size} tiles={tiles} bounce={bounce} />
    {!thumbnail && <span className="sr-only" role="status">{selected.charAt(0).toUpperCase() + selected.slice(1)} selected</span>}
  </div>;
  return thumbnail ? preview : <div className="creative-demo"><CreativeWorkbench preview={preview}>
    <ShaderSelect label="Selected shortcut" value={selected} options={Object.keys(VIEWS)} onChange={setSelected} />
    <ShaderRange label="Icon size" value={size} min={36} max={64} step={1} onChange={setSize} />
    <ShaderRange label="Magnification" value={scale} min={1} max={2} step={.05} onChange={setScale} />
    <ShaderCheck label="Icon tiles" value={tiles} onChange={setTiles} />
    <ShaderCheck label="Launch bounce" value={bounce} onChange={setBounce} />
  </CreativeWorkbench></div>;
}
