"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { FlowingGrass } from "../ui/flowing-grass";
import { useCreativeTheme, type CreativeTheme } from "../ui/creative-surface";
import { ShaderRange as Range, ShaderCheck as Check, ShaderColor as Color, ShaderSelect as Select } from "./shader-demo-controls";
import "../../styles/creative-demos.css";

export default function FlowingGrassDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const resolved = useCreativeTheme();
  const [speed, setSpeed] = useState(.7), [wind, setWind] = useState(.7), [gust, setGust] = useState(.6), [direction, setDirection] = useState(32);
  const [density, setDensity] = useState(80), [length, setLength] = useState(1.25), [seed, setSeed] = useState(7), [renderScale, setRenderScale] = useState(.8);
  const [color, setColor] = useState("#76aa3c"), [tip, setTip] = useState("#d5ee94"), [shadow, setShadow] = useState("#071f16");
  const [paused, setPaused] = useState(false), [pointer, setPointer] = useState(true), [radius, setRadius] = useState(.22), [strength, setStrength] = useState(1), [theme, setTheme] = useState<CreativeTheme>("auto");
  const preview = <FlowingGrass appearance={appearance} theme={theme} speed={speed} windStrength={wind} gustSpeed={gust}
    direction={direction} density={density} bladeLength={length} seed={seed} color={color} tipColor={tip} shadowColor={shadow}
    renderScale={thumbnail ? .5 : renderScale} paused={paused} interaction={{ warp: pointer, radius, strength }} />;
  return <div className={"creative-surface " + (thumbnail ? "creative-thumbnail" : "creative-demo")} data-theme={resolved}>
    {thumbnail ? preview : <CreativeWorkbench preview={preview}>
      <Range label="Wind speed" value={speed} onChange={setSpeed} max={3} />
      <Range label="Wind strength" value={wind} onChange={setWind} max={2} />
      <Range label="Gust speed" value={gust} onChange={setGust} max={2} />
      <Range label="Wind direction" value={direction} onChange={setDirection} max={360} step={1} />
      <Range label="Grass density" value={density} onChange={setDensity} min={35} max={160} step={1} />
      <Range label="Blade length" value={length} onChange={setLength} min={.5} max={1.5} />
      <Range label="Field seed" value={seed} onChange={setSeed} max={1000} step={1} />
      <Color label="Grass color" value={color} onChange={setColor} />
      <Color label="Sunlit tips" value={tip} onChange={setTip} />
      <Color label="Grass shadows" value={shadow} onChange={setShadow} />
      <Check label="Pointer breeze" value={pointer} onChange={setPointer} />
      <Range label="Pointer radius" value={radius} onChange={setRadius} min={.05} />
      <Range label="Pointer strength" value={strength} onChange={setStrength} max={3} />
      <Range label="Render scale" value={renderScale} onChange={setRenderScale} min={.25} max={1} />
      <Select label="Canvas theme" value={theme} options={["auto", "light", "dark"]} onChange={setTheme} />
      <Check label="Pause animation" value={paused} onChange={setPaused} />
    </CreativeWorkbench>}
  </div>;
}
