"use client";

import { useId, useState } from "react";
import { uiClass, type Appearance } from "../ui/appearance";
import { Emberling, ELEMENTAL_EXPRESSIONS, type EmberlingExpression, type EmberlingVariant } from "../ui/emberling";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { CustomizerColor, CustomizerRange, CustomizerToggle } from "../ui/artwork-customizer";

const defaults = { size: 232, interactive: true, blink: true, animate: true, speed: 1, shape: "character" as "character" | "orb", expression: "happy" as EmberlingExpression, color: "#a779e3", eyeColor: "#29273f", customEyes: false, third: "aqua" as EmberlingVariant, colors: ["#9075ea", "#77d9df", "#f1a2cf"] };

export function EmberlingDemo({ appearance }: { appearance: Appearance }) {
  const [settings, setSettings] = useState(defaults);
  const id = useId();
  const update = (patch: Partial<typeof defaults>) => setSettings((current) => ({ ...current, ...patch }));
  const variants: EmberlingVariant[] = ["ember", "water", settings.third];
  const names = ["Fire", "Water", settings.third === "aqua" ? "Aqua" : settings.third === "prism" ? "Prism" : "Custom"];
  return <section className={uiClass("emberling-demo artwork-customizer ui-surface")} data-appearance={appearance} aria-label="Elemental character controls">
    <div className="artwork-customizer-preview"><div className="artwork-customizer-artwork" data-main-preview=""><div className="emberling-figures">
      {variants.map((variant, index) => <figure key={index}><button type="button" className="elemental-character-button" aria-label={`Change ${names[index]} expression`} onClick={() => update({ expression: ELEMENTAL_EXPRESSIONS[(ELEMENTAL_EXPRESSIONS.indexOf(settings.expression) + 1) % ELEMENTAL_EXPRESSIONS.length] })}>
        <Emberling appearance={appearance} variant={variant} size={settings.size} color={settings.color} colors={settings.colors} eyeColor={settings.customEyes ? settings.eyeColor : undefined} expression={settings.expression} shape={settings.shape} speed={settings.speed} animate={settings.animate} interactive={settings.interactive} blink={settings.blink} />
      </button><figcaption>{names[index]}</figcaption></figure>)}
    </div></div><p className="elemental-hint">Move closer. Tap a friend for a new expression.</p></div>
    <WorkbenchInspector><div className="artwork-customizer-settings emberling-controls">
      <div className="artwork-customizer-heading"><h3>Meet the elements</h3><p>Living flames, little ripples, and curious eyes.</p></div>
      <div className="elemental-select"><label htmlFor={`${id}-shape`}>Body style</label><select id={`${id}-shape`} value={settings.shape} onChange={(event) => update({ shape: event.target.value as typeof settings.shape })}><option value="character">Elemental character</option><option value="orb">Fluid orb</option></select></div>
      <div className="elemental-select"><label htmlFor={`${id}-expression`}>Expression</label><select id={`${id}-expression`} value={settings.expression} onChange={(event) => update({ expression: event.target.value as EmberlingExpression })}>{ELEMENTAL_EXPRESSIONS.map((expression) => <option key={expression}>{expression}</option>)}</select></div>
      <CustomizerRange label="Character size" min={80} max={320} step={4} value={settings.size} onChange={(size) => update({ size })} formatValue={(size) => `${size}px`} />
      <CustomizerRange label="Motion speed" min={.2} max={2} step={.1} value={settings.speed} onChange={(speed) => update({ speed })} formatValue={(speed) => `${speed.toFixed(1)}x`} />
      <CustomizerToggle label="Animate elements" checked={settings.animate} onChange={(animate) => update({ animate })} />
      <CustomizerToggle label="Follow pointer" checked={settings.interactive} onChange={(interactive) => update({ interactive })} />
      <CustomizerToggle label="Blink" checked={settings.blink} onChange={(blink) => update({ blink })} />
      <CustomizerToggle label="Custom eye color" checked={settings.customEyes} onChange={(customEyes) => update({ customEyes })} />
      {settings.customEyes && <CustomizerColor label="Eye color" value={settings.eyeColor} onChange={(eyeColor) => update({ eyeColor })} />}
      <details><summary>Make another friend</summary><div className="emberling-controls">
        <div className="elemental-select"><label htmlFor={`${id}-friend`}>Third friend</label><select id={`${id}-friend`} value={settings.third} onChange={(event) => update({ third: event.target.value as EmberlingVariant })}><option value="aqua">Aqua</option><option value="custom">Custom color</option><option value="prism">Prism</option></select></div>
        {settings.third === "custom" && <CustomizerColor label="Body color" value={settings.color} onChange={(color) => update({ color })} />}
        {settings.third === "prism" && settings.colors.map((color, index) => <CustomizerColor key={index} label={`Flow color ${index + 1}`} value={color} onChange={(next) => update({ colors: settings.colors.map((value, position) => position === index ? next : value) })} />)}
      </div></details>
    </div></WorkbenchInspector>
  </section>;
}
