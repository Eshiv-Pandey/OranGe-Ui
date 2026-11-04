"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { LiquidMetal, METAL_FINISHES } from "../ui/liquid-metal";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { ShaderRange as Range, ShaderSelect as Select, ShaderColor as Color, ShaderCheck as Check } from "./shader-demo-controls";
import "../../styles/reference-demos.css";

export default function LiquidMetalDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [finish, setFinish] = useState<keyof typeof METAL_FINISHES>("chrome"), [color, setColor] = useState<string>(METAL_FINISHES.chrome), [ribbons, setRibbons] = useState(3), [twist, setTwist] = useState(1), [roughness, setRoughness] = useState(.12), [sheen, setSheen] = useState(0), [speed, setSpeed] = useState(.35), [interactive, setInteractive] = useState(true), [paused, setPaused] = useState(false), theme = useCreativeTheme();
  const preview = <LiquidMetal appearance={appearance} finish={finish} color={color} ribbons={ribbons} twist={twist} roughness={roughness} sheen={sheen} speed={speed} interactive={interactive} paused={paused} renderScale={thumbnail ? .5 : .85} style={{ height: thumbnail ? 250 : 460, width: "100%" }} />;
  return <div className={`creative-surface reference-demo ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>
    <Select label="Metal finish" value={finish} options={Object.keys(METAL_FINISHES) as (keyof typeof METAL_FINISHES)[]} onChange={(next) => { setFinish(next); setColor(METAL_FINISHES[next]); }} /><Color label="Metal tint" value={color} onChange={setColor} /><Range label="Mercury droplets" value={ribbons} onChange={setRibbons} min={1} max={5} step={1} /><Range label="Fusion softness" value={twist} onChange={setTwist} max={2} /><Range label="Flow speed" value={speed} onChange={setSpeed} max={3} /><Range label="Surface roughness" value={roughness} onChange={setRoughness} /><Range label="Iridescent sheen" value={sheen} onChange={setSheen} /><Check label="Pointer lighting" value={interactive} onChange={setInteractive} /><Check label="Pause animation" value={paused} onChange={setPaused} />
  </CreativeWorkbench>}</div>;
}
