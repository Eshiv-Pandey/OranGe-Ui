"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowUpRight, Mail, Sparkles } from "lucide-react";
import { BlockFeedback, BlockFrame, useBlockSubmission, type BlockProps } from "./shared";
import { SectionArt } from "./section-visuals";
import type { ContactSubmission } from "./forms";
import "../../../styles/contact-variants.css";

export type ContactChannel = { label: string; value: string; href?: string };
export type ContactBlockProps = BlockProps & { title?: string; description?: string; email?: string; channels?: ContactChannel[]; onSubmit?: (values: ContactSubmission) => void | Promise<void>; successMessage?: string };
const sampleChannels: ContactChannel[] = [{ label: "Email", value: "hello@example.com" }, { label: "Social", value: "Your studio, everywhere" }, { label: "Projects", value: "A good conversation starts here" }];
function ContactForm({ onSubmit, successMessage = "Your message is sent." }: Pick<ContactBlockProps, "onSubmit" | "successMessage">) {
  const id = useId(), submission = useBlockSubmission(), [errors, setErrors] = useState<Record<string, string>>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submission.pending || !onSubmit) return;
    const form = event.currentTarget, data = new FormData(form);
    const values: ContactSubmission = { name: String(data.get("name") ?? "").trim(), email: String(data.get("email") ?? "").trim(), message: String(data.get("message") ?? "").trim() };
    const next: Record<string, string> = {};
    if (!values.name) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email address.";
    if (values.message.length < 10) next.message = "Tell us a little more, using at least 10 characters.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) { (form.elements.namedItem(first) as HTMLElement | null)?.focus(); return; }
    await submission.run(() => onSubmit!(values));
  }
  return <form className="oc-form" noValidate onSubmit={submit}><h3>Tell us a little about it.</h3>{([{ name: "name", label: "Your name", type: "text", autocomplete: "name" }, { name: "email", label: "Email address", type: "email", autocomplete: "email" }] as const).map(field => <div className="oc-field" key={field.name}><label htmlFor={`${id}-${field.name}`}>{field.label}</label><input id={`${id}-${field.name}`} name={field.name} type={field.type} autoComplete={field.autocomplete} required disabled={submission.pending} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${id}-${field.name}-error` : undefined} />{errors[field.name] && <p id={`${id}-${field.name}-error`} className="oc-error">{errors[field.name]}</p>}</div>)}<div className="oc-field"><label htmlFor={`${id}-message`}>What are you thinking?</label><textarea id={`${id}-message`} name="message" rows={4} required minLength={10} maxLength={10000} disabled={submission.pending} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? `${id}-message-error` : undefined} />{errors.message && <p id={`${id}-message-error`} className="oc-error">{errors.message}</p>}</div><button type="submit" disabled={!onSubmit || submission.pending}>{submission.pending ? "Sending..." : "Send your message"}<ArrowUpRight size={18} aria-hidden="true" /></button><BlockFeedback {...submission} success={successMessage} /></form>;
}
function Channels({ channels }: { channels: ContactChannel[] }) { return <dl className="oc-channels">{channels.map((channel, index) => <div key={`${channel.label}-${index}`}><dt>{channel.label}</dt><dd>{channel.href ? <a href={channel.href}>{channel.value}<ArrowUpRight size={16} aria-hidden="true" /></a> : channel.value}</dd></div>)}</dl>; }

export function EditorialContact({ title = "LET'S TALK.", description = "A little hello can be the start of something good.", email = "hello@example.com", channels = sampleChannels, onSubmit, successMessage, ...props }: ContactBlockProps) {
  return <BlockFrame {...props} className={`sb-section oc-editorial ${props.className ?? ""}`}><header><h2>{title}</h2><p>{description}</p></header><div className="oc-editorial-stage"><div className="oc-contact-stickers" aria-hidden="true"><span><SectionArt kind="smile" /></span><b>GOOD IDEAS</b><b>GOOD COMPANY</b><span><SectionArt kind="eye" /></span><b>LET&apos;S MAKE IT</b><span><SectionArt kind="spark" /></span></div><p className="oc-big-email"><Mail size={24} aria-hidden="true" />{email}</p></div><div className="oc-editorial-bottom"><Channels channels={channels} /><ContactForm onSubmit={onSubmit} successMessage={successMessage} /></div></BlockFrame>;
}

const ruledChannels: ContactChannel[] = [{ label: "Phone", value: "Your phone number" }, { label: "Email", value: "hello@example.com" }, { label: "LinkedIn", value: "Your professional profile" }, { label: "Instagram", value: "Your studio updates" }, { label: "References", value: "Available on request" }];
export function ChannelContact({ title = "GOOD CONVERSATIONS.\nOPEN DOORS.", description = "Find us in your favorite place, or leave a little note.", channels = ruledChannels, onSubmit, successMessage, ...props }: ContactBlockProps) {
  return <BlockFrame {...props} className={`sb-section oc-channel ${props.className ?? ""}`}><header><h2>{title}</h2><p>{description}</p></header><div className="oc-ruled-stage"><div className="oc-ruled-list">{channels.map((channel, index) => <div key={`${channel.label}-${index}`}><h3>{channel.label}</h3><p>{channel.href ? <a href={channel.href}>{channel.value}<ArrowUpRight size={15} aria-hidden="true" /></a> : channel.value}</p></div>)}</div><div className="oc-channel-art" aria-hidden="true"><SectionArt kind="sprout" /><span><SectionArt kind="eye" /></span><i><SectionArt kind="spark" /></i></div></div><ContactForm onSubmit={onSubmit} successMessage={successMessage} /></BlockFrame>;
}

export function SignalContact({ title = "GOOD TO HEAR\nFROM YOU.", description = "Bring your big idea, your little question, or the thing you can't quite put into words yet.", channels = sampleChannels, onSubmit, successMessage, ...props }: ContactBlockProps) {
  return <BlockFrame {...props} className={`sb-section oc-signal ${props.className ?? ""}`}><header><h2>{title}</h2><div className="oc-signal-face" aria-hidden="true"><SectionArt kind="smile" /></div></header><div className="oc-signal-content"><div><div className="oc-signal-wave" aria-hidden="true"><SectionArt kind="eye" />{[16, 25, 10, 40, 24, 55, 17, 36, 65, 28, 44, 22, 37, 12].map((height, index) => <i key={index} style={{ height }} />)}</div><p>{description}</p><Channels channels={channels} /></div><ContactForm onSubmit={onSubmit} successMessage={successMessage} /></div></BlockFrame>;
}

export function PosterContact({ title = "BIG IDEAS?\nLET'S HEAR THEM.", description = "A good place to start your next conversation.", channels = sampleChannels, onSubmit, successMessage, ...props }: ContactBlockProps) {
  return <BlockFrame {...props} className={`sb-section oc-poster ${props.className ?? ""}`}><div><Sparkles size={36} aria-hidden="true" /><h2>{title}</h2><p>{description}</p><Channels channels={channels} /></div><ContactForm onSubmit={onSubmit} successMessage={successMessage} /></BlockFrame>;
}
