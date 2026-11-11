"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { ShaderCanvas, orangeSunset, pixelDream, gameboyNoise, type ShaderEffect, type ShaderInteraction, type ShaderSource } from "../ui/shader-canvas";
import { useCreativeTheme, type CreativeTheme } from "../ui/creative-surface";
import { PUNCHY_COLORS } from "../ui/shader-canvas/types";
import { PALETTES } from "../ui/shader-canvas/palette";
import { ShaderRange as Range, ShaderCheck as Check, ShaderColor as Color, ShaderSelect as Select } from "./shader-demo-controls";
import "../../styles/creative-demos.css";

const presets = { orangeSunset, pixelDream, gameboyNoise };
type EffectName = "pixelate" | "dither" | "palette";
export default function ShaderCanvasDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const resolved = useCreativeTheme(), [source, setSource] = useState<ShaderSource>({ ...orangeSunset.source }), [interaction, setInteraction] = useState<ShaderInteraction>({});
  const [enabled, setEnabled] = useState<Record<EffectName, boolean>>({ pixelate: false, dither: false, palette: false }), [order, setOrder] = useState<EffectName[]>(["pixelate", "dither", "palette"]);
  const [size, setSize] = useState(6), [mode, setMode] = useState<"bayer4" | "bayer8" | "blueNoise">("bayer4"), [ditherStrength, setDitherStrength] = useState(.55), [ditherScale, setDitherScale] = useState(1);
  const [palette, setPalette] = useState<keyof typeof PALETTES | "custom">("gameboy"), [customPalette, setCustomPalette] = useState<string[]>(["#181033", "#ff5300", "#ffd35a", "#fff8e3"]);
  const [renderScale, setRenderScale] = useState(.8), [paused, setPaused] = useState(false), [theme, setTheme] = useState<CreativeTheme>("auto"), [preset, setPreset] = useState<keyof typeof presets>("orangeSunset");
  const colors = source.colors || PUNCHY_COLORS;
  const effects = order.filter((name) => enabled[name]).map((type): ShaderEffect => type === "pixelate" ? { type, size } : type === "dither" ? { type, mode, strength: ditherStrength, scale: ditherScale } : { type, ...(palette === "custom" ? { colors: customPalette } : { preset: palette }) });
  const change = (key: string, value: unknown) => setSource((current) => ({ ...current, [key]: value }));
  const choosePreset = (name: keyof typeof presets) => {
    setPreset(name); const selected = presets[name]; setSource({ ...selected.source });
    setEnabled({ pixelate: selected.effects.some((e) => e.type === "pixelate"), dither: selected.effects.some((e) => e.type === "dither"), palette: selected.effects.some((e) => e.type === "palette") });
    const pixel = selected.effects.find((e) => e.type === "pixelate"), dithering = selected.effects.find((e) => e.type === "dither");
    if (pixel && "size" in pixel) setSize(pixel.size); if (dithering && "mode" in dithering) { setMode(dithering.mode); setDitherStrength(dithering.strength); }
    setPalette("gameboy"); setOrder(["pixelate", "dither", "palette"]);
  };
  const preview = <ShaderCanvas source={source} effects={effects} interaction={interaction} renderScale={thumbnail ? .5 : renderScale} paused={paused} appearance={appearance} theme={theme} />;
  return <div className={"creative-surface " + (thumbnail ? "creative-thumbnail" : "creative-demo")} data-theme={resolved}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <Select label="Preset" value={preset} options={Object.keys(presets) as (keyof typeof presets)[]} onChange={choosePreset} />
    <Select label="Source" value={source.type} options={["gradient", "noise"]} onChange={(value) => change("type", value)} />
    <Range label="Color count" value={colors.length} min={3} max={5} step={1} onChange={(count) => change("colors", Array.from({ length: count }, (_, i) => colors[i] || PUNCHY_COLORS[i]))} />
    {colors.map((color, i) => <Color key={i} label={"Source color " + (i + 1)} value={color} onChange={(value) => change("colors", colors.map((previous, index) => index === i ? value : previous))} />)}
    <Range label="Speed" value={source.speed ?? .4} onChange={(v) => change("speed", v)} min={-3} max={3} />
    {source.type === "gradient" ? <Range label="Softness" value={source.softness ?? .55} onChange={(v) => change("softness", v)} /> : <><Range label="Noise scale" value={source.scale ?? 3} min={.1} max={20} onChange={(v) => change("scale", v)} /><Range label="Domain warp" value={source.warp ?? 1.2} max={5} onChange={(v) => change("warp", v)} /><Range label="Seed" value={source.seed ?? 1} min={0} max={999} step={1} onChange={(v) => change("seed", v)} /></>}
    <Range label="Saturation" value={source.saturation ?? 1.2} max={2} onChange={(v) => change("saturation", v)} /><Range label="Film grain" value={source.grain ?? .08} onChange={(v) => change("grain", v)} />
    <details className="creative-advanced creative-wide" open><summary>Ordered effects</summary><div className="creative-controls">{order.map((name, i) => <div key={name} className="shader-module-order creative-wide"><Check label={name.charAt(0).toUpperCase() + name.slice(1)} value={enabled[name]} onChange={(value) => setEnabled({ ...enabled, [name]: value })} /><button type="button" className="creative-button" disabled={!i} aria-label={"Move " + name + " earlier"} onClick={() => { const next = [...order]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setOrder(next); }}>Move up</button></div>)}
      <Range label="Pixel size" value={size} min={1} max={64} step={1} onChange={setSize} /><Select label="Dither mode" value={mode} options={["bayer4", "bayer8", "blueNoise"]} onChange={setMode} /><Range label="Dither strength" value={ditherStrength} onChange={setDitherStrength} /><Range label="Dither scale" value={ditherScale} min={.5} max={12} step={.5} onChange={setDitherScale} />
      <Select label="Color palette" value={palette} options={["gameboy", "cga", "mono", "duotone", "custom"]} onChange={setPalette} />{palette === "custom" && <><Range label="Palette colors" value={customPalette.length} min={2} max={16} step={1} onChange={(count) => setCustomPalette(Array.from({ length: count }, (_, i) => customPalette[i] || "#ff6600"))} />{customPalette.map((color, i) => <Color key={i} label={"Palette color " + (i + 1)} value={color} onChange={(value) => setCustomPalette(customPalette.map((old, index) => index === i ? value : old))} />)}</>}</div></details>
    <details className="creative-advanced creative-wide" open><summary>Interaction</summary><div className="creative-controls">{([['warp', 'Pointer warp'], ['ripple', 'Click ripples'], ['pixelProximity', 'Sharpen near cursor'], ['ditherProximity', 'Soften dither near cursor'], ['scroll', 'Scroll linked']] as const).map(([key, label]) => <Check key={key} label={label} value={Boolean(interaction[key])} onChange={(value) => setInteraction({ ...interaction, [key]: value })} />)}<Range label="Pointer radius" value={interaction.radius ?? .22} min={.05} onChange={(radius) => setInteraction({ ...interaction, radius })} /><Range label="Warp strength" value={interaction.strength ?? 1} max={3} onChange={(strength) => setInteraction({ ...interaction, strength })} /></div></details>
    <Range label="Render scale" value={renderScale} min={.25} onChange={setRenderScale} /><Select label="Canvas theme" value={theme} options={["auto", "light", "dark"]} onChange={setTheme} /><Check label="Pause animation" value={paused} onChange={setPaused} />
  </CreativeWorkbench>}</div>;
}
