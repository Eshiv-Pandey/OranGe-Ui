"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Download, RotateCcw, X } from "lucide-react";
import { Sticker, getSticker, type StickerName } from "../ui/sticker-pack";
import { StickerBackgroundControl, StickerControls } from "./sticker-controls";
import { DEFAULT_STICKER_OPTIONS, stickerMotionExtent, stickerReactCode, type StickerOptions } from "../../lib/sticker-options";
import "../../styles/sticker-editor.css";

export type StickerEditorDialogProps = {
  name: StickerName;
  options: StickerOptions;
  onChange: (options: StickerOptions) => void;
  onClose: () => void;
  onPlayground?: () => void;
};

/** A bounded native editor: preview and short controls, with portable exports. */
export function StickerEditorDialog({ name, options, onChange, onClose, onPlayground }: StickerEditorDialogProps) {
  const id = useId(), dialog = useRef<HTMLDialogElement>(null), artboard = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  const [background, setBackground] = useState("#f3f0eb");
  const [bounds, setBounds] = useState({ width: 360, height: 300 });
  const [replay, setReplay] = useState(0), [copied, setCopied] = useState(false), [status, setStatus] = useState("");
  const current = getSticker(name), code = stickerReactCode(name, options);
  const fit = Math.min(1, Math.max(.06, (Math.min(bounds.width, bounds.height) - 28) / stickerMotionExtent(options)));

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

  function update(patch: Partial<StickerOptions>) { onChange({ ...options, ...patch }); setCopied(false); setStatus(""); }
  function close() { dialog.current?.close(); }
  function reset() { onChange({ ...DEFAULT_STICKER_OPTIONS }); setBackground("#f3f0eb"); setCopied(false); setStatus("Settings reset."); }
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setStatus("React code copied."); }
    catch { setCopied(false); setStatus("Clipboard unavailable. Download the component to copy its source."); }
  }
  function download() {
    const [imports, usage] = code.split("\n\n");
    const source = `"use client";\n\n${imports}\n\nexport default function CustomSticker() {\n  return (\n${usage.split("\n").map(line => `    ${line}`).join("\n")}\n  );\n}\n`;
    const url = URL.createObjectURL(new Blob([source], { type: "text/plain;charset=utf-8" })), link = document.createElement("a");
    link.href = url; link.download = `${name}-sticker.tsx`; link.click();
    const revoke = URL.revokeObjectURL.bind(URL);
    setTimeout(() => revoke(url), 1000);
    setStatus("React component downloaded.");
  }

  return <dialog ref={dialog} className="sticker-editor" aria-labelledby={`${id}-title`}
    onCancel={event => { event.preventDefault(); close(); }} onClose={onClose}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }}>
    <header className="sticker-editor-header"><h2 id={`${id}-title`}>Edit {current.title}</h2><button type="button" className="sticker-editor-close" aria-label="Close sticker editor" onClick={close}><X size={18} aria-hidden="true" /></button></header>
    <div className="sticker-editor-layout">
      <section className="sticker-editor-preview" aria-label="Live sticker preview">
        <div ref={artboard} className="sticker-editor-artboard" data-background={background} style={background === "transparent" ? undefined : { background }}>
          <div className="sticker-editor-fit" style={{ width: options.size, height: options.size, transform: `scale(${fit})` }}><Sticker name={name} {...options} animationKey={replay} interactive label={`Animate ${current.title} preview`} /></div>
        </div>
        <div className="sticker-editor-preview-actions"><button type="button" onClick={() => setReplay(value => value + 1)} disabled={options.motion === "none"}><RotateCcw size={14} aria-hidden="true" /> Replay motion</button><span>{options.size} px / {options.rotate}°</span></div>
        <StickerBackgroundControl value={background} onChange={setBackground} label="Preview background" allowTransparent />
      </section>
      <section className="sticker-editor-settings" aria-label="Sticker settings">
        <StickerControls options={options} onChange={update} />
        <div className="sticker-editor-export"><button type="button" onClick={copy} aria-label="Copy edited sticker React code">{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy React"}</button><button type="button" onClick={download} aria-label="Download React component"><Download size={15} aria-hidden="true" /> Download</button></div>
        <p className="sticker-editor-status" role="status">{status}</p>
      </section>
    </div>
    <footer className="sticker-editor-footer"><button type="button" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset settings</button>{onPlayground && <button type="button" onClick={() => { close(); onPlayground(); }}>Open in playground <ArrowUpRight size={14} aria-hidden="true" /></button>}</footer>
  </dialog>;
}
