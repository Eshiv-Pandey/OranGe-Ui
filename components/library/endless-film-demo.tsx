"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { EndlessFilm } from "../ui/endless-film";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { ShaderRange, ShaderCheck } from "./shader-demo-controls";

export function EndlessFilmDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [speed, setSpeed] = useState(34), [interactive, setInteractive] = useState(true), [label, setLabel] = useState("Let the good days roll");
  const preview = <EndlessFilm appearance={appearance} speed={speed} interactive={interactive} label={label} paused={thumbnail} />;
  return thumbnail ? preview : <div className="creative-demo"><CreativeWorkbench preview={preview}><label>Collection title<input value={label} onChange={event => setLabel(event.target.value)} /></label><ShaderRange label="Feed speed" value={speed} onChange={setSpeed} min={0} max={120} step={1} /><ShaderCheck label="Cursor and drag interaction" value={interactive} onChange={setInteractive} /></CreativeWorkbench></div>;
}
