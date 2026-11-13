"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { GlyphOrb, GLYPH_ORB_DEFAULTS } from "../ui/glyph-orb";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { ShaderCheck, ShaderColor, ShaderRange, ShaderSelect } from "./shader-demo-controls";

const PRESETS = {
  twilight: { color: "#ffd4a4", shadowColor: "#70539c", background: "#080a12" },
  ice: { color: "#d7ffe5", shadowColor: "#337a99", background: "#071418" },
  ink: { color: "#173e67", shadowColor: "#b9c9db", background: "#f7f8f4" },
};
export default function GlyphOrbDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const theme = useCreativeTheme(), [preset, setPreset] = useState<keyof typeof PRESETS>("twilight"), [config, setConfig] = useState(GLYPH_ORB_DEFAULTS), [paused, setPaused] = useState(false), [interactive, setInteractive] = useState(true);
  const change = <K extends keyof typeof config>(key: K, value: typeof config[K]) => setConfig(previous => ({ ...previous, [key]: value }));
  const preview = <GlyphOrb {...config} appearance={appearance} height={thumbnail ? 280 : 490} paused={paused} interactive={interactive} />;
  return <div className={`creative-surface ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <ShaderSelect label="Palette" value={preset} options={Object.keys(PRESETS) as (keyof typeof PRESETS)[]} onChange={value => { setPreset(value); setConfig(previous => ({ ...previous, ...PRESETS[value] })); }} />
    <ShaderColor label="Sunlit color" value={config.color} onChange={value => change("color", value)} />
    <ShaderColor label="Shadow color" value={config.shadowColor} onChange={value => change("shadowColor", value)} />
    <ShaderColor label="Space color" value={config.background} onChange={value => change("background", value)} />
    <ShaderRange label="Glyph size" value={config.glyphSize} min={6} max={18} step={1} onChange={value => change("glyphSize", value)} />
    <ShaderRange label="Rotation speed" value={config.speed} min={-1.5} max={1.5} step={.1} onChange={value => change("speed", value)} />
    <ShaderRange label="Cloud bands" value={config.bands} min={3} max={15} step={1} onChange={value => change("bands", value)} />
    <ShaderRange label="Turbulence" value={config.turbulence} min={0} max={3} step={.1} onChange={value => change("turbulence", value)} />
    <ShaderRange label="Axis tilt" value={config.tilt} min={-80} max={80} step={1} onChange={value => change("tilt", value)} />
    <ShaderCheck label="Pointer light and drag" value={interactive} onChange={setInteractive} />
    <ShaderCheck label="Pause animation" value={paused} onChange={setPaused} />
    <button type="button" className="button button-secondary" onClick={() => { setPreset("twilight"); setConfig(GLYPH_ORB_DEFAULTS); setPaused(false); setInteractive(true); }}>Reset orb</button>
    <p className="creative-help">Drag the planet to spin it. Click to curl a cloud storm. Arrow keys rotate; Enter adds a storm; Home centers it.</p>
  </CreativeWorkbench>}</div>;
}
