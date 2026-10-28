"use client";

import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { CustomizerRange, CustomizerSelect } from "../ui/artwork-customizer";
import { HelmetEditor } from "../ui/helmet-editor";
import { generateHelmetConfig } from "../ui/helmet-art";
import { LiveryEditor } from "../ui/livery-editor";
import { generateVehicleConfig } from "../ui/vehicle-art";
import { RaceProgress } from "../ui/race-progress";
import { RaceStartLights } from "../ui/race-start-lights";

export function MotorsportDemo({ slug, appearance }: { slug: string; appearance: Appearance }) {
  const [config, setConfig] = useState(() => generateVehicleConfig("orangeui:motorsport"));
  const [helmet, setHelmet] = useState(() => generateHelmetConfig("orangeui:helmet"));
  if (slug === "helmet-editor") return <HelmetEditor value={helmet} onChange={setHelmet} appearance={appearance} />;
  if (slug === "race-start-lights") return <StartLightsDemo appearance={appearance} />;
  if (slug === "race-progress") return <RaceProgressDemo appearance={appearance} />;
  return <LiveryEditor value={config} onChange={setConfig} vehicle={slug === "open-wheel-car" ? "car" : slug === "superbike" ? "bike" : undefined} appearance={appearance} />;
}

function StartLightsDemo({ appearance }: { appearance: Appearance }) {
  const [running, setRunning] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [interval, setInterval] = useState(800);
  return <div className="demo-stack"><RaceStartLights running={running} sequenceKey={sequence} intervalMs={interval} appearance={appearance} /><div className="demo-row"><Button appearance={appearance} onClick={() => { setRunning(true); setSequence((value) => value + 1); }}>{running ? "Restart sequence" : "Start sequence"}</Button><Button appearance={appearance} variant="secondary" onClick={() => setRunning(false)} disabled={!running}>Reset lights</Button></div><CustomizerRange label="Light interval" value={interval} min={200} max={1500} step={100} onChange={setInterval} formatValue={(value) => `${value}ms`} /></div>;
}

function RaceProgressDemo({ appearance }: { appearance: Appearance }) {
  const [value, setValue] = useState(42);
  const [vehicle, setVehicle] = useState<"car" | "bike">("car");
  return <div className="demo-stack"><RaceProgress label="Pit lane preparation" value={value} vehicle={vehicle} appearance={appearance} /><CustomizerRange label="Progress" value={value} min={0} max={100} step={1} onChange={setValue} formatValue={(next) => `${next}%`} /><CustomizerSelect label="Progress vehicle" value={vehicle} options={[{ value: "car", label: "Open-wheel car" }, { value: "bike", label: "Superbike" }]} onChange={setVehicle} /><div className="demo-row"><Button appearance={appearance} onClick={() => setValue((previous) => Math.min(100, previous + 20))} disabled={value === 100}>Advance progress</Button><Button appearance={appearance} variant="secondary" onClick={() => setValue(0)}>Start again</Button></div></div>;
}
