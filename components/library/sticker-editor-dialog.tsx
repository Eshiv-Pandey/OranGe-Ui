"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Download, RotateCcw, X } from "lucide-react";
import { Sticker, getSticker, type StickerName, type StickerMotion } from "../ui/sticker-pack";
import { DEFAULT_STICKER_OPTIONS, stickerMotionExtent, stickerReactCode, type StickerOptions } from "../../lib/sticker-options";
import "../../styles/sticker-editor.css";

export type StickerEditorDialogProps = {
  name: StickerName;
  options: StickerOptions;
  onChange: (options: StickerOptions) => void;
  onClose: () => void;
  onPlayground?: () => void;
};

const backgrounds = [
  { name: "Paper", value: "paper" },
  { name: "Ink", value: "ink" },
  { name: "Lime", value: "lime" },
  { name: "Transparent", value: "transparent" },
] as const;

/** Controlled editing workspace. Mount when open; the browser owns modal focus. */
export function StickerEditorDialog({ name, options, onChange, onClose, onPlayground }: StickerEditorDialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const artboard = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [background, setBackground] = useState<typeof backgrounds[number]["value"]>("paper");
  const [bounds, setBounds] = useState({ width: 440, height: 440 });
  const [replay, setReplay] = useState(0);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const current = getSticker(name);
  const code = stickerReactCode(name, options);
  const rotatedSize = stickerMotionExtent(options);
  const fit = Math.min(1, Math.max(.15, (Math.min(bounds.width, bounds.height) - 72) / rotatedSize));

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!opener.current && document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    if (!element.open) element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (!element.open && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const element = artboard.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width && rect.height) setBounds({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function update<K extends keyof StickerOptions>(key: K, value: StickerOptions[K]) {
    onChange({ ...options, [key]: value });
    setCopied(false);
    setStatus("");
  }
  function close() { dialog.current?.close(); }
  function reset() {
    onChange({ ...DEFAULT_STICKER_OPTIONS });
    setBackground("paper");
    setCopied(false);
    setStatus("Sticker settings reset.");
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setStatus("React code copied.");
    } catch {
      setCopied(false);
      setStatus("Clipboard access is unavailable. Select and copy the code below.");
    }
  }
  function download() {
    const [imports, usage] = code.split("\n\n");
    const source = `"use client";\n\n${imports}\n\nexport default function CustomSticker() {\n  return (\n${usage.split("\n").map(line => `    ${line}`).join("\n")}\n  );\n}\n`;
    const url = URL.createObjectURL(new Blob([source], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}-sticker.tsx`;
    link.click();
    const revoke = URL.revokeObjectURL.bind(URL);
    setTimeout(() => revoke(url), 1000);
    setStatus("React component downloaded.");
  }

  return <dialog ref={dialog} className="sticker-editor" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); close(); }} onClose={onClose}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }}>
    <header className="sticker-editor-header">
      <div><h2 id={`${id}-title`}>Edit {current.title}</h2><p id={`${id}-description`}>Tune the look, try the motion, and take the component with you.</p></div>
      <button type="button" className="sticker-editor-close" aria-label="Close sticker editor" onClick={close}><X size={20} aria-hidden="true" /></button>
    </header>

    <div className="sticker-editor-layout">
      <section className="sticker-editor-preview" aria-label="Live sticker preview">
        <div ref={artboard} className="sticker-editor-artboard" data-background={background}>
          <div className="sticker-editor-fit" style={{ transform: `scale(${fit})` }}>
            <Sticker name={name} {...options} animationKey={replay} interactive label={`Animate ${current.title} preview`} />
          </div>
          <span className="sticker-editor-stage-hint">{options.motion === "none" ? "Motion is off" : "Click the sticker to try its motion"}</span>
          {fit < .99 && <span className="sticker-editor-fit-note">Fitted to preview</span>}
        </div>
        <div className="sticker-editor-preview-actions">
          <button type="button" onClick={() => setReplay(value => value + 1)} disabled={options.motion === "none"}><RotateCcw size={15} aria-hidden="true" /> Replay motion</button>
          <span>{options.size} px <span aria-hidden="true">/</span> {options.rotate}°</span>
        </div>
        <fieldset className="sticker-editor-backgrounds"><legend>Preview background</legend><div>
          {backgrounds.map(item => <button type="button" key={item.value} aria-pressed={background === item.value} onClick={() => setBackground(item.value)}>
            <span className="sticker-editor-swatch" data-background={item.value} aria-hidden="true" /><span>{item.name}</span>
          </button>)}
        </div></fieldset>
        <p className="sticker-editor-preview-note">Backgrounds are for preview. Your sticker keeps its transparent edges.</p>
      </section>

      <section className="sticker-editor-settings" aria-label="Sticker settings">
        <fieldset className="sticker-editor-finish"><legend>Artwork finish</legend><div>
          {(["sharp", "playful"] as const).map(finish => <button type="button" key={finish} aria-pressed={options.finish === finish} onClick={() => update("finish", finish)}>
            <span>{finish === "sharp" ? "Sharp" : "Playful"}</span><small>{finish === "sharp" ? "Vivid color, fine edges" : "Soft color, bold contours"}</small>
          </button>)}
        </div></fieldset>
        <div className="sticker-editor-slider"><label htmlFor={`${id}-size`}>Sticker size <output htmlFor={`${id}-size`}>{options.size} px</output></label><input id={`${id}-size`} aria-label="Sticker size" type="range" min="48" max="360" step="4" value={options.size} onChange={event => update("size", Number(event.target.value))} /></div>
        <div className="sticker-editor-slider"><label htmlFor={`${id}-rotate`}>Rotation <output htmlFor={`${id}-rotate`}>{options.rotate}°</output></label><input id={`${id}-rotate`} aria-label="Rotation" type="range" min="-180" max="180" step="1" value={options.rotate} onChange={event => update("rotate", Number(event.target.value))} /></div>
        <div className="sticker-editor-motion-row"><label htmlFor={`${id}-motion`}>Click animation</label><select id={`${id}-motion`} value={options.motion} onChange={event => update("motion", event.target.value as StickerMotion)}><option value="bounce">Bounce</option><option value="wiggle">Wiggle</option><option value="spin">Spin</option><option value="none">None</option></select></div>
        <div className="sticker-editor-motion-settings">
          <div className="sticker-editor-slider"><label htmlFor={`${id}-duration`}>Duration <output htmlFor={`${id}-duration`}>{options.duration} ms</output></label><input id={`${id}-duration`} aria-label="Duration" type="range" min="200" max="2000" step="50" value={options.duration} disabled={options.motion === "none"} onChange={event => update("duration", Number(event.target.value))} /></div>
          <div className="sticker-editor-slider"><label htmlFor={`${id}-intensity`}>Intensity <output htmlFor={`${id}-intensity`}>{options.intensity.toFixed(2)}×</output></label><input id={`${id}-intensity`} aria-label="Intensity" type="range" min=".25" max="2" step=".05" value={options.intensity} disabled={options.motion === "none"} onChange={event => update("intensity", Number(event.target.value))} /></div>
        </div>
        <label className="sticker-editor-shadow"><input type="checkbox" checked={options.shadow} onChange={event => update("shadow", event.target.checked)} /><span>Soft shadow</span></label>
        <div className="sticker-editor-code-heading"><h3>Your React component</h3><button type="button" onClick={copy} aria-label="Copy edited sticker React code">{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button></div>
        <pre className="sticker-editor-code" tabIndex={0} aria-label="Edited sticker React code"><code>{code}</code></pre>
        <button type="button" className="sticker-editor-download" onClick={download}><Download size={16} aria-hidden="true" /> Download React component</button>
        <p className="sticker-editor-status" role="status">{status}</p>
      </section>
    </div>

    <footer className="sticker-editor-footer"><button type="button" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Reset settings</button><p>Changes update your gallery preview.</p>{onPlayground && <button type="button" className="sticker-editor-playground" onClick={() => { close(); onPlayground(); }}>Open in playground <ArrowUpRight size={16} aria-hidden="true" /></button>}</footer>
  </dialog>;
}
