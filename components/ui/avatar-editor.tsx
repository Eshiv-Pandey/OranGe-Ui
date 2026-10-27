"use client";

import { useId, type CSSProperties } from "react";
import { DEFAULT_AVATAR_SEED, generateAvatarConfig, normalizeAvatarConfig } from "../../lib/avatar/generator";
import { avatarGlyphs } from "../../lib/avatar/glyphs";
import { avatarPalettes } from "../../lib/avatar/palettes";
import { AVATAR_PATTERNS, AVATAR_SHAPES, type AvatarConfig, type AvatarPattern, type AvatarShape } from "../../lib/avatar/types";
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

/** Controlled customization. The caller owns state and decides whether to save it. */
export function AvatarEditor({ value, onChange, seed = DEFAULT_AVATAR_SEED, label = "Customize your avatar", appearance = "polished", className }: AvatarEditorProps) {
  const id = useId();
  const current = normalizeAvatarConfig(value);
  const palette = avatarPalettes[current.palette];
  const glyph = avatarGlyphs.find((item) => item.id === current.glyph) ?? avatarGlyphs[0];
  const change = (patch: Partial<AvatarConfig>) => onChange(normalizeAvatarConfig({ ...current, ...patch }));

  return <section className={uiClass("avatar-editor ui-surface", className)} data-appearance={appearance} aria-label={label}>
    <div className="avatar-editor-header">
      <div className="avatar-editor-preview"><Avatar config={current} size={128} appearance={appearance} aria-label="Avatar preview" /></div>
      <div className="avatar-editor-intro">
        <p className="avatar-editor-kicker">Your little signature</p>
        <h3>Make it feel like you.</h3>
        <p className="ui-help">A little color. A curious shape. Entirely yours.</p>
        <p className="avatar-editor-selection" aria-live="polite" aria-atomic="true">{palette.name} <span aria-hidden="true">/</span> {glyph.name}</p>
      </div>
    </div>

    <div className="avatar-editor-pickers">
      <fieldset className="avatar-editor-fieldset">
        <legend>Palette <span>{avatarPalettes.length} colors</span></legend>
        <div className="avatar-editor-options avatar-editor-palettes">
          {avatarPalettes.map((item, index) => <label className="avatar-editor-option avatar-editor-swatch" key={item.name} title={item.name} style={{ "--avatar-swatch": `linear-gradient(135deg, ${item.colors.join(", ")})` } as CSSProperties}>
            <input type="radio" name={`${id}-palette`} value={index} aria-label={item.name} checked={current.palette === index} tabIndex={current.palette === index ? 0 : -1} onChange={() => change({ palette: index })} />
            <span className="avatar-editor-check" aria-hidden="true">✓</span>
          </label>)}
        </div>
      </fieldset>

      <fieldset className="avatar-editor-fieldset">
        <legend>Glyph <span>{avatarGlyphs.length} little characters</span></legend>
        <div className="avatar-editor-options avatar-editor-glyphs">
          {avatarGlyphs.map((item) => <label className="avatar-editor-option avatar-editor-glyph" key={item.id} title={item.name}>
            <input type="radio" name={`${id}-glyph`} value={item.id} aria-label={item.name} checked={current.glyph === item.id} tabIndex={current.glyph === item.id ? 0 : -1} onChange={() => change({ glyph: item.id })} />
            <svg viewBox="0 0 64 64" width="28" height="28" fill="currentColor" aria-hidden="true">{item.paths.map((path, index) => <path key={index} d={path} fillRule="evenodd" />)}</svg>
          </label>)}
        </div>
      </fieldset>
    </div>

    <div className="avatar-editor-controls">
      <div className="avatar-editor-angle">
        <label htmlFor={`${id}-angle`}>Gradient angle <output htmlFor={`${id}-angle`} aria-hidden="true">{current.angle}°</output></label>
        <input id={`${id}-angle`} type="range" min="0" max="359" step="1" value={current.angle} aria-valuetext={`${current.angle} degrees`} onChange={(event) => change({ angle: Number(event.target.value) })} />
      </div>
      <div className="avatar-editor-selects">
        <label htmlFor={`${id}-pattern`}>Detail
          <select id={`${id}-pattern`} value={current.pattern} onChange={(event) => change({ pattern: event.target.value as AvatarPattern })}>
            {AVATAR_PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{patternLabels[pattern]}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-shape`}>Shape
          <select id={`${id}-shape`} value={current.shape} onChange={(event) => change({ shape: event.target.value as AvatarShape })}>
            {AVATAR_SHAPES.map((shape) => <option key={shape} value={shape}>{shapeLabels[shape]}</option>)}
          </select>
        </label>
      </div>
    </div>

    <div className="avatar-editor-actions">
      <Button appearance={appearance} onClick={() => onChange(normalizeAvatarConfig({ ...generateAvatarConfig(`${seed}:${JSON.stringify(current)}:shuffle`), shape: current.shape }))}>Shuffle avatar</Button>
      <Button appearance={appearance} variant="secondary" onClick={() => onChange(generateAvatarConfig(seed))}>Reset to default</Button>
    </div>
  </section>;
}
