"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Appearance } from "../ui/appearance";
import { useCreativeTheme } from "../ui/creative-surface";
import { SeasonTree } from "../ui/season-tree";
import { RetroPlayer } from "../ui/retro-player";
import { RetroCamera } from "../ui/retro-camera";
import { SwingKeychain, DEFAULT_CHARMS, type KeychainCharm } from "../ui/swing-keychain";
import { CustomStamp, DEFAULT_STAMP } from "../ui/custom-stamp";
import { TiltStamp3D } from "../ui/tilt-stamp-3d";
import { IslandPlayer } from "../ui/island-player";
import { GlassPlayer } from "../ui/glass-player";
import { NeonPillPlayer } from "../ui/neon-pill-player";
import { AnimeFire } from "../ui/anime-fire";
import { GrainGradient, GRAIN_PRESETS, type GrainGradientProps } from "../ui/grain-gradient";
import { HindiText } from "../ui/hindi-text";
import { HinglishText } from "../ui/hinglish-text";
import { FrostedGlass } from "../ui/frosted-glass";
import { CREATIVE_PLAYLIST } from "../ui/creative-playlist";
import { creativeFileData } from "../ui/creative-export";
import { GARDEN_ART } from "../ui/creative-art";
import "../../styles/creative-demos.css";

function Range({ label, value, onChange, min = 0, max = 1, step = 0.05 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return <label>{label}<input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<input type="color" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="creative-check"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function Panel({ preview, children }: { preview: ReactNode; children?: ReactNode }) {
  return <><div className="creative-demo-preview" data-main-preview="">{preview}</div>{children && <div className="creative-controls">{children}</div>}</>;
}
function SeasonDemo() {
  const [wind, setWind] = useState(0.6), [fall, setFall] = useState(1), [pixel, setPixel] = useState(3), [paused, setPaused] = useState(false);
  return <Panel preview={<SeasonTree windStrength={wind} fallRate={fall} pixelSize={pixel} paused={paused} />}><Range label="Wind" value={wind} onChange={setWind} max={3} /><Range label="Falling leaves" value={fall} onChange={setFall} max={6} /><Range label="Pixel scale" value={pixel} onChange={setPixel} min={1} max={6} step={1} /><Check label="Pause tree" value={paused} onChange={setPaused} /></Panel>;
}
function RetroDemo() {
  const [body, setBody] = useState("#e6e5df"), [screen, setScreen] = useState("#f6f5ee"), [earbuds, setEarbuds] = useState(true);
  return <Panel preview={<RetroPlayer tracks={CREATIVE_PLAYLIST} bodyColor={body} screenColor={screen} showEarbuds={earbuds} />}><Color label="Body color" value={body} onChange={setBody} /><Color label="Screen color" value={screen} onChange={setScreen} /><Check label="Show earbuds" value={earbuds} onChange={setEarbuds} /><p className="creative-feedback">MENU cycles music, playlist and volume. Drag the wheel to scrub.</p></Panel>;
}
function CameraDemo() {
  const [body, setBody] = useState("#a7cf59"), [mirror, setMirror] = useState(true), [volume, setVolume] = useState(0.35), [brand, setBrand] = useState("ORANGE");
  return <Panel preview={<RetroCamera bodyColor={body} mirror={mirror} brandText={brand} volume={volume} />}><Color label="Body color" value={body} onChange={setBody} /><label>Brand text<input value={brand} onChange={(event) => setBrand(event.target.value)} /></label><Check label="Mirror front camera" value={mirror} onChange={setMirror} /><Range label="Shutter volume" value={volume} onChange={setVolume} /></Panel>;
}
function KeychainDemo() {
  const [count, setCount] = useState(5), [gravity, setGravity] = useState(850), [damping, setDamping] = useState(0.96), [chain, setChain] = useState(6), [volume, setVolume] = useState(0.35), [user, setUser] = useState<KeychainCharm | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); abort.current = controller; return () => controller.abort(); }, []);
  const charms = useMemo(() => [...DEFAULT_CHARMS.slice(0, count), ...(user ? [user] : [])], [count, user]);
  return <Panel preview={<SwingKeychain charms={charms} gravity={gravity} damping={damping} chainLength={chain} volume={volume} />}><Range label="Charm count" value={count} onChange={setCount} min={1} max={5} step={1} /><Range label="Chain links" value={chain} onChange={setChain} min={2} max={12} step={1} /><Range label="Gravity" value={gravity} onChange={setGravity} min={200} max={1600} step={50} /><Range label="Damping" value={damping} onChange={setDamping} min={0.7} max={0.99} step={0.01} /><Range label="Jingle volume" value={volume} onChange={setVolume} /><label>Your image charm<input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setUser({ id: "your-charm", image: await creativeFileData(file, abort.current?.signal), label: file.name }); } catch {} }} /></label>{user && <button type="button" className="creative-button" onClick={() => setUser(null)}>Remove image charm</button>}</Panel>;
}
function StampDemo() {
  const [config, setConfig] = useState(DEFAULT_STAMP), [background, setBackground] = useState("#579253");
  return <Panel preview={<CustomStamp config={config} onChange={setConfig} background={background} />}><Color label="Display background" value={background} onChange={setBackground} /><Check label="Add postmark" value={config.postmark} onChange={(postmark) => setConfig({ ...config, postmark })} /></Panel>;
}
function TiltDemo() {
  const [label, setLabel] = useState("ORANGE STUDIO"), [accent, setAccent] = useState("#4e419b"), [intensity, setIntensity] = useState(1), [glare, setGlare] = useState(true), [foil, setFoil] = useState(false), [rotate, setRotate] = useState(false), [image, setImage] = useState<string>();
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); abort.current = controller; return () => controller.abort(); }, []);
  return <Panel preview={<TiltStamp3D image={image} label={label} accent={accent} intensity={intensity} glare={glare} foil={foil} autoRotate={rotate} />}><label>Card label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label><Color label="Swatch color" value={accent} onChange={setAccent} /><Range label="Tilt intensity" value={intensity} onChange={setIntensity} max={2} /><Check label="Glare" value={glare} onChange={setGlare} /><Check label="Foil sheen" value={foil} onChange={setFoil} /><Check label="Idle rotation" value={rotate} onChange={setRotate} /><label className="creative-wide">Your card image<input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setImage(await creativeFileData(file, abort.current?.signal)); } catch {} }} /></label></Panel>;
}
function IslandDemo() {
  const [volume, setVolume] = useState(0.65), [output, setOutput] = useState(true);
  return <Panel preview={<IslandPlayer tracks={CREATIVE_PLAYLIST} volume={volume} showOutputIcon={output} />}><Range label="Player volume" value={volume} onChange={setVolume} /><Check label="Output button" value={output} onChange={setOutput} /></Panel>;
}
function GlassDemo() {
  const [volume, setVolume] = useState(0.65), [blur, setBlur] = useState(26), [liked, setLiked] = useState(false);
  return <Panel preview={<GlassPlayer tracks={CREATIVE_PLAYLIST} volume={volume} blur={blur} liked={liked} onLike={setLiked} />}><Range label="Backdrop blur" value={blur} onChange={setBlur} max={50} step={1} /><Range label="Player volume" value={volume} onChange={setVolume} /><Check label="Liked" value={liked} onChange={setLiked} /></Panel>;
}
function NeonDemo() {
  const [color, setColor] = useState("#ce72ef"), [expand, setExpand] = useState<"hover" | "click">("hover"), [volume, setVolume] = useState(0.65);
  return <Panel preview={<NeonPillPlayer tracks={CREATIVE_PLAYLIST} glowColor={color} expandOn={expand} volume={volume} />}><Color label="Glow color" value={color} onChange={setColor} /><Select label="Expand on" value={expand} onChange={setExpand} options={["hover", "click"]} /><Range label="Player volume" value={volume} onChange={setVolume} /><p className="creative-feedback">Hover or focus to open. On touch, tap to expand and tap outside to close.</p></Panel>;
}
function FireDemo() {
  const [colors, setColors] = useState(["#d75238", "#ff924c", "#ffdb75"]), [speed, setSpeed] = useState(0.6), [intensity, setIntensity] = useState(1), [height, setHeight] = useState(0.45), [dither, setDither] = useState(false), [interactive, setInteractive] = useState(true), [volume, setVolume] = useState(0.3), [pixel, setPixel] = useState(1);
  return <Panel preview={<AnimeFire colors={colors} speed={speed} intensity={intensity} height={height} dither={dither} interactive={interactive} volume={volume} pixelSize={pixel} />}><Range label="Fire speed" value={speed} onChange={setSpeed} max={2} /><Range label="Fire intensity" value={intensity} onChange={setIntensity} max={2} /><Range label="Flame height" value={height} onChange={setHeight} min={0.1} max={0.9} /><Range label="Crackle volume" value={volume} onChange={setVolume} />{colors.map((color, index) => <Color key={index} label={["Ember", "Flame", "Core"][index]} value={color} onChange={(value) => setColors(colors.map((previous, i) => index === i ? value : previous))} />)}<Range label="Fire pixel size" value={pixel} onChange={setPixel} min={1} max={8} step={1} /><Check label="Bayer print" value={dither} onChange={setDither} /><Check label="Follow pointer" value={interactive} onChange={setInteractive} /></Panel>;
}
function GradientDemo() {
  const [preset, setPreset] = useState<keyof typeof GRAIN_PRESETS>("sunset"), [mode, setMode] = useState<NonNullable<GrainGradientProps["mode"]>>("mesh"), [effect, setEffect] = useState<NonNullable<GrainGradientProps["pointerEffect"]>>("swirl");
  const [speed, setSpeed] = useState(0.14), [blur, setBlur] = useState(0.7), [grain, setGrain] = useState(0.35), [intensity, setIntensity] = useState(0.95), [points, setPoints] = useState(false), [angle, setAngle] = useState(25), [turbulence, setTurbulence] = useState(0.65), [scale, setScale] = useState(2.5), [vignette, setVignette] = useState(0), [posterize, setPosterize] = useState(0), [dither, setDither] = useState(false), [paused, setPaused] = useState(false), [style, setStyle] = useState<NonNullable<GrainGradientProps["grainStyle"]>>("film"), [reverse, setReverse] = useState(false);
  const [custom, setCustom] = useState<string[] | undefined>();
  return <><Panel preview={<GrainGradient preset={preset} colors={custom} mode={mode} pointerEffect={effect} speed={speed} blur={blur} grain={grain} intensity={intensity} showPoints={points} angle={angle} turbulence={turbulence} waveScale={scale} vignette={vignette} posterize={posterize} dither={dither} paused={paused} grainStyle={style} direction={reverse ? "reverse" : "forward"} />}><Select label="Palette" value={preset} onChange={(value) => { setPreset(value); setCustom(undefined); }} options={Object.keys(GRAIN_PRESETS) as (keyof typeof GRAIN_PRESETS)[]} /><Select label="Gradient shape" value={mode} onChange={setMode} options={["mesh", "radial", "conic"]} /><Select label="Pointer effect" value={effect} onChange={setEffect} options={["swirl", "repel", "attract", "ripple"]} /><Check label="Edit color points" value={points} onChange={setPoints} /><Range label="Flow speed" value={speed} onChange={setSpeed} max={1} step={0.01} /><Range label="Blend softness" value={blur} onChange={setBlur} /><Range label="Grain amount" value={grain} onChange={setGrain} /><Range label="Color intensity" value={intensity} onChange={setIntensity} /></Panel><details className="creative-editor"><summary>More gradient controls</summary><div className="creative-controls">{(custom || GRAIN_PRESETS[preset]).map((color, index) => <Color key={index} label={"Color " + (index + 1)} value={color} onChange={(value) => setCustom((custom || GRAIN_PRESETS[preset]).map((previous, i) => i === index ? value : previous))} />)}<Range label="Flow angle" value={angle} onChange={setAngle} max={360} step={1} /><Range label="Turbulence" value={turbulence} onChange={setTurbulence} max={2} /><Range label="Wave scale" value={scale} onChange={setScale} min={0.5} max={8} /><Select label="Grain style" value={style} onChange={setStyle} options={["film", "dots", "noise"]} /><Range label="Vignette" value={vignette} onChange={setVignette} /><Range label="Posterize bands" value={posterize} onChange={setPosterize} min={0} max={12} step={1} /><Check label="Bayer print" value={dither} onChange={setDither} /><Check label="Reverse flow" value={reverse} onChange={setReverse} /><Check label="Pause gradient" value={paused} onChange={setPaused} /></div></details></>;
}
function FrostDemo() {
  const [text, setText] = useState("MAKE\nROOM\nFOR JOY"), [brush, setBrush] = useState(38), [softness, setSoftness] = useState(0.55), [blur, setBlur] = useState(18), [grain, setGrain] = useState(0.18), [regrow, setRegrow] = useState(0), [drips, setDrips] = useState(false), [background, setBackground] = useState<"garden" | "gradient" | "flow">("garden"), [tint, setTint] = useState("#dce9d2");
  const scene = background === "garden" ? GARDEN_ART : background === "gradient" ? "linear-gradient(135deg,#efb889,#92baa4,#8aa6c0)" : <GrainGradient preset="ocean" showExportButton={false} />;
  return <Panel preview={<FrostedGlass background={scene} text={text} brushSize={brush} brushSoftness={softness} frostBlur={blur} grain={grain} regrowMs={regrow} condensationDrips={drips} tint={tint + "78"} />}><label className="creative-wide">Text cutout<textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} /></label><Range label="Brush size" value={brush} onChange={setBrush} min={8} max={100} step={1} /><Range label="Brush softness" value={softness} onChange={setSoftness} /><Range label="Frost blur" value={blur} onChange={setBlur} min={0} max={40} step={1} /><Range label="Frost grain" value={grain} onChange={setGrain} /><Range label="Regrow duration" value={regrow} onChange={setRegrow} min={0} max={10000} step={1000} /><Select label="Background" value={background} onChange={setBackground} options={["garden", "gradient", "flow"]} /><Color label="Frost tint" value={tint} onChange={setTint} /><Check label="Condensation drips" value={drips} onChange={setDrips} /></Panel>;
}
function Thumbnail({ slug, appearance }: { slug: string; appearance: Appearance }) {
  const a = { appearance };
  switch (slug) {
    case "season-tree": return <SeasonTree paused showPicker={false} size={245} />;
    case "retro-player": return <RetroPlayer {...a} tracks={CREATIVE_PLAYLIST} muted />;
    case "retro-camera": return <RetroCamera {...a} />;
    case "swing-keychain": return <SwingKeychain {...a} />;
    case "custom-stamp": return <CustomStamp {...a} editable={false} />;
    case "tilt-stamp-3d": return <TiltStamp3D {...a} />;
    case "island-player": return <IslandPlayer {...a} tracks={CREATIVE_PLAYLIST} muted />;
    case "glass-player": return <GlassPlayer {...a} tracks={CREATIVE_PLAYLIST} muted />;
    case "neon-pill-player": return <NeonPillPlayer {...a} tracks={CREATIVE_PLAYLIST} defaultExpanded muted />;
    case "anime-fire": return <AnimeFire {...a} interactive={false} />;
    case "grain-gradient": return <GrainGradient {...a} interactive={false} showExportButton={false} paused />;
    case "hindi-text": return <HindiText {...a} editable={false} showControls={false} />;
    case "hinglish-text": return <HinglishText {...a} editable={false} showControls={false} />;
    case "frosted-glass": return <FrostedGlass {...a} text={"MAKE\nROOM"} showResetButton={false} />;
    default: return null;
  }
}
export default function CreativeDemo({ slug, appearance = "polished", thumbnail = false }: { slug: string; appearance?: Appearance; thumbnail?: boolean }) {
  const theme = useCreativeTheme();
  const demos: Record<string, ReactNode> = { "season-tree": <SeasonDemo />, "retro-player": <RetroDemo />, "retro-camera": <CameraDemo />, "swing-keychain": <KeychainDemo />, "custom-stamp": <StampDemo />, "tilt-stamp-3d": <TiltDemo />, "island-player": <IslandDemo />, "glass-player": <GlassDemo />, "neon-pill-player": <NeonDemo />, "anime-fire": <FireDemo />, "grain-gradient": <GradientDemo />, "hindi-text": <HindiText />, "hinglish-text": <HinglishText />, "frosted-glass": <FrostDemo /> };
  return <div className={"creative-surface " + (thumbnail ? "creative-thumbnail" : "creative-demo")} data-theme={theme}>{thumbnail ? <Thumbnail slug={slug} appearance={appearance} /> : slug === "hindi-text" || slug === "hinglish-text" ? <div data-main-preview="">{demos[slug]}</div> : demos[slug]}</div>;
}
