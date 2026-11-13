"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { FlowingWater } from "../ui/flowing-water";
import { useCreativeTheme, type CreativeTheme } from "../ui/creative-surface";
import { ShaderRange as Range, ShaderCheck as Check, ShaderColor as Color, ShaderSelect as Select } from "./shader-demo-controls";
import "../../styles/creative-demos.css";

export default function FlowingWaterDemo({ appearance = "polished", thumbnail = false }: { appearance?: Appearance; thumbnail?: boolean }) {
  const resolved = useCreativeTheme(), [speed, setSpeed] = useState(.55), [scale, setScale] = useState(1.8), [depth, setDepth] = useState(.65), [sparkle, setSparkle] = useState(.8), [chop, setChop] = useState(.55), [sun, setSun] = useState(35), [renderScale, setRenderScale] = useState(.8);
  const [color, setColor] = useState("#067b83"), [deep, setDeep] = useState("#001d31"), [paused, setPaused] = useState(false), [warp, setWarp] = useState(false), [ripple, setRipple] = useState(true), [scroll, setScroll] = useState(false), [radius, setRadius] = useState(.22), [strength, setStrength] = useState(1), [theme, setTheme] = useState<CreativeTheme>("auto");
  const preview = <FlowingWater appearance={appearance} theme={theme} speed={speed} scale={scale} depth={depth} sparkle={sparkle} choppiness={chop} sunAngle={sun} color={color} deepColor={deep} renderScale={thumbnail ? .5 : renderScale} paused={paused} interaction={{ warp, ripple, scroll, radius, strength }} />;
  return <div className={"creative-surface " + (thumbnail ? "creative-thumbnail" : "creative-demo")} data-theme={resolved}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <Range label="Flow speed" value={speed} onChange={setSpeed} max={3} /><Range label="Wave scale" value={scale} onChange={setScale} min={.5} max={8} /><Range label="Water depth" value={depth} onChange={setDepth} /><Range label="Sun sparkle" value={sparkle} onChange={setSparkle} max={2} /><Range label="Choppiness" value={chop} onChange={setChop} /><Range label="Sun angle" value={sun} onChange={setSun} max={360} step={1} />
    <Color label="Water color" value={color} onChange={setColor} /><Color label="Deep water" value={deep} onChange={setDeep} /><Range label="Render scale" value={renderScale} onChange={setRenderScale} min={.25} max={1} /><Select label="Canvas theme" value={theme} options={["auto", "light", "dark"]} onChange={setTheme} />
    <Check label="Pointer warp" value={warp} onChange={setWarp} /><Check label="Click ripples" value={ripple} onChange={setRipple} /><Check label="Scroll linked" value={scroll} onChange={setScroll} /><Range label="Pointer radius" value={radius} onChange={setRadius} min={.05} /><Range label="Warp strength" value={strength} onChange={setStrength} max={3} /><Check label="Pause animation" value={paused} onChange={setPaused} />
  </CreativeWorkbench>}</div>;
}
