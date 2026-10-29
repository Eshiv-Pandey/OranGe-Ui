"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { ArtworkCustomizer, CustomizerColor, CustomizerRange, CustomizerSelect, CustomizerToggle } from "../ui/artwork-customizer";
import { Input } from "../ui/input";
import { CharacterAvatar } from "../ui/character-avatar";
import { CHARACTER_FACES, CHARACTER_GLASSES, CHARACTER_HAIR, CHARACTER_OUTFITS, CHARACTER_PALETTES, characterToSvgString, generateCharacterConfig, normalizeCharacterConfig, type CharacterConfig } from "../ui/character-art";
import { Helmet } from "../ui/helmet";
import { HELMET_FINISHES, HELMET_PALETTES, HELMET_PATTERNS, generateHelmetConfig, helmetToSvgString, normalizeHelmetConfig, type HelmetConfig } from "../ui/helmet-art";
import { MiniDriver } from "../ui/mini-driver";
import { DRIVER_BOOTS, DRIVER_SUITS, generateMiniDriverConfig, miniDriverToSvgString, normalizeMiniDriverConfig } from "../ui/mini-driver-art";

const options = <T extends string,>(values: readonly T[]) => values.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
const colorLabel = (key: string) => key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).replace(/^./, (letter) => letter.toUpperCase());

function ColorFields<T extends Record<string, string>>({ value, onChange }: { value: T; onChange: (value: T) => void }) {
  return <div className="customizer-field-grid">{Object.entries(value).map(([key, color]) => <CustomizerColor key={key} label={colorLabel(key)} value={color} onChange={(next) => onChange({ ...value, [key]: next })} />)}</div>;
}

function usePreviewOptions() {
  const [size, setSize] = useState(240);
  const [interactive, setInteractive] = useState(true);
  const [blink, setBlink] = useState(true);
  return { size, setSize, interactive, setInteractive, blink, setBlink };
}

function MotionFields({ preview }: { preview: ReturnType<typeof usePreviewOptions> }) {
  return <><CustomizerRange label="Preview size" min={120} max={300} step={8} value={preview.size} onChange={preview.setSize} formatValue={(value) => `${value}px`} /><CustomizerToggle label="Follow pointer" checked={preview.interactive} onChange={preview.setInteractive} /><CustomizerToggle label="Blink" checked={preview.blink} onChange={preview.setBlink} /><p className="artwork-customizer-note">Motion pauses off screen and in hidden tabs. Your system&apos;s reduced motion setting keeps the artwork still.</p></>;
}

export function CharacterDemo({ appearance }: { appearance: Appearance }) {
  const [seed, setSeed] = useState("orangeui:portrait");
  const [config, setConfig] = useState(() => generateCharacterConfig(seed));
  const preview = usePreviewOptions();
  return <ArtworkCustomizer value={config} onChange={setConfig} normalizeConfig={normalizeCharacterConfig} generateConfig={generateCharacterConfig} seed={seed} appearance={appearance} filename="character-avatar" label="Customize your character" previewCaption="Move the pointer to turn the portrait." renderPreview={(value, style) => <CharacterAvatar config={value} seed={seed} size={preview.size} interactive={preview.interactive} blink={preview.blink} appearance={style} />} configToSvg={(value, opts) => characterToSvgString(value, 512, opts)} tabs={[
    { id: "parts", label: "Parts", render: ({ value, update }) => <>
      <Input appearance={appearance} label="Character seed" value={seed} onChange={(event) => { setSeed(event.target.value); setConfig(generateCharacterConfig(event.target.value)); }} />
      {([['hair', CHARACTER_HAIR], ['glasses', CHARACTER_GLASSES], ['outfit', CHARACTER_OUTFITS], ['face', CHARACTER_FACES]] as const).map(([key, values]) => <CustomizerSelect key={key} label={colorLabel(key)} value={value.parts[key]} options={options(values as readonly string[])} onChange={(next) => update({ parts: { ...value.parts, [key]: next } as CharacterConfig['parts'] })} />)}
      <CustomizerToggle label="Background accents" checked={value.parts.accents} onChange={(accents) => update({ parts: { ...value.parts, accents } })} /><CustomizerToggle label="Earring" checked={value.parts.earring} onChange={(earring) => update({ parts: { ...value.parts, earring } })} />
    </> },
    { id: "colors", label: "Colors", render: ({ value, update }) => <><CustomizerSelect label="Character palette" value={String(CHARACTER_PALETTES.findIndex((item) => JSON.stringify(item.colors) === JSON.stringify(value.colors)))} options={[{ value: "-1", label: "Custom colors", disabled: true }, ...CHARACTER_PALETTES.map((item, index) => ({ value: String(index), label: item.name }))]} onChange={(index) => update({ colors: { ...CHARACTER_PALETTES[Number(index)].colors } })} /><ColorFields value={value.colors} onChange={(colors) => update({ colors })} /></> },
    { id: "motion", label: "Motion", render: () => <MotionFields preview={preview} /> },
  ]} />;
}

