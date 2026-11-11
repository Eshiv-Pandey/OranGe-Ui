"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, File, Mail, Upload, X } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { BlockFeedback, BlockFrame, BlockPhoto, BlockTitle, useBlockSubmission, type BlockProps } from "./shared";

export type ContactSubmission = { name: string; email: string; message: string };
export type ContactSectionProps = BlockProps & { title?: string; description?: string; email?: string; onSubmit?: (values: ContactSubmission) => void | Promise<void> };
export function ContactSection({ title = "Good conversations start somewhere.", description = "Tell us what's on your mind. We'd love to hear about it.", email, onSubmit, ...props }: ContactSectionProps) {
  const submission = useBlockSubmission(), messageId = useId(), [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submission.pending) return; const data = new FormData(event.currentTarget);
    const values = { name: String(data.get("name") ?? "").trim(), email: String(data.get("email") ?? "").trim(), message: String(data.get("message") ?? "").trim() };
    const next: Record<string, string> = {};
    if (!values.name) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address.";
    if (values.message.length < 10) next.message = "Tell us a little more, using at least 10 characters.";
    setErrors(next); if (!Object.keys(next).length && onSubmit) await submission.run(() => onSubmit(values));
  }
  return <BlockFrame {...props} className={`ob-contact ${props.className ?? ""}`}><div><BlockTitle title={title} description={description} />{email && <a className="ob-contact-email" href={`mailto:${email}`}><Mail size={19} />{email}</a>}<BlockPhoto photo="flowers" /></div><form className="ob-form" noValidate onSubmit={submit}><Input name="name" label="Your name" autoComplete="name" placeholder="Alex Morgan" required error={errors.name} disabled={submission.pending} /><Input name="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" required error={errors.email} disabled={submission.pending} /><div className="ob-textarea-field"><label htmlFor={messageId}>What are you thinking?</label><textarea id={messageId} name="message" rows={5} maxLength={4000} placeholder="A question, an idea, a little hello..." required disabled={submission.pending} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${messageId}-error` : undefined} />{errors.message && <p id={`${messageId}-error`} className="ob-error" role="alert">{errors.message}</p>}</div><Button type="submit" disabled={!onSubmit} loading={submission.pending}>Send your message<ArrowRight size={17} /></Button><BlockFeedback {...submission} success="Your message is sent. Thank you for reaching out." /></form></BlockFrame>;
}

export type NewsletterSectionProps = BlockProps & { title?: string; description?: string; onSubscribe?: (email: string) => void | Promise<void> };
export function NewsletterSection({ title = "A little good in your inbox.", description = "Thoughtful notes, fresh perspectives, and things worth passing on.", onSubscribe, ...props }: NewsletterSectionProps) {
  const submission = useBlockSubmission(), [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (submission.pending) return; const email = String(new FormData(event.currentTarget).get("email") ?? "").trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; } setError(""); if (onSubscribe) await submission.run(() => onSubscribe(email)); }
  return <BlockFrame {...props} className={`ob-newsletter ${props.className ?? ""}`}><div className="ob-newsletter-symbol"><Mail size={32} aria-hidden="true" /></div><BlockTitle title={title} description={description} /><form className="ob-newsletter-form" noValidate onSubmit={submit}><Input name="email" label="Email address" hideLabel type="email" autoComplete="email" placeholder="Your email address" required error={error} disabled={submission.pending} /><Button type="submit" disabled={!onSubscribe} loading={submission.pending}>Count me in<ArrowRight size={17} /></Button></form><p className="ob-small">A thoughtful note, now and then. Unsubscribe whenever you like.</p><BlockFeedback {...submission} success="You're on the list. Thanks for joining us." /></BlockFrame>;
}

export type UploadSectionProps = BlockProps & { title?: string; accept?: string; maxFiles?: number; maxBytes?: number; onUpload?: (files: File[]) => void | Promise<void> };
export function UploadSection({ title = "Give your files a place to land.", accept = "image/*,.pdf", maxFiles = 5, maxBytes = 10 * 1024 * 1024, onUpload, ...props }: UploadSectionProps) {
  const input = useRef<HTMLInputElement>(null), [files, setFiles] = useState<File[]>([]), [error, setError] = useState(""), [dragging, setDragging] = useState(false), submission = useBlockSubmission();
  function select(items: FileList | File[]) {
    if (submission.pending) return;
    const candidates = Array.from(items), patterns = accept.split(",").map(pattern => pattern.trim().toLowerCase()).filter(Boolean);
    const valid = candidates.every(file => (!patterns.length || patterns.some(pattern => pattern.startsWith(".") ? file.name.toLowerCase().endsWith(pattern) : pattern.endsWith("/*") ? file.type.toLowerCase().startsWith(pattern.slice(0, -1)) : file.type.toLowerCase() === pattern)) && file.size <= maxBytes);
    if (files.length + candidates.length > maxFiles) { setError(`Choose up to ${maxFiles} files.`); return; }
    if (!valid) { setError(`Use ${accept || "any file type"} files, each under ${Math.round(maxBytes / 1024 / 1024)} MB.`); return; }
    submission.reset(); setError(""); setFiles(current => [...current, ...candidates]);
  }
  return <BlockFrame {...props} className={`ob-upload ${props.className ?? ""}`}><BlockTitle title={title} description="Choose your files, check the details, then send them on their way." /><div className="ob-dropzone" data-dragging={dragging} onDragOver={event => { event.preventDefault(); if (!submission.pending) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!submission.pending) select(event.dataTransfer.files); }}><Upload size={32} aria-hidden="true" /><h3>Drop them right here.</h3><p>Or choose files from your device.</p><Button variant="secondary" disabled={submission.pending} onClick={() => input.current?.click()}>Choose files</Button><input ref={input} type="file" accept={accept} multiple aria-label="Choose files to upload" className="sr-only" tabIndex={-1} onChange={event => { if (event.target.files) select(event.target.files); event.target.value = ""; }} /><span className="ob-small">Up to {maxFiles} files, {Math.round(maxBytes / 1024 / 1024)} MB each.</span></div><ul className="ob-upload-files">{files.map((file, index) => <li key={`${file.name}-${index}`}><File size={20} /><span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KB</small></span><button type="button" aria-label={`Remove ${file.name}`} disabled={submission.pending} onClick={() => { setFiles(current => current.filter((_, position) => position !== index)); setError(""); submission.reset(); }}><X size={17} /></button></li>)}</ul>{error && <p role="alert" className="ob-error">{error}</p>}<Button disabled={!files.length || !onUpload} loading={submission.pending} onClick={() => submission.run(() => onUpload!(files))}>Upload {files.length || "your"} file{files.length === 1 ? "" : "s"}<ArrowRight size={17} /></Button><BlockFeedback {...submission} success="Your files are uploaded." /></BlockFrame>;
}
