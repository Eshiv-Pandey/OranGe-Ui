"use client";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { GitHubGraph, type GitHubContributionCell, type GitHubGraphAnimation, type GitHubGraphAmbientEffect, type GitHubGraphVariant } from "../ui/github-graph";
import { createSampleContributions, GITHUB_GRAPH_SAMPLE } from "../ui/github-graph-data";
import { CustomizerRange, CustomizerSelect, CustomizerToggle } from "../ui/artwork-customizer";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { Button } from "../ui/button";
import "../../styles/github-graph-demo.css";

export default function GitHubGraphDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [source, setSource] = useState("sample"), [account, setAccount] = useState("octocat"), [draft, setDraft] = useState("octocat"), [load, setLoad] = useState(0);
  const [sample, setSample] = useState(GITHUB_GRAPH_SAMPLE), [seed, setSeed] = useState(1);
  const [variant, setVariant] = useState<GitHubGraphVariant>("github"), [animation, setAnimation] = useState<GitHubGraphAnimation>("wave"), [ambient, setAmbient] = useState<GitHubGraphAmbientEffect>("twinkle");
  const [months, setMonths] = useState(6), [size, setSize] = useState(18), [gap, setGap] = useState(4), [radius, setRadius] = useState(3), [speed, setSpeed] = useState(1.75), [intensity, setIntensity] = useState(1.1);
  const [fit, setFit] = useState(true), [paused, setPaused] = useState(false), [legend, setLegend] = useState(false), [total, setTotal] = useState(false), [selected, setSelected] = useState<GitHubContributionCell | null>(null);
  if (thumbnail) return <div className="github-graph-thumbnail"><GitHubGraph account="sample-dev" data={GITHUB_GRAPH_SAMPLE} months={4} cellSize={10} cellGap={3} cellRadius={2} animation="none" ambientEffect="none" paused appearance={appearance} /></div>;
  return <section className="github-graph-demo artwork-customizer" data-appearance={appearance}>
    <div className="artwork-customizer-preview github-graph-demo-preview"><div className="github-graph-demo-art"><GitHubGraph key={load} account={source === "sample" ? "sample-dev" : account} data={source === "sample" ? sample : undefined} variant={variant} months={months} cellSize={size} cellGap={gap} cellRadius={radius} animation={animation} ambientEffect={ambient} ambientIntensity={intensity} animationSpeed={speed} autoFit={fit} paused={paused} showLegend={legend} showTotal={total} appearance={appearance} onDayClick={setSelected} /></div>
      <p className="github-graph-demo-caption" role="status">{source === "sample" ? "Sample contribution data." : `Public contributions for @${account.replace(/^@/, "")}.`} {selected ? `${selected.count} contributions on ${selected.date}.` : "Hover, tap, or use arrow keys to explore."}</p></div>
    <WorkbenchInspector><div className="github-graph-demo-controls artwork-customizer-settings">
      {source === "sample" && <Button appearance="polished" onClick={() => { const next = seed + 1; setSeed(next); setSample(createSampleContributions(next)); setSelected(null); }}>Randomize sample</Button>}
      <CustomizerSelect label="Data source" value={source} options={[{ value: "sample", label: "Sample data" }, { value: "live", label: "Public GitHub profile" }]} onChange={value => { setSource(value); setSelected(null); }} />
      {source === "live" && <form className="github-graph-account-form" onSubmit={event => { event.preventDefault(); setAccount(draft.trim()); setLoad(value => value + 1); setSelected(null); }}><label htmlFor="github-graph-account">GitHub username</label><input id="github-graph-account" value={draft} placeholder="octocat" onChange={event => setDraft(event.target.value)} autoComplete="off" spellCheck={false} /><Button appearance="polished" type="submit">Load profile</Button></form>}
      <div className="artwork-customizer-grid"><CustomizerSelect label="Palette" value={variant} options={[{ value: "github", label: "GitHub green" }, { value: "graphite", label: "Graphite" }, { value: "ocean", label: "Ocean" }, { value: "violet", label: "Violet" }]} onChange={value => setVariant(value as GitHubGraphVariant)} /><CustomizerRange label="Months" min={1} max={12} step={1} value={months} onChange={setMonths} /></div>
      <div className="artwork-customizer-grid"><CustomizerRange label="Cell size" min={8} max={32} step={1} value={size} onChange={setSize} /><CustomizerRange label="Cell gap" min={0} max={10} step={1} value={gap} onChange={setGap} /><CustomizerRange label="Corner radius" min={0} max={16} step={1} value={radius} onChange={setRadius} /><CustomizerToggle label="Fit available width" checked={fit} onChange={setFit} /></div>
      <details className="github-graph-motion-settings"><summary>Motion</summary><CustomizerSelect label="Entrance" value={animation} options={[{ value: "none", label: "None" }, { value: "wave", label: "Wave" }, { value: "scan", label: "Scan" }, { value: "cascade", label: "Cascade" }]} onChange={value => setAnimation(value as GitHubGraphAnimation)} /><CustomizerSelect label="Ambient effect" value={ambient} options={[{ value: "none", label: "None" }, { value: "twinkle", label: "Twinkle" }, { value: "tide", label: "Tide" }, { value: "drift", label: "Drift" }]} onChange={value => setAmbient(value as GitHubGraphAmbientEffect)} /><CustomizerRange label="Animation speed" min={.25} max={3} step={.25} value={speed} onChange={setSpeed} /><CustomizerRange label="Ambient intensity" min={0} max={2} step={.05} value={intensity} onChange={setIntensity} /><CustomizerToggle label="Pause decoration" checked={paused} onChange={setPaused} /></details>
      <div className="artwork-customizer-grid"><CustomizerToggle label="Show legend" checked={legend} onChange={setLegend} /><CustomizerToggle label="Show total" checked={total} onChange={setTotal} /></div>
    </div></WorkbenchInspector>
  </section>;
}
