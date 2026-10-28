"use client";

import { useState } from "react";
import type { AppearanceProps } from "./appearance";
import { ArtworkCustomizer, CustomizerColor, CustomizerRange, CustomizerSelect, CustomizerToggle } from "./artwork-customizer";
import { Helmet } from "./helmet";
import { HELMET_FINISHES, HELMET_PALETTES, HELMET_PATTERNS, generateHelmetConfig, helmetToSvgString, normalizeHelmetConfig, type HelmetColors, type HelmetConfig } from "./helmet-art";

export type HelmetEditorProps = AppearanceProps & {
  value: HelmetConfig;
  onChange: (value: HelmetConfig) => void;
  /** Reset and deterministic randomization use this seed. Changing it preserves controlled value. */
  seed?: string | number;
  label?: string;
};

type HelmetFieldsProps = { value: HelmetConfig; onChange: (value: HelmetConfig) => void };
const options = <T extends string,>(values: readonly T[]) => values.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
const colorLabels: Record<keyof HelmetColors, string> = { shell: "Shell", stripe: "Primary stripe", stripeAlt: "Alternate stripe", visor: "Visor", trim: "Trim", eye: "Eye" };

/** Shared fields also fit the helmet section of a miniature driver customizer. */
export function HelmetDesignFields({ value, onChange }: HelmetFieldsProps) {
  return <>
    <CustomizerSelect label="Pattern" value={value.parts.pattern} options={options(HELMET_PATTERNS)} onChange={(pattern) => onChange({ ...value, parts: { ...value.parts, pattern } })} />
    <CustomizerSelect label="Finish" value={value.parts.finish} options={options(HELMET_FINISHES)} onChange={(finish) => onChange({ ...value, parts: { ...value.parts, finish } })} />
    <CustomizerRange label="Fictional number" min={0} max={999} step={1} value={Number(value.number)} formatValue={() => value.number} onChange={(number) => onChange({ ...value, number: String(number) })} />
    <CustomizerToggle label="Vents" checked={value.parts.vents} onChange={(vents) => onChange({ ...value, parts: { ...value.parts, vents } })} />
    <CustomizerToggle label="Visor open" checked={value.parts.visorOpen} onChange={(visorOpen) => onChange({ ...value, parts: { ...value.parts, visorOpen } })} />
  </>;
}

export function HelmetColorsFields({ value, onChange }: HelmetFieldsProps) {
  const palette = HELMET_PALETTES.findIndex((item) => Object.entries(item.colors).every(([key, color]) => value.colors[key as keyof HelmetColors] === color));
  return <>
    <CustomizerSelect label="Helmet palette" value={String(palette)} options={[{ value: "-1", label: "Custom colors", disabled: true }, ...HELMET_PALETTES.map((item, index) => ({ value: String(index), label: item.name }))]} onChange={(index) => {
      const selected = HELMET_PALETTES[Number(index)];
      if (selected) onChange({ ...value, colors: { ...selected.colors } });
    }} />
    <div className="customizer-field-grid">{(Object.keys(colorLabels) as (keyof HelmetColors)[]).map((key) => <CustomizerColor key={key} label={colorLabels[key]} value={value.colors[key]} onChange={(color) => onChange({ ...value, colors: { ...value.colors, [key]: color } })} />)}</div>
  </>;
}

/** Controlled saved identity with local preview-only motion preferences. */
export function HelmetEditor({ value, onChange, seed = "orangeui:helmet", label = "Customize your helmet", appearance = "polished", className }: HelmetEditorProps) {
  const [size, setSize] = useState(240);
  const [interactive, setInteractive] = useState(true);
  const [blink, setBlink] = useState(true);
  return <ArtworkCustomizer value={value} onChange={onChange} normalizeConfig={normalizeHelmetConfig} generateConfig={generateHelmetConfig} seed={String(seed)} appearance={appearance} className={className} filename="helmet" exportWidth={512} label={label}
    previewCaption={interactive ? "Follow the pointer. Click or press Space to flip the visor." : "Use the Design tab to flip the visor."}
    renderPreview={(current, style) => <Helmet config={current} seed={seed} size={size} interactive={interactive} blink={blink} visorOpen={current.parts.visorOpen} onVisorOpenChange={(visorOpen) => onChange({ ...current, parts: { ...current.parts, visorOpen } })} appearance={style} />}
    configToSvg={(current, opts) => helmetToSvgString(current, 512, opts)}
    tabs={[
      { id: "design", label: "Design", render: ({ value: current, replace }) => <HelmetDesignFields value={current} onChange={replace} /> },
      { id: "colors", label: "Colors", render: ({ value: current, replace }) => <HelmetColorsFields value={current} onChange={replace} /> },
      { id: "motion", label: "Motion", render: () => <>
        <CustomizerRange label="Preview size" min={120} max={300} step={4} value={size} onChange={setSize} formatValue={(pixels) => `${pixels}px`} />
        <CustomizerToggle label="Follow pointer" checked={interactive} onChange={setInteractive} />
        <CustomizerToggle label="Blink" checked={blink} onChange={setBlink} />
        <p className="artwork-customizer-note">Motion pauses off screen and in hidden tabs. Your system&apos;s reduced motion setting keeps the artwork still.</p>
      </> },
    ]}
  />;
}

export type { HelmetColors, HelmetConfig } from "./helmet-art";
