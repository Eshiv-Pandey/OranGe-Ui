"use client";

import { useState } from "react";
import type { AppearanceProps } from "./appearance";
import { ArtworkCustomizer, CustomizerColor, CustomizerRange, CustomizerSelect, CustomizerToggle } from "./artwork-customizer";
import { Button } from "./button";
import { OpenWheelCar } from "./open-wheel-car";
import { Superbike } from "./superbike";
import { openWheelCarToSvgString } from "./open-wheel-car-art";
import { superbikeToSvgString } from "./superbike-art";
import { generateVehicleConfig, normalizeVehicleConfig, LIVERY_PATTERNS, TIRE_COMPOUNDS, VEHICLE_PALETTES, type VehicleConfig } from "./vehicle-art";
import "../../styles/livery-editor.css";

export type LiveryEditorProps = AppearanceProps & {
  value: VehicleConfig;
  onChange: (config: VehicleConfig) => void;
  seed?: string | number;
  /** Fix the vehicle type, or omit it to offer the car/bike selector. */
  vehicle?: "car" | "bike";
  defaultSpeed?: number;
};

const optionList = <T extends string,>(values: readonly T[]) => values.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
function pageTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.getAttribute("data-theme");
  return explicit === "dark" || explicit !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Controlled identity with independent local motion and scene preferences. */
export function LiveryEditor({ value, onChange, seed = "orangeui:motorsport", vehicle, defaultSpeed = .45, appearance = "polished", className }: LiveryEditorProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<"car" | "bike">("car");
  const [speed, setSpeed] = useState(() => Number.isFinite(defaultSpeed) ? Math.max(0, Math.min(1, defaultSpeed)) : .45);
  const [lean, setLean] = useState(0);
  const [wheelie, setWheelie] = useState(false);
  const [track, setTrack] = useState(true);
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");
  const kind = vehicle ?? selectedVehicle;
  const sceneTheme = theme === "auto" ? undefined : theme;
  return <ArtworkCustomizer value={value} onChange={onChange} seed={String(seed)} normalizeConfig={normalizeVehicleConfig} generateConfig={generateVehicleConfig} appearance={appearance} className={`livery-editor${className ? ` ${className}` : ""}`} filename={kind === "car" ? "open-wheel-car" : "superbike"} exportWidth={640} label="Customize your livery" previewCaption={`${kind === "car" ? "Open-wheel car" : "Superbike"}. Adjust speed to accelerate or brake.`}
    renderPreview={(config, style) => kind === "car" ? <OpenWheelCar config={config} seed={seed} speed={speed} track={track} theme={sceneTheme} appearance={style} /> : <Superbike config={config} seed={seed} speed={speed} lean={lean} wheelie={wheelie} track={track} theme={sceneTheme} appearance={style} />}
    configToSvg={(config, options) => (kind === "car" ? openWheelCarToSvgString : superbikeToSvgString)(config, 640, { ...options, track, theme: theme === "auto" ? pageTheme() : theme })}
    tabs={[
      { id: "design", label: "Design", render: ({ value: current, update }) => <>
        {!vehicle && <CustomizerSelect label="Vehicle" value={kind} options={[{ value: "car", label: "Open-wheel car" }, { value: "bike", label: "Superbike" }]} onChange={setSelectedVehicle} />}
        <CustomizerSelect label="Livery pattern" value={current.livery.pattern} options={optionList(LIVERY_PATTERNS)} onChange={(pattern) => update({ livery: { ...current.livery, pattern } })} />
        <CustomizerRange label="Fictional number" value={Number(current.number)} min={100} max={999} step={1} onChange={(number) => update({ number: String(number) })} />
        <CustomizerSelect label="Tire compound" value={current.tireCompound} options={optionList(TIRE_COMPOUNDS)} onChange={(tireCompound) => update({ tireCompound })} />
      </> },
      { id: "colors", label: "Colors", render: ({ value: current, update }) => <>
        <CustomizerSelect label="Livery palette" value={String(VEHICLE_PALETTES.findIndex((palette) => palette.base === current.livery.base && palette.accent === current.livery.accent && palette.stripe === current.livery.stripe))} options={[{ value: "-1", label: "Custom colors", disabled: true }, ...VEHICLE_PALETTES.map((palette, index) => ({ value: String(index), label: palette.name }))]} onChange={(index) => { const palette = VEHICLE_PALETTES[Number(index)]; update({ livery: { ...current.livery, base: palette.base, accent: palette.accent, stripe: palette.stripe } }); }} />
        <div className="customizer-field-grid">{(["base", "accent", "stripe"] as const).map((key) => <CustomizerColor key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} color`} value={current.livery[key]} onChange={(color) => update({ livery: { ...current.livery, [key]: color } })} />)}</div>
      </> },
      { id: "motion", label: "Motion", render: () => <>
        <CustomizerRange label="Speed" value={speed} onChange={setSpeed} formatValue={(value) => `${Math.round(value * 100)}%`} />
        <div className="livery-speed-actions"><Button appearance={appearance} variant="secondary" onClick={() => setSpeed(1)}>Accelerate</Button><Button appearance={appearance} variant="secondary" onClick={() => setSpeed(0)}>Brake to stop</Button></div>
        {kind === "bike" && <><CustomizerRange label="Corner lean" value={lean} min={-1} max={1} onChange={setLean} formatValue={(value) => `${Math.round(value * 24)} degrees`} /><CustomizerToggle label="Wheelie on launch" checked={wheelie} onChange={setWheelie} /><p className="artwork-customizer-note">Brake to a complete stop, then accelerate to try a launch.</p></>}
        <p className="artwork-customizer-note">Wheels follow distance travelled. Suspension settles under acceleration and braking. Motion pauses off screen and respects reduced motion.</p>
      </> },
      { id: "scene", label: "Scene", render: () => <><CustomizerToggle label="Show track" checked={track} onChange={setTrack} /><CustomizerSelect label="Track palette" value={theme} options={[{ value: "auto", label: "Follow page" }, { value: "light", label: "Daylight" }, { value: "dark", label: "After dark" }]} onChange={setTheme} /><p className="artwork-customizer-note">Turn off the track to export a transparent vehicle. Exports keep your chosen scene and a settled pose.</p></> },
    ]}
  />;
}

export type { VehicleConfig } from "./vehicle-art";
