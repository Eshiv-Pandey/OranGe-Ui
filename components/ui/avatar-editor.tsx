"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";
import { DEFAULT_AVATAR_SEED, generateAvatarConfig, normalizeAvatarConfig } from "../../lib/avatar/generator";
import { avatarGlyphs } from "../../lib/avatar/glyphs";
import { avatarPalettes } from "../../lib/avatar/palettes";
import { avatarToDataUrl } from "../../lib/avatar/render";
import { avatarToPng } from "../../lib/avatar/png";
import { AVATAR_PATTERNS, AVATAR_SHAPES, type AvatarConfig, type AvatarCustomColors, type AvatarPattern, type AvatarShape } from "../../lib/avatar/types";
import { uiClass, type AppearanceProps } from "./appearance";
import { Avatar } from "./avatar";
import { Button } from "./button";
import "../../styles/avatar.css";

export type AvatarEditorProps = AppearanceProps & {
  value: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
  /** Reset returns to the config generated from this seed. */
  seed?: string;
  label?: string;
};

const patternLabels: Record<AvatarPattern, string> = { none: "Clean", dots: "Tiny dots", grid: "Fine grid", noise: "Soft grain", halo: "Radial glow" };
const shapeLabels: Record<AvatarShape, string> = { squircle: "Squircle", circle: "Circle", rounded: "Rounded square", square: "Square" };
function subscribeMotion(callback: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function motionIsReduced() { return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false; }

/** Controlled identity data; animation and export feedback remain local to the editor. */
export function AvatarEditor({ value, onChange, seed = DEFAULT_AVATAR_SEED, label = "Customize your avatar", appearance = "polished", className }: AvatarEditorProps) {
  const id = useId();
  const [allPalettes, setAllPalettes] = useState(false);
  const [allGlyphs, setAllGlyphs] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const reduced = useSyncExternalStore(subscribeMotion, motionIsReduced, () => false);
  const current = normalizeAvatarConfig(value);
  const palette = avatarPalettes[current.palette];
  const colors = current.customColors ?? palette.colors;
  const glyph = avatarGlyphs.find((item) => item.id === current.glyph) ?? avatarGlyphs[0];
  const change = (patch: Partial<AvatarConfig>) => onChange(normalizeAvatarConfig({ ...current, ...patch }));
  const activeAnimation = animate && !reduced;

  async function copyConfig() {
    try { await navigator.clipboard.writeText(JSON.stringify(current, null, 2)); setFeedback("Configuration copied."); }
    catch { setFeedback("Clipboard unavailable. Select the configuration text to copy it."); }
  }
  async function exportPng() {
    try {
      const blob = await avatarToPng(current, 256, { appearance });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = "orangeui-avatar.png"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback("PNG exported at 256 px.");
    } catch { setFeedback("PNG export failed. Try exporting SVG instead."); }
  }

  return <section className={uiClass("avatar-editor ui-surface", className)} data-appearance={appearance} aria-label={label}>
    <div className="avatar-editor-header">
      <div className="avatar-editor-artwork" data-main-preview="">
        <div className="avatar-editor-preview"><Avatar config={current} size={176} appearance={appearance} animate={activeAnimation} aria-label="Avatar preview" /></div>
        <h3>{glyph.name}</h3>
        <p className="avatar-editor-selection" aria-live="polite" aria-atomic="true">{current.customColors ? "Custom colors" : palette.name}</p>
      </div>
      <Button appearance={appearance} variant="secondary" aria-pressed={activeAnimation} disabled={reduced} onClick={() => setAnimate(!animate)}>Animate</Button>
      {reduced && <p className="ui-help">Animation is off with reduced motion.</p>}
      <div className="avatar-editor-context" role="group" aria-label="Avatar in context">
        <p>In context</p>
        <div>{[16, 32, 64, 128].map((size) => <figure key={size}><Avatar config={current} size={size} appearance={appearance} animate={activeAnimation} aria-label={`Avatar at ${size} pixels`} /><figcaption>{size} px</figcaption></figure>)}</div>
      </div>
    </div>

    <div className="avatar-editor-pickers">
      <fieldset className="avatar-editor-fieldset">
        <legend>Palette <span>{avatarPalettes.length} gradients</span></legend>
        <div className="avatar-editor-options avatar-editor-palettes">
          {avatarPalettes.map((item, index) => ({ item, index })).filter(({ index }) => allPalettes || index < 12 || index === current.palette).map(({ item, index }) => <label className="avatar-editor-option avatar-editor-swatch" key={item.name} title={item.name} style={{ "--avatar-swatch": `linear-gradient(${current.angle}deg, ${item.colors.join(", ")})` } as CSSProperties}>
            <input type="radio" name={`${id}-palette`} value={index} aria-label={item.name} checked={!current.customColors && current.palette === index} tabIndex={current.palette === index ? 0 : -1} onChange={() => change({ palette: index, customColors: undefined })} />
            <svg className="avatar-editor-check" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </label>)}
        </div>
        <button className="avatar-editor-more" type="button" aria-expanded={allPalettes} onClick={() => setAllPalettes(!allPalettes)}>{allPalettes ? "Show fewer palettes" : `Show all ${avatarPalettes.length} palettes`}</button>
      </fieldset>
      <fieldset className="avatar-editor-fieldset">
        <legend>Glyph <span>{avatarGlyphs.length} original shapes</span></legend>
        <div className="avatar-editor-options avatar-editor-glyphs">
          {avatarGlyphs.filter((item, index) => allGlyphs || index < 12 || item.id === current.glyph).map((item) => <label className="avatar-editor-option avatar-editor-glyph" key={item.id} title={item.name}>
            <input type="radio" name={`${id}-glyph`} value={item.id} aria-label={item.name} checked={current.glyph === item.id} tabIndex={current.glyph === item.id ? 0 : -1} onChange={() => change({ glyph: item.id })} />
            <svg viewBox="0 0 64 64" width="28" height="28" fill="currentColor" aria-hidden="true">{(appearance === "pixel" ? item.pixelPaths : item.paths).map((path, index) => <path key={index} d={path} fillRule="evenodd" />)}</svg>
          </label>)}
        </div>
        <button className="avatar-editor-more" type="button" aria-expanded={allGlyphs} onClick={() => setAllGlyphs(!allGlyphs)}>{allGlyphs ? "Show fewer glyphs" : `Show all ${avatarGlyphs.length} glyphs`}</button>
      </fieldset>
    </div>

    <div className="avatar-editor-controls">
      <fieldset className="avatar-editor-fieldset avatar-editor-custom-colors">
        <legend>Custom colors</legend>
        <div>{colors.map((color, index) => <label key={index} htmlFor={`${id}-color-${index}`}><input id={`${id}-color-${index}`} type="color" value={color} aria-label={`Gradient color ${index + 1}`} onChange={(event) => change({ customColors: colors.map((stop, position) => position === index ? event.target.value : stop) as unknown as AvatarCustomColors })} /><span>{color}</span></label>)}</div>
        {current.customColors && <button className="avatar-editor-more" type="button" onClick={() => change({ customColors: undefined })}>Use palette colors</button>}
      </fieldset>
      <div className="avatar-editor-angle">
        <label htmlFor={`${id}-angle`}>Gradient angle <output htmlFor={`${id}-angle`} aria-hidden="true">{current.angle}°</output></label>
        <input id={`${id}-angle`} type="range" min="0" max="359" step="1" value={current.angle} aria-valuetext={`${current.angle} degrees`} onChange={(event) => change({ angle: Number(event.target.value) })} />
      </div>
      <div className="avatar-editor-selects">
        <label htmlFor={`${id}-pattern`}>Detail<select id={`${id}-pattern`} value={current.pattern} onChange={(event) => change({ pattern: event.target.value as AvatarPattern })}>{AVATAR_PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{patternLabels[pattern]}</option>)}</select></label>
        <label htmlFor={`${id}-shape`}>Shape<select id={`${id}-shape`} value={current.shape} onChange={(event) => change({ shape: event.target.value as AvatarShape })}>{AVATAR_SHAPES.map((shape) => <option key={shape} value={shape}>{shapeLabels[shape]}</option>)}</select></label>
      </div>
    </div>

    <div className="avatar-editor-actions">
      <Button appearance={appearance} onClick={() => { onChange(normalizeAvatarConfig({ ...generateAvatarConfig(`${seed}:${JSON.stringify(current)}:shuffle`), shape: current.shape })); setFeedback("A new combination, ready to make yours."); }}>Randomize avatar</Button>
      <Button appearance={appearance} variant="secondary" onClick={() => { onChange(generateAvatarConfig(seed)); setAnimate(false); setFeedback("Avatar reset."); }}>Reset to default</Button>
      <Button appearance={appearance} variant="secondary" onClick={copyConfig}>Copy config</Button>
      <Button appearance={appearance} variant="secondary" asChild><a href={avatarToDataUrl(current, 256, { appearance })} download="orangeui-avatar.svg">Export SVG</a></Button>
      <Button appearance={appearance} variant="secondary" onClick={exportPng}>Export PNG</Button>
      <p className="ui-help">Exports use the settled frame.</p>
      <p className="ui-help" role="status">{feedback}</p>
      <details className="avatar-editor-config"><summary>Configuration</summary><pre className="avatar-config" tabIndex={0} aria-label="Avatar configuration"><code>{JSON.stringify(current, null, 2)}</code></pre></details>
    </div>
  </section>;
}
