"use client";

import { useState } from "react";
import { uiClass, type Appearance } from "../ui/appearance";
import { Emberling } from "../ui/emberling";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { CustomizerColor, CustomizerRange, CustomizerToggle } from "../ui/artwork-customizer";

const defaults = { size: 180, interactive: true, blink: true, color: "#72bfa5", eyeColor: "#fff3d6", colors: ["#ef8a72", "#f6d489", "#91c9c2"] };

export function EmberlingDemo({ appearance }: { appearance: Appearance }) {
  const [settings, setSettings] = useState(defaults);
  const update = (patch: Partial<typeof defaults>) => setSettings((current) => ({ ...current, ...patch }));
  return <section className={uiClass("emberling-demo artwork-customizer ui-surface")} data-appearance={appearance} aria-label="Emberling controls">
    <div className="artwork-customizer-preview"><div className="artwork-customizer-artwork" data-main-preview=""><div className="emberling-figures">
      <figure><Emberling appearance={appearance} size={settings.size} interactive={settings.interactive} blink={settings.blink} /><figcaption>Ember</figcaption></figure>
      <figure><Emberling appearance={appearance} variant="custom" size={settings.size} color={settings.color} eyeColor={settings.eyeColor} interactive={settings.interactive} blink={settings.blink} /><figcaption>Custom</figcaption></figure>
      <figure><Emberling appearance={appearance} variant="prism" size={settings.size} colors={settings.colors} interactive={settings.interactive} blink={settings.blink} /><figcaption>Prism</figcaption></figure>
    </div></div></div>
    <WorkbenchInspector><div className="artwork-customizer-settings emberling-controls">
      <div className="artwork-customizer-heading"><h3>Controls</h3><p>A little folded flame with a curious gaze.</p></div>
      <CustomizerRange label="Character size" min={64} max={240} step={4} value={settings.size} onChange={(size) => update({ size })} formatValue={(size) => `${size}px`} />
      <div className="customizer-field-grid"><CustomizerColor label="Body color" value={settings.color} onChange={(color) => update({ color })} /><CustomizerColor label="Eye color" value={settings.eyeColor} onChange={(eyeColor) => update({ eyeColor })} /></div>
      <details><summary>Prism colors</summary><div className="emberling-controls">{settings.colors.map((color, index) => <CustomizerColor key={index} label={`Fold color ${index + 1}`} value={color} onChange={(next) => update({ colors: settings.colors.map((value, position) => position === index ? next : value) })} />)}</div></details>
      <CustomizerToggle label="Follow pointer" checked={settings.interactive} onChange={(interactive) => update({ interactive })} />
      <CustomizerToggle label="Blink" checked={settings.blink} onChange={(blink) => update({ blink })} />
    </div></WorkbenchInspector>
  </section>;
}
