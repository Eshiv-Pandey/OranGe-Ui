"use client";

import { useId, useState } from "react";
import { Button } from "./button";
import { uiClass, type AppearanceProps } from "./appearance";
import { MascotAvatar, generateMascotConfig, mascotLabel, mascotToSvgString, normalizeMascotConfig, MASCOT_OPTIONS, MASCOT_PALETTES, type MascotColors, type MascotConfig, type MascotState } from "./mascot-avatar";
import { downloadArtwork, svgToPng } from "./svg-export";
import "../../styles/avatar.css";

export type AvatarCharactersProps = AppearanceProps & {
  value: MascotConfig;
  onChange: (value: MascotConfig) => void;
  seed?: string;
};
const colorLabels: Record<keyof MascotColors, string> = { body: "Body", accent: "Accent", background: "Background start", backgroundEnd: "Background end", eye: "Eyes" };

/** Character identity is separate from transient chat state and pointer motion. */
export function AvatarCharacters({ value, onChange, seed = "orangeui:character", appearance = "polished", className }: AvatarCharactersProps) {
  const id = useId();
  const [state, setState] = useState<MascotState>("idle");
  const [interactive, setInteractive] = useState(true);
  const [blink, setBlink] = useState(true);
  const [feedback, setFeedback] = useState("");
  const config = normalizeMascotConfig(value);
  const change = (patch: Partial<MascotConfig>) => onChange(normalizeMascotConfig({ ...config, ...patch }));
  const svg = () => mascotToSvgString(config, 256, { appearance, state });
  async function copy() {
    try { await navigator.clipboard.writeText(JSON.stringify(config, null, 2)); setFeedback("Character configuration copied."); }
    catch { setFeedback("Clipboard unavailable. Select the configuration text to copy it."); }
  }
  async function exportArtwork(format: "svg" | "png") {
    try {
      const source = svg();
      const blob = format === "svg" ? new Blob([source], { type: "image/svg+xml" }) : await svgToPng(source, { width: 256 });
      downloadArtwork(blob, `orangeui-character.${format}`);
      setFeedback(`${format.toUpperCase()} exported at 256 px.`);
    } catch { setFeedback(`Could not export ${format.toUpperCase()}. Try again or use SVG.`); }
  }
  return <div className={uiClass("avatar-editor avatar-character-editor ui-surface", className)} data-appearance={appearance}>
    <div className="avatar-editor-header">
      <div className="avatar-editor-artwork" data-main-preview="">
        <MascotAvatar config={config} seed={seed} state={state} size={192} appearance={appearance} interactive={interactive} blink={blink} aria-label={`Mascot preview, ${state}`} />
        <h3>{mascotLabel(config.mascot)}</h3>
        <p className="ui-help">Move your pointer. Click to say hello.</p>
      </div>

    </div>
    <div className="avatar-editor-settings">
    <div className="avatar-editor-pickers avatar-character-pickers">
      <fieldset className="avatar-editor-fieldset"><legend>Character <span>8 original companions</span></legend>
        <div className="avatar-character-options">{MASCOT_OPTIONS.map((option) => <label key={option.value} className="avatar-character-option" title={option.description}>
          <input type="radio" name={`${id}-character`} value={option.value} checked={config.mascot === option.value} onChange={() => change({ mascot: option.value })} aria-label={option.label} />
          <MascotAvatar mascot={option.value} config={config} size={56} appearance={appearance} interactive={false} blink={false} />
          <span>{option.label}</span>
        </label>)}</div>
      </fieldset>
    </div>
    <div className="avatar-editor-controls">
      <div className="avatar-editor-selects">
        <label htmlFor={`${id}-state`}>Character state<select id={`${id}-state`} value={state} onChange={(event) => setState(event.target.value as MascotState)}>{(["idle", "thinking", "talking", "error"] as const).map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select></label>
        <label htmlFor={`${id}-palette`}>Character palette<select id={`${id}-palette`} value={MASCOT_PALETTES.findIndex((palette) => Object.entries(palette.colors).every(([key, color]) => config.colors[key as keyof MascotColors] === color))} onChange={(event) => change({ colors: { ...MASCOT_PALETTES[Number(event.target.value)].colors } })}><option value={-1} disabled>Custom colors</option>{MASCOT_PALETTES.map((palette, index) => <option key={palette.name} value={index}>{palette.name}</option>)}</select></label>
      </div>
      <fieldset className="avatar-editor-fieldset avatar-editor-custom-colors"><legend>Character colors</legend><div>{Object.entries(colorLabels).map(([key, label]) => <label key={key} htmlFor={`${id}-${key}`}><input id={`${id}-${key}`} type="color" aria-label={`${label} color`} value={config.colors[key as keyof MascotColors]} onChange={(event) => change({ colors: { ...config.colors, [key]: event.target.value } })} /><span>{label}</span></label>)}</div></fieldset>
      <div className="avatar-character-toggles"><label><input type="checkbox" checked={interactive} onChange={(event) => setInteractive(event.target.checked)} /> Follow pointer</label><label><input type="checkbox" checked={blink} onChange={(event) => setBlink(event.target.checked)} /> Blink</label></div>
    </div>
      <div className="avatar-editor-context" role="group" aria-label="Character in context"><p>In context</p><div>{[16, 32, 64, 128].map((size) => <figure key={size}><MascotAvatar config={config} state={state} size={size} appearance={appearance} interactive={false} blink={blink} /><figcaption>{size} px</figcaption></figure>)}</div></div>
    <div className="avatar-editor-actions">
      <Button appearance={appearance} onClick={() => { onChange(generateMascotConfig(`${seed}:${JSON.stringify(config)}:next`)); setFeedback("A new character combination."); }}>Randomize character</Button>
      <Button appearance={appearance} variant="secondary" onClick={() => { onChange(generateMascotConfig(seed)); setState("idle"); setInteractive(true); setBlink(true); setFeedback("Character reset."); }}>Reset character</Button>
      <Button appearance={appearance} variant="secondary" onClick={copy}>Copy config</Button>
      <Button appearance={appearance} variant="secondary" onClick={() => exportArtwork("svg")}>Export SVG</Button>
      <Button appearance={appearance} variant="secondary" onClick={() => exportArtwork("png")}>Export PNG</Button>
      <p className="ui-help">Exports preserve the selected expression in a settled pose.</p>
      <p className="ui-help" role="status">{feedback}</p>
      <details className="avatar-editor-config"><summary>Configuration</summary><pre className="character-config" tabIndex={0} aria-label="Character configuration"><code>{JSON.stringify(config, null, 2)}</code></pre></details>
    </div>
    </div>
  </div>;
}
