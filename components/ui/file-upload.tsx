"use client";

import { useEffect, useId, useRef, useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type FileRejection = { file: File; code: "type" | "size" | "count" | "duplicate"; message: string };
export type FileRules = { accept?: string; maxBytes?: number; maxFiles?: number };
function fileKey(file: File): string { return `${file.name}:${file.size}:${file.lastModified}:${file.type}`; }
export function validateUploadFiles(candidates: readonly File[], existing: readonly File[] = [], { accept, maxBytes = 10 * 1024 * 1024, maxFiles = 5 }: FileRules = {}): { accepted: File[]; rejected: FileRejection[] } {
  const accepted: File[] = [], rejected: FileRejection[] = [], keys = new Set(existing.map(fileKey));
  const types = accept?.split(",").map((type) => type.trim().toLowerCase()).filter(Boolean) ?? [];
  const limit = Number.isFinite(maxFiles) ? Math.max(1, Math.floor(maxFiles)) : 5;
  for (const file of candidates) {
    let rejection: Omit<FileRejection, "file"> | undefined;
    if (types.length && !types.some((type) => type.startsWith(".") ? file.name.toLowerCase().endsWith(type) : type.endsWith("/*") ? file.type.toLowerCase().startsWith(type.slice(0, -1)) : file.type.toLowerCase() === type)) rejection = { code: "type", message: `${file.name}: choose a supported file type (${accept}).` };
    else if (maxBytes > 0 && file.size > maxBytes) rejection = { code: "size", message: `${file.name}: the file exceeds ${formatFileSize(maxBytes)}.` };
    else if (keys.has(fileKey(file))) rejection = { code: "duplicate", message: `${file.name}: this file is already selected.` };
    else if (existing.length + accepted.length >= limit) rejection = { code: "count", message: `${file.name}: select no more than ${limit} ${limit === 1 ? "file" : "files"}.` };
    if (rejection) rejected.push({ file, ...rejection }); else { accepted.push(file); keys.add(fileKey(file)); }
  }
  return { accepted, rejected };
}
export function formatFileSize(bytes: number): string { return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
export type FileUploadProps = AppearanceProps & FileRules & {
  label?: string; files?: readonly File[]; defaultFiles?: readonly File[]; onFilesChange?: (files: File[]) => void; onReject?: (rejections: FileRejection[]) => void;
  multiple?: boolean; disabled?: boolean; required?: boolean; name?: string; id?: string; form?: string; description?: string; error?: string;
};
const noFiles: readonly File[] = [];

/** File selection and validation. The consumer owns persistence and upload progress. */
export function FileUpload({ label = "Attachments", files, defaultFiles = noFiles, onFilesChange, onReject, accept, maxBytes = 10 * 1024 * 1024, maxFiles = 5, multiple = true, disabled, required, name, id, form, description, error, appearance = "polished", className }: FileUploadProps) {
  const generated = useId(), inputId = id ?? `upload-${generated}`, input = useRef<HTMLInputElement>(null), dragDepth = useRef(0);
  const [internal, setInternal] = useState<readonly File[]>(defaultFiles), [rejected, setRejected] = useState<FileRejection[]>([]), [dragging, setDragging] = useState(false);
  const current = files ?? internal;
  function synchronize(selected: readonly File[]) {
    if (!input.current) return;
    if (!selected.length) { input.current.value = ""; return; }
    if (typeof DataTransfer === "undefined") return;
    try { const transfer = new DataTransfer(); selected.forEach((file) => transfer.items.add(file)); input.current.files = transfer.files; } catch { /* The callback remains available in older embedded browsers. */ }
  }
  useEffect(() => { synchronize(current); }, [current]);
  useEffect(() => {
    const owner = input.current?.form;
    const reset = (event: Event) => { queueMicrotask(() => { if (event.defaultPrevented) return; if (files === undefined) setInternal(defaultFiles); setRejected([]); synchronize(files ?? defaultFiles); }); };
    owner?.addEventListener("reset", reset); return () => owner?.removeEventListener("reset", reset);
  }, [files, defaultFiles]);
  function change(next: File[]) { if (files === undefined) setInternal(next); onFilesChange?.(next); synchronize(files ?? next); }
  function receive(candidates: readonly File[]) {
    if (disabled || !candidates.length) return;
    const previous = multiple ? current : [];
    const result = validateUploadFiles(candidates, previous, { accept, maxBytes, maxFiles: multiple ? maxFiles : 1 });
    setRejected(result.rejected); if (result.rejected.length) onReject?.(result.rejected);
    if (result.accepted.length) change([...previous, ...result.accepted]); else synchronize(current);
  }
  return <div className={uiClass("ui-file-upload ui-launch-field", className)} data-appearance={appearance} data-disabled={disabled || undefined}>
    <span id={`${inputId}-label`} className="ui-launch-label">{label}{required && <span aria-hidden="true"> *</span>}</span>
    <div className="ui-upload-zone" data-dragging={dragging || undefined} data-error={Boolean(error || rejected.length) || undefined} onDragEnter={(event) => { event.preventDefault(); if (!disabled) { dragDepth.current++; setDragging(true); } }} onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }} onDragOver={(event) => { event.preventDefault(); if (!disabled) event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); receive(Array.from(event.dataTransfer.files)); }}>
      <svg className="ui-upload-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 21V5m-6 6 6-6 6 6M6 20v7h20v-7"/></svg>
      <p>Drop {multiple ? "files" : "a file"} here, or</p>
      <label className="ui-upload-choose"><span>Choose {multiple ? "files" : "a file"}</span><input ref={input} id={inputId} className="sr-only" type="file" name={name} form={form} accept={accept} multiple={multiple} disabled={disabled} required={required && current.length === 0} aria-labelledby={`${inputId}-label`} aria-invalid={Boolean(error || rejected.length) || undefined} aria-describedby={[`${inputId}-limits`, description && `${inputId}-description`, error && `${inputId}-error`, rejected.length && `${inputId}-rejections`].filter(Boolean).join(" ")} onChange={(event) => receive(Array.from(event.target.files ?? []))} /></label>
      <small id={`${inputId}-limits`}>{maxBytes > 0 ? `Up to ${formatFileSize(maxBytes)} each` : "Any file size"}{multiple ? `, ${maxFiles} files maximum` : ", one file"}{accept ? `. Types: ${accept}` : ". Any file type"}.</small>
    </div>
    {current.length > 0 && <ul className="ui-upload-files" aria-label="Selected files">{current.map((file, index) => <li key={`${fileKey(file)}:${index}`}><span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span><button type="button" className="ui-icon-button" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={() => { change(current.filter((_, candidate) => candidate !== index)); setRejected([]); }}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></li>)}</ul>}
    <span className="sr-only" role="status">{current.length} {current.length === 1 ? "file" : "files"} selected.</span>
    {description && <p id={`${inputId}-description`} className="ui-help">{description}</p>}
    {rejected.length > 0 && <ul id={`${inputId}-rejections`} className="ui-upload-rejections ui-error" role="alert">{rejected.map((item, index) => <li key={`${fileKey(item.file)}:${index}`}>{item.message}</li>)}</ul>}
    {error && <p id={`${inputId}-error`} className="ui-error" role="alert">{error}</p>}
  </div>;
}
