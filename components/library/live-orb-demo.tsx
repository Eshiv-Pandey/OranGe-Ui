"use client";

import { useState } from "react";
import { uiClass, type Appearance } from "../ui/appearance";
import { LiveOrb } from "../ui/live-orb";
import { CustomizerColor, CustomizerRange, CustomizerToggle } from "../ui/artwork-customizer";

const defaults = { size: 120, interactive: true, blink: true, color: "#7C5CFF", eyeColor: "#FAFAFA", colors: ["#7C6AF7", "#7DD3C7", "#E8B4D4"] };

export function LiveOrbDemo({ appearance }: { appearance: Appearance }) {
  const [settings, setSettings] = useState(defaults);
  const update = (patch: Partial<typeof defaults>) => setSettings((current) => ({ ...current, ...patch }));
  return <section className={uiClass("live-orb-demo artwork-customizer ui-surface")} data-appearance={appearance} aria-label="LiveOrb controls">
    <div className="artwork-customizer-preview">
      <div className="artwork-customizer-artwork" data-main-preview=""><div className="live-orb-figures">
        <figure><LiveOrb size={settings.size} interactive={settings.interactive} blink={settings.blink} /><figcaption>Auto</figcaption></figure>
        <figure><LiveOrb variant="custom" size={settings.size} color={settings.color} eyeColor={settings.eyeColor} interactive={settings.interactive} blink={settings.blink} /><figcaption>Custom</figcaption></figure>
        <figure><LiveOrb variant="webgl" size={settings.size} colors={settings.colors} interactive={settings.interactive} blink={settings.blink} /><figcaption>WebGL</figcaption></figure>
      </div></div>
      <p className="live-orb-attribution">LiveOrb by <a href="https://21st.dev/@radiumcoders/components/live-orb" target="_blank" rel="noreferrer">jay sharma (@radiumcoders)</a>. MIT licensed.</p>
    </div>
    <div className="artwork-customizer-settings live-orb-controls">
      <div className="artwork-customizer-heading"><h3>Controls</h3><p>Three materials, one curious character.</p></div>
      <CustomizerRange label="Orb size" min={64} max={200} step={4} value={settings.size} onChange={(size) => update({ size })} formatValue={(size) => `${size}px`} />
      <div className="customizer-field-grid"><CustomizerColor label="Body color" value={settings.color} onChange={(color) => update({ color })} /><CustomizerColor label="Eye color" value={settings.eyeColor} onChange={(eyeColor) => update({ eyeColor })} /></div>
      <details><summary>WebGL colors</summary><div className="live-orb-controls">{settings.colors.map((color, index) => <CustomizerColor key={index} label={`Wash color ${index + 1}`} value={color} onChange={(next) => update({ colors: settings.colors.map((value, position) => position === index ? next : value) })} />)}</div></details>
      <CustomizerToggle label="Follow pointer" checked={settings.interactive} onChange={(interactive) => update({ interactive })} />
      <CustomizerToggle label="Blink" checked={settings.blink} onChange={(blink) => update({ blink })} />
    </div>
  </section>;
}
