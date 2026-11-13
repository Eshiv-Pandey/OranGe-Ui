"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { ArcField } from "../ui/arc-field";
import { SatinFlow } from "../ui/satin-flow";
import { ContourTerrain } from "../ui/contour-terrain";
import { SignalLens } from "../ui/signal-lens";
import { ShaderCheck, ShaderColor, ShaderRange, ShaderSelect } from "./shader-demo-controls";
import "../../styles/atmosphere-demos.css";

export type AtmosphereSlug = "arc-field" | "satin-flow" | "contour-terrain" | "signal-lens";
type Control = { key: string; label: string; min: number; max: number; step: number; value: number };
const SETTINGS: Record<AtmosphereSlug, { colors: readonly [string, string, string]; alternatives: readonly [string, string, string]; controls: readonly Control[] }> = {
  "arc-field": { colors: ["#ffbd73", "#fff0cf", "#19130f"], alternatives: ["#7be4d1", "#ecfff8", "#0e2020"], controls: [
    { key: "spread", label: "Arc spread", min: .2, max: 2, step: .1, value: 1 }, { key: "branches", label: "Forks", min: 0, max: 6, step: 1, value: 4 }, { key: "glow", label: "Glow", min: 0, max: 2, step: .1, value: 1 },
  ] },
  "satin-flow": { colors: ["#cb857d", "#fff1dc", "#392b32"], alternatives: ["#759e8b", "#e7ead0", "#20332f"], controls: [
    { key: "folds", label: "Fold count", min: 2, max: 12, step: 1, value: 5 }, { key: "drape", label: "Drape", min: 0, max: 2, step: .1, value: .8 }, { key: "sheen", label: "Sheen", min: 0, max: 2, step: .1, value: 1 }, { key: "angle", label: "Fabric angle", min: -180, max: 180, step: 1, value: -18 },
  ] },
  "contour-terrain": { colors: ["#507b74", "#b57748", "#f0eee5"], alternatives: ["#99b9af", "#e5b273", "#142e2c"], controls: [
    { key: "levels", label: "Contour count", min: 6, max: 40, step: 1, value: 18 }, { key: "elevation", label: "Elevation", min: .25, max: 2, step: .05, value: 1 }, { key: "lineWidth", label: "Line weight", min: .5, max: 2.5, step: .1, value: 1 }, { key: "scale", label: "Map scale", min: .5, max: 3, step: .1, value: 1 },
  ] },
  "signal-lens": { colors: ["#74d9c3", "#eeaa72", "#081b1c"], alternatives: ["#d8b97e", "#ec8f7a", "#201b15"], controls: [
    { key: "density", label: "Signal density", min: 4, max: 24, step: 1, value: 10 }, { key: "curvature", label: "Lens curvature", min: 0, max: 1, step: .05, value: .35 }, { key: "scanlines", label: "Scanlines", min: 0, max: 1, step: .05, value: .4 }, { key: "chromatic", label: "Color separation", min: 0, max: 2, step: .1, value: .5 },
  ] },
};

function AtmosphereEditor({ slug, appearance, thumbnail }: { slug: AtmosphereSlug; appearance: Appearance; thumbnail: boolean }) {
  const setting = SETTINGS[slug];
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(setting.controls.map(control => [control.key, control.value])));
  const [colors, setColors] = useState<readonly string[]>(setting.colors), [palette, setPalette] = useState("original");
  const [speed, setSpeed] = useState(slug === "contour-terrain" ? .2 : .3), [interactive, setInteractive] = useState(true), [paused, setPaused] = useState(false);
  const Component = { "arc-field": ArcField, "satin-flow": SatinFlow, "contour-terrain": ContourTerrain, "signal-lens": SignalLens }[slug];
  const preview = <div className={`atmosphere-demo-preview${thumbnail ? " atmosphere-demo-thumbnail" : ""}`}><Component {...values} color={colors[0]} accent={colors[1]} background={colors[2]} speed={speed} interactive={!thumbnail && interactive} paused={thumbnail || paused} appearance={appearance} height="100%" /></div>;
  const controls = (items: readonly Control[]) => items.map(control => <ShaderRange key={control.key} label={control.label} min={control.min} max={control.max} step={control.step} value={values[control.key]} onChange={value => setValues(previous => ({ ...previous, [control.key]: value }))} />);
  return thumbnail ? preview : <div className="creative-demo"><CreativeWorkbench preview={preview}>
    <ShaderSelect label="Palette" value={palette} options={["original", "alternative", "custom"]} onChange={value => { setPalette(value); if (value !== "custom") setColors(value === "original" ? setting.colors : setting.alternatives); }} />
    {controls(setting.controls.slice(0, 2))}
    <ShaderRange label="Motion speed" value={speed} min={0} max={2} step={.05} onChange={setSpeed} />
    <ShaderCheck label="Pointer response" value={interactive} onChange={setInteractive} />
    <ShaderCheck label="Pause animation" value={paused} onChange={setPaused} />
    <details className="atmosphere-demo-details creative-wide"><summary>Material and colors</summary><div>
      {controls(setting.controls.slice(2))}
      {colors.map((color, index) => <ShaderColor key={index} label={["Primary color", "Accent color", "Background"][index]} value={color} onChange={value => { setPalette("custom"); setColors(previous => previous.map((current, position) => position === index ? value : current)); }} />)}
    </div></details>
  </CreativeWorkbench></div>;
}

export default function AtmosphereDemo({ slug, appearance = "polished", thumbnail = false }: { slug: AtmosphereSlug; appearance?: Appearance; thumbnail?: boolean }) {
  return <AtmosphereEditor key={slug} slug={slug} appearance={appearance} thumbnail={thumbnail} />;
}
