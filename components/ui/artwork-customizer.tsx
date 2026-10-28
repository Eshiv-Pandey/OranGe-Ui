"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { uiClass, type Appearance, type AppearanceProps } from "./appearance";
import { Button } from "./button";
import { downloadArtwork, normalizeSvgColor, prepareSvgExport, stableConfigJson, svgToPng, type SvgExportOptions } from "./svg-export";
import "../../styles/artwork-customizer.css";

export type CustomizerContext<T> = { value: T; update: (patch: Partial<T>) => void; replace: (value: T) => void; appearance: Appearance };
export type CustomizerTab<T> = { id: string; label: string; render: (context: CustomizerContext<T>) => ReactNode };
export type ArtworkCustomizerProps<T extends object> = AppearanceProps & {
  value: T;
  onChange: (value: T) => void;
  normalizeConfig: (value: unknown) => T;
  generateConfig: (seed: string) => T;
  seed?: string;
  label: string;
  description?: string;
  previewCaption?: ReactNode;
  renderPreview: (value: T, appearance: Appearance) => ReactNode;
  tabs: readonly CustomizerTab<T>[];
  /** Render a complete, settled SVG with explicit colors and a viewBox. */
  configToSvg: (value: T, options: { appearance: Appearance }) => string;
  exportOptions?: SvgExportOptions;
  exportWidth?: number;
  filename?: string;
};

/** Controlled configuration with reusable preview, field tabs, and local export actions. */
export function ArtworkCustomizer<T extends object>({ value, onChange, normalizeConfig, generateConfig, seed = "orangeui:artwork", label, description, previewCaption, renderPreview, tabs, configToSvg, exportOptions, exportWidth = 512, filename = "artwork", appearance = "polished", className }: ArtworkCustomizerProps<T>) {
  const id = useId();
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id ?? "");
  const [feedback, setFeedback] = useState({ text: "", error: false });
  const [showConfig, setShowConfig] = useState(false);
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const randomIndex = useRef(0);
  const current = normalizeConfig(value);
  const activeTab = tabs.find((tab) => tab.id === selectedTab) ?? tabs[0];
  const json = stableConfigJson(current);
  const replace = (next: T) => onChange(normalizeConfig(next));
  const context: CustomizerContext<T> = { value: current, appearance, replace, update: (patch) => replace({ ...current, ...patch }) };

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || !tabs.length) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setSelectedTab(tabs[next].id);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(json);
      setFeedback({ text: "Configuration copied.", error: false });
    } catch {
      setShowConfig(true);
      setFeedback({ text: "Clipboard unavailable. Copy the configuration from the text field below.", error: true });
    }
  }

  async function exportArtwork(format: "svg" | "png") {
    if (exporting) return;
    setExporting(format);
    try {
      const source = prepareSvgExport(configToSvg(current, { appearance }), exportOptions);
      const blob = format === "svg" ? new Blob([source], { type: "image/svg+xml;charset=utf-8" }) : await svgToPng(source, { ...exportOptions, width: exportWidth });
      downloadArtwork(blob, `${filename}.${format}`);
      setFeedback({ text: `${format.toUpperCase()} exported.`, error: false });
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : "Export failed. Try again or copy the configuration.", error: true });
    } finally { setExporting(null); }
  }

  return <section className={uiClass("artwork-customizer ui-surface", className)} data-appearance={appearance} aria-label={label}>
    <div className="artwork-customizer-preview">
      <div className="artwork-customizer-artwork" data-main-preview="">{renderPreview(current, appearance)}</div>
      {previewCaption && <div className="artwork-customizer-caption">{previewCaption}</div>}
    </div>
    <div className="artwork-customizer-settings">
      <div className="artwork-customizer-heading"><h3>{label}</h3>{description && <p>{description}</p>}</div>
      {activeTab && <>
        <div className="artwork-customizer-tabs" role="tablist" aria-label={`${label} options`}>
          {tabs.map((tab, index) => <button type="button" role="tab" key={tab.id} id={`${id}-tab-${index}`} aria-selected={activeTab.id === tab.id} aria-controls={`${id}-panel`} tabIndex={activeTab.id === tab.id ? 0 : -1} onClick={() => setSelectedTab(tab.id)} onKeyDown={(event) => moveTab(event, index)}>{tab.label}</button>)}
        </div>
        <div className="artwork-customizer-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tabs.indexOf(activeTab)}`} tabIndex={0}>{activeTab.render(context)}</div>
      </>}
      <div className="artwork-customizer-actions">
        <Button appearance={appearance} onClick={() => { randomIndex.current += 1; replace(generateConfig(`${seed}:random:${randomIndex.current}`)); setFeedback({ text: "A new combination is ready.", error: false }); }}>Randomize</Button>
        <Button appearance={appearance} variant="secondary" onClick={() => { randomIndex.current = 0; replace(generateConfig(seed)); setFeedback({ text: "Default configuration restored.", error: false }); }}>Reset</Button>
        <Button appearance={appearance} variant="secondary" onClick={copyConfig}>Copy config</Button>
        <Button appearance={appearance} variant="secondary" disabled={Boolean(exporting)} onClick={() => exportArtwork("svg")}>Export SVG</Button>
        <Button appearance={appearance} variant="secondary" loading={exporting === "png"} disabled={Boolean(exporting)} onClick={() => exportArtwork("png")}>Export PNG</Button>
      </div>
      <p className="artwork-customizer-note">Exports use the settled pose. PNG preserves the artwork proportions.</p>
      <p className="artwork-customizer-feedback" role={feedback.error ? "alert" : "status"}>{feedback.text}</p>
      <details className="artwork-customizer-config" open={showConfig} onToggle={(event) => setShowConfig(event.currentTarget.open)}>
        <summary>View configuration</summary>
        <label className="sr-only" htmlFor={`${id}-config`}>Configuration JSON</label>
        <textarea id={`${id}-config`} readOnly value={json} rows={5} spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
      </details>
    </div>
  </section>;
}

export function CustomizerColor({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const id = useId();
  const color = normalizeSvgColor(value);
  return <label className="customizer-field customizer-color" htmlFor={id}><span>{label}</span><span><input id={id} type="color" aria-label={label} value={color} onChange={(event) => onChange(normalizeSvgColor(event.target.value))} /><code>{color}</code></span></label>;
}

export function CustomizerRange({ label, value, onChange, min = 0, max = 1, step = 0.01, formatValue = String }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; formatValue?: (value: number) => string }) {
  const id = useId();
  return <div className="customizer-field customizer-range"><label htmlFor={id}>{label}<output htmlFor={id} aria-hidden="true">{formatValue(value)}</output></label><input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={formatValue(value)} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

export function CustomizerSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void }) {
  const id = useId();
  return <label className="customizer-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</select></label>;
}

export function CustomizerToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  const id = useId();
  return <label className="customizer-field customizer-toggle" htmlFor={id}><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}
