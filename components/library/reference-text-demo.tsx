"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { CreativeWorkbench } from "../ui/creative-editor-slot";
import { useCreativeTheme } from "../ui/creative-surface";
import { CipherText } from "../ui/cipher-text";
import { WiggleText } from "../ui/wiggle-text";
import { FlipBoard } from "../ui/flip-board";
import { ShaderRange as Range, ShaderSelect as Select, ShaderColor as Color, ShaderCheck as Check } from "./shader-demo-controls";
import "../../styles/reference-demos.css";

type DemoProps = { appearance: Appearance; thumbnail?: boolean };
export default function ReferenceTextDemo({ appearance, thumbnail, kind }: DemoProps & { kind: "cipher-text" | "wiggle-text" | "flip-board" }) {
  const [text, setText] = useState(kind === "cipher-text" ? "MAKE ROOM\nFOR IDEAS." : kind === "wiggle-text" ? "Stay a little\ncurious." : "MAKE GOOD THINGS\nSTAY CURIOUS\nKEEP EXPLORING");
  const [duration, setDuration] = useState(1500), [replay, setReplay] = useState(0), [trigger, setTrigger] = useState<"mount" | "hover">("mount"), [strength, setStrength] = useState(4), [speed, setSpeed] = useState(110), [paused, setPaused] = useState(false), [interval, setInterval] = useState(3200), [color, setColor] = useState("#bb7644");
  const preview = kind === "flip-board" ? <FlipBoard appearance={appearance} phrases={text.split("\n")} interval={interval} autoPlay={!paused} /> : <div className="reference-text-exhibit" style={{ color }}>{kind === "cipher-text" ? <CipherText appearance={appearance} text={text} duration={duration} replayKey={replay} trigger={trigger} /> : <WiggleText appearance={appearance} strength={strength} speed={speed} paused={paused}>{text}</WiggleText>}</div>;
  const theme = useCreativeTheme();
  const controls = <><label className="creative-wide">{kind === "flip-board" ? "Messages, one per line" : "Your text"}<textarea value={text} maxLength={300} rows={4} onChange={(event) => setText(event.target.value)} /></label>{kind !== "flip-board" && <Color label="Letter color" value={color} onChange={setColor} />}{kind === "cipher-text" && <><Range label="Reveal duration" value={duration} onChange={setDuration} min={200} max={5000} step={100} /><Select label="Reveal trigger" value={trigger} options={["mount", "hover"]} onChange={setTrigger} /><button type="button" className="creative-button" onClick={() => setReplay(replay + 1)}>Replay reveal</button></>}{kind === "wiggle-text" && <><Range label="Wiggle strength" value={strength} onChange={setStrength} max={12} step={.5} /><Range label="Frame interval" value={speed} onChange={setSpeed} min={70} max={500} step={10} /></>}{kind === "flip-board" && <Range label="Message interval" value={interval} onChange={setInterval} min={1000} max={10000} step={100} />}{kind !== "cipher-text" && <Check label="Pause animation" value={paused} onChange={setPaused} />}</>;
  return <div className={`creative-surface reference-demo ${thumbnail ? "reference-thumbnail" : "creative-demo"}`} data-theme={theme}>{thumbnail ? preview : <CreativeWorkbench preview={preview}>{controls}</CreativeWorkbench>}</div>;
}
