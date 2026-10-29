"use client";

import { useState } from "react";
import { ACCENT_PRESETS, accentTokens, themeCss } from "../../lib/theme";
import { Button } from "../ui/button";
import { Popover } from "../ui/popover";
import type { Appearance } from "../ui/appearance";
import { setAccent, useAccent } from "./theme-accent";

export function ThemeTools({ appearance }: { appearance: Appearance }) {
  const accent = useAccent();
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState("");
  function choose(value: string) {
    setStatus(setAccent(value) ? "Accent saved." : "Accent applied for this visit. Browser storage is unavailable.");
    setFallback("");
  }
  async function copy() {
    const css = themeCss(accent, appearance);
    try { await navigator.clipboard.writeText(css); setStatus("Theme CSS copied."); setFallback(""); }
    catch { setFallback(css); setStatus("Select and copy the theme CSS below."); }
  }
  return <Popover appearance={appearance} align="end" title="Make it yours" className="theme-tools" trigger={<Button appearance={appearance} variant="ghost" className="header-tool" aria-label="Customize theme"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a8 8 0 1 0 0 16c1.5 0 2-1 1.2-2.2-.6-.9-.1-2 1-2H14a4 4 0 0 0 4-4A8 8 0 0 0 10 2Z"/><circle cx="6" cy="7" r=".8"/><circle cx="10" cy="5" r=".8"/><circle cx="14" cy="8" r=".8"/></svg><span className="header-tool-label">Theme</span></Button>}>
    <div className="theme-swatches" role="group" aria-label="Accent presets">{ACCENT_PRESETS.map((item) => <button type="button" key={item.name} aria-label={`${item.name} accent`} title={item.name} aria-pressed={accent === item.color} onClick={() => choose(item.color)} style={{ background: item.color }}>{accent === item.color && <svg viewBox="0 0 16 16" aria-hidden="true" style={{ color: accentTokens(item.color, false)["--on-primary"] }}><path d="m3 8 3 3 7-7"/></svg>}</button>)}</div>
    <label className="theme-color">Custom accent<input type="color" value={accent} onChange={(event) => choose(event.target.value)} /></label>
    <p className="ui-help">Text and focus colors adjust to keep your accent readable in both palettes.</p>
    <Button appearance={appearance} onClick={copy}>Copy theme</Button>
    <p className="ui-help" role="status">{status}</p>
    {fallback && <label className="theme-copy-fallback">Theme CSS<textarea readOnly value={fallback} rows={7} onFocus={(event) => event.currentTarget.select()} /></label>}
  </Popover>;
}
