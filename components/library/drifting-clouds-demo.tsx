"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { DriftingClouds } from "../ui/drifting-clouds";
import { SKY_PALETTES } from "../ui/nature-palettes";
import { PaletteShelf } from "./palette-shelf";
import { useCreativeTheme, type CreativeTheme } from "../ui/creative-surface";
import { ShaderRange as Range, ShaderCheck as Check, ShaderColor as Color, ShaderSelect as Select } from "./shader-demo-controls";
import "../../styles/creative-demos.css";

export default function DriftingCloudsDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const resolved = useCreativeTheme();
  const [speed, setSpeed] = useState(.35), [scale, setScale] = useState(1), [coverage, setCoverage] = useState(.62), [density, setDensity] = useState(.75), [billow, setBillow] = useState(.6), [softness, setSoftness] = useState(.2);
  const [sun, setSun] = useState(35), [light, setLight] = useState(1), [seed, setSeed] = useState(7), [renderScale, setRenderScale] = useState(.65);
  const [skyColor, setSkyColor] = useState("#2777bf"), [horizon, setHorizon] = useState("#b4d8ef"), [cloudColor, setCloudColor] = useState("#fff9ed"), [shadowColor, setShadowColor] = useState("#788fab");
  const [paused, setPaused] = useState(false), [warp, setWarp] = useState(false), [scroll, setScroll] = useState(false), [radius, setRadius] = useState(.22), [strength, setStrength] = useState(1), [theme, setTheme] = useState<CreativeTheme>("auto");
  const preview = <DriftingClouds appearance={appearance} theme={theme} speed={speed} scale={scale} coverage={coverage} density={density} billow={billow} softness={softness} sunAngle={sun} lightIntensity={light} seed={seed} skyColor={skyColor} horizonColor={horizon} cloudColor={cloudColor} shadowColor={shadowColor} renderScale={thumbnail ? .4 : renderScale} paused={paused} interaction={{ warp, scroll, radius, strength }} />;
  return <div className={"creative-surface " + (thumbnail ? "creative-thumbnail" : "creative-demo")} data-theme={resolved}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <PaletteShelf id="sky" presets={Object.entries(SKY_PALETTES).map(([key, palette]) => ({ name: ({ blueHour: "Open air", apricot: "Apricot haze", seaGlass: "Sea glass", afterRain: "After rain", lavender: "Lavender dusk", highNoon: "High noon" })[key]!, colors: Object.values(palette) }))} colors={[skyColor, horizon, cloudColor, shadowColor]} onChange={([sky, edge, cloud, shade]) => { setSkyColor(sky); setHorizon(edge); setCloudColor(cloud); setShadowColor(shade); }} />
    <Range label="Drift speed" value={speed} onChange={setSpeed} max={3} />
    <Range label="Cloud scale" value={scale} onChange={setScale} min={.5} max={2.5} />
    <Range label="Sky coverage" value={coverage} onChange={setCoverage} />
    <Range label="Cloud density" value={density} onChange={setDensity} />
    <Range label="Billow detail" value={billow} onChange={setBillow} />
    <Range label="Edge softness" value={softness} onChange={setSoftness} />
    <Range label="Sun angle" value={sun} onChange={setSun} max={360} step={1} />
    <Range label="Sunlight" value={light} onChange={setLight} max={2} />
    <Range label="Cloud seed" value={seed} onChange={setSeed} max={1000} step={1} />
    <Color label="Sky color" value={skyColor} onChange={setSkyColor} />
    <Color label="Horizon color" value={horizon} onChange={setHorizon} />
    <Color label="Cloud color" value={cloudColor} onChange={setCloudColor} />
    <Color label="Cloud shadows" value={shadowColor} onChange={setShadowColor} />
    <Range label="Render scale" value={renderScale} onChange={setRenderScale} min={.25} />
    <Select label="Canvas theme" value={theme} options={["auto", "light", "dark"]} onChange={setTheme} />
    <Check label="Pointer breeze" value={warp} onChange={setWarp} />
    <Check label="Scroll linked" value={scroll} onChange={setScroll} />
    <Range label="Pointer radius" value={radius} onChange={setRadius} min={.05} />
    <Range label="Breeze strength" value={strength} onChange={setStrength} max={3} />
    <Check label="Pause animation" value={paused} onChange={setPaused} />
  </CreativeWorkbench>}</div>;
}