export function HelmetDesignFields({ value, onChange }: { value: HelmetConfig; onChange: (value: HelmetConfig) => void }) {
  return <><CustomizerSelect label="Pattern" value={value.parts.pattern} options={options(HELMET_PATTERNS)} onChange={(pattern) => onChange({ ...value, parts: { ...value.parts, pattern } })} /><CustomizerSelect label="Finish" value={value.parts.finish} options={options(HELMET_FINISHES)} onChange={(finish) => onChange({ ...value, parts: { ...value.parts, finish } })} /><CustomizerRange label="Fictional number" min={100} max={999} step={1} value={Number(value.number)} onChange={(number) => onChange({ ...value, number: String(number) })} /><CustomizerToggle label="Vents" checked={value.parts.vents} onChange={(vents) => onChange({ ...value, parts: { ...value.parts, vents } })} /><CustomizerToggle label="Visor open" checked={value.parts.visorOpen} onChange={(visorOpen) => onChange({ ...value, parts: { ...value.parts, visorOpen } })} /></>;
}

function HelmetColorsFields({ value, onChange }: { value: HelmetConfig; onChange: (value: HelmetConfig) => void }) {
  return <><CustomizerSelect label="Helmet palette" value={String(HELMET_PALETTES.findIndex((item) => JSON.stringify(item.colors) === JSON.stringify(value.colors)))} options={[{ value: "-1", label: "Custom colors", disabled: true }, ...HELMET_PALETTES.map((item, index) => ({ value: String(index), label: item.name }))]} onChange={(index) => onChange({ ...value, colors: { ...HELMET_PALETTES[Number(index)].colors } })} /><ColorFields value={value.colors} onChange={(colors) => onChange({ ...value, colors })} /></>;
}

export function HelmetDemo({ appearance }: { appearance: Appearance }) {
  const [seed, setSeed] = useState("orangeui:helmet");
  const [config, setConfig] = useState(() => generateHelmetConfig(seed));
  const preview = usePreviewOptions();
  return <ArtworkCustomizer value={config} onChange={setConfig} normalizeConfig={normalizeHelmetConfig} generateConfig={generateHelmetConfig} seed={seed} appearance={appearance} filename="helmet" label="Customize your helmet" previewCaption="Follow the pointer. Click or press Space to flip the visor." renderPreview={(value, style) => <Helmet config={value} seed={seed} size={preview.size} interactive={preview.interactive} blink={preview.blink} visorOpen={value.parts.visorOpen} onVisorOpenChange={(visorOpen) => setConfig({ ...value, parts: { ...value.parts, visorOpen } })} appearance={style} />} configToSvg={(value, opts) => helmetToSvgString(value, 512, opts)} tabs={[
    { id: "design", label: "Design", render: ({ value, replace }) => <><Input appearance={appearance} label="Helmet seed" value={seed} onChange={(event) => { setSeed(event.target.value); setConfig(generateHelmetConfig(event.target.value)); }} /><HelmetDesignFields value={value} onChange={replace} /></> },
    { id: "colors", label: "Colors", render: ({ value, replace }) => <HelmetColorsFields value={value} onChange={replace} /> },
    { id: "motion", label: "Motion", render: () => <MotionFields preview={preview} /> },
  ]} />;
}

export function MiniDriverDemo({ appearance }: { appearance: Appearance }) {
  const [seed, setSeed] = useState("orangeui:driver");
  const [config, setConfig] = useState(() => generateMiniDriverConfig(seed));
  const preview = usePreviewOptions();
  return <ArtworkCustomizer value={config} onChange={setConfig} normalizeConfig={normalizeMiniDriverConfig} generateConfig={generateMiniDriverConfig} seed={seed} appearance={appearance} filename="mini-driver" exportWidth={480} label="Customize your driver" previewCaption="Move the pointer to look around. Click or press Space to wave." renderPreview={(value, style) => <MiniDriver config={value} seed={seed} size={preview.size} interactive={preview.interactive} blink={preview.blink} appearance={style} />} configToSvg={(value, opts) => miniDriverToSvgString(value, 640, opts)} tabs={[
    { id: "suit", label: "Suit", render: ({ value, update }) => <><Input appearance={appearance} label="Driver seed" value={seed} onChange={(event) => { setSeed(event.target.value); setConfig(generateMiniDriverConfig(event.target.value)); }} /><CustomizerSelect label="Suit panels" value={value.parts.suit} options={options(DRIVER_SUITS)} onChange={(suit) => update({ parts: { ...value.parts, suit } })} /><CustomizerSelect label="Boot shape" value={value.parts.boots} options={options(DRIVER_BOOTS)} onChange={(boots) => update({ parts: { ...value.parts, boots } })} /><CustomizerToggle label="Belt" checked={value.parts.belt} onChange={(belt) => update({ parts: { ...value.parts, belt } })} /><ColorFields value={value.colors} onChange={(colors) => update({ colors })} /></> },
    { id: "helmet", label: "Helmet", render: ({ value, update }) => <HelmetDesignFields value={value.helmet} onChange={(helmet) => update({ helmet })} /> },
    { id: "helmet-colors", label: "Helmet colors", render: ({ value, update }) => <HelmetColorsFields value={value.helmet} onChange={(helmet) => update({ helmet })} /> },
    { id: "motion", label: "Motion", render: () => <MotionFields preview={preview} /> },
  ]} />;
}
