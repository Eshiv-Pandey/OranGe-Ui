"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { FOOTER_ART } from "./footer-art";
import "../../../styles/landscape-footers.css";

export type LandscapeFooterLink = { label: string; href: string };
export type LandscapeFooterGroup = { title: string; links: LandscapeFooterLink[] };
export type LandscapeFooterProps = {
  appearance?: "polished";
  brand?: string;
  groups?: LandscapeFooterGroup[];
  email?: string;
  description?: string;
  copyright?: string;
  className?: string;
  id?: string;
  theme?: "light" | "dark" | "auto";
  homeHref?: string;
  artworkSrc?: string;
  onSubscribe?: (email: string) => void | Promise<void>;
  successMessage?: string;
};

const BLUE_GROUPS: LandscapeFooterGroup[] = [
  { title: "Collections", links: [{ label: "All objects", href: "#collections" }, { label: "For the table", href: "#table" }, { label: "For the home", href: "#home" }, { label: "Small editions", href: "#editions" }] },
  { title: "Our studio", links: [{ label: "The story", href: "#story" }, { label: "How we make", href: "#process" }, { label: "Our materials", href: "#materials" }, { label: "The journal", href: "#journal" }] },
  { title: "Here to help", links: [{ label: "Questions", href: "#questions" }, { label: "Delivery & returns", href: "#delivery" }, { label: "Care guide", href: "#care" }, { label: "Get in touch", href: "#contact" }] },
];

const HILL_GROUPS: LandscapeFooterGroup[] = [
  { title: "Explore", links: [{ label: "Places to stay", href: "#stays" }, { label: "Around the village", href: "#village" }, { label: "Stories", href: "#stories" }] },
  { title: "Plan a visit", links: [{ label: "Getting here", href: "#visit" }, { label: "Good to know", href: "#questions" }, { label: "Say hello", href: "#contact" }] },
];

function FooterGroups({ groups }: { groups: LandscapeFooterGroup[] }) {
  return <>{groups.map(group => <nav className="lf-link-group" key={group.title} aria-label={group.title}>
    <h3>{group.title}</h3>
    <ul>{group.links.map(link => <li key={`${link.href}-${link.label}`}><a href={link.href}>{link.label}</a></li>)}</ul>
  </nav>)}</>;
}

function FieldworkMark() {
  return <svg viewBox="0 0 36 36" aria-hidden="true" className="lf-fieldwork-mark"><path d="M18 34V13m0 10L9 15m9 13 9-8" fill="none" stroke="currentColor" strokeWidth="1.5" /><ellipse cx="18" cy="8" rx="4" ry="7" fill="currentColor" /><ellipse cx="8" cy="13" rx="4" ry="7" transform="rotate(-48 8 13)" fill="currentColor" /><ellipse cx="28" cy="17" rx="4" ry="7" transform="rotate(48 28 17)" fill="currentColor" /></svg>;
}

function FooterNewsletter({ onSubscribe, successMessage = "You're on the list." }: Pick<LandscapeFooterProps, "onSubscribe" | "successMessage">) {
  const formId = useId();
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !onSubscribe) return;
    if (!input.current?.validity.valid || !value.trim()) {
      setInvalid(true); setState("error"); setMessage("Enter a valid email address."); input.current?.focus(); return;
    }
    pending.current = true;
    const token = ++sequence.current;
    setInvalid(false); setState("pending"); setMessage("");
    try {
      await onSubscribe(value.trim());
      if (sequence.current === token) { setState("success"); setMessage(successMessage); }
    } catch (error) {
      if (sequence.current === token) {
        setState("error"); setMessage(error instanceof Error ? error.message : "We couldn't save your email. Please try again.");
      }
    } finally { if (sequence.current === token) pending.current = false; }
  }

  return <div className="lf-newsletter">
    <h3>A note from us</h3>
    <p>New objects, studio stories and things worth keeping.</p>
    <form onSubmit={submit} noValidate aria-label="Studio newsletter" aria-busy={state === "pending"}>
      <label className="lf-sr-only" htmlFor={`${formId}-email`}>Email address</label>
      <div className="lf-email-field">
        <input id={`${formId}-email`} ref={input} type="email" name="email" autoComplete="email" required placeholder="Your email address" value={value} disabled={state === "pending"} aria-invalid={invalid} aria-describedby={`${formId}-feedback`} onChange={event => { setValue(event.target.value); setInvalid(false); setState("idle"); setMessage(""); }} />
        <button type="submit" disabled={!onSubscribe || state === "pending"} aria-label={state === "pending" ? "Subscribing" : "Subscribe to studio newsletter"}><ArrowRight size={21} aria-hidden="true" /></button>
      </div>
      <p className="lf-form-feedback" id={`${formId}-feedback`} aria-live="polite" role={state === "error" ? "alert" : "status"}>{state === "pending" ? "One moment..." : message}</p>
    </form>
  </div>;
}

export function BlueHourFooter({ brand = "Fieldwork", groups = BLUE_GROUPS, email = "hello@fieldwork.example", description = "Objects for living. Stories for keeping.", copyright, className, id, homeHref = "/", artworkSrc, theme = "auto", onSubscribe, successMessage }: LandscapeFooterProps) {
  return <div className="lf-container"><footer id={id} className={["lf-footer lf-blue-hour", className].filter(Boolean).join(" ")} data-theme={theme === "auto" ? undefined : theme}>
    <div className="lf-blue-content">
      <div className="lf-blue-columns">
        <div className="lf-blue-brand">
          <a className="lf-brand" href={homeHref} aria-label={`${brand} home`}><FieldworkMark /><span>{brand}</span></a>
          <p>{description}</p>
          <a className="lf-contact-link" href={`mailto:${email}`}><Mail size={16} aria-hidden="true" /><span>{email}</span></a>
          <span className="lf-location"><MapPin size={16} aria-hidden="true" />Made with care, everywhere.</span>
        </div>
        <FooterGroups groups={groups} />
        <FooterNewsletter onSubscribe={onSubscribe} successMessage={successMessage} />
      </div>
      <div className="lf-blue-legal"><span>{copyright ?? `${new Date().getFullYear()} ${brand}`}</span><a href={`mailto:${email}`}>Let&apos;s make something lasting<ArrowUpRight size={15} aria-hidden="true" /></a></div>
    </div>
    {/* Original artwork is decorative. Footer navigation stays in readable HTML. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="lf-blue-landscape" src={artworkSrc ?? FOOTER_ART.blueHour} alt="" loading="lazy" decoding="async" />
  </footer></div>;
}

export function HillsideFooter({ brand = "Bellora", groups = HILL_GROUPS, email = "hello@bellora.example", description = "A little slower. A little closer.", copyright, className, id, homeHref = "/", artworkSrc, theme = "auto" }: LandscapeFooterProps) {
  return <div className="lf-container"><footer id={id} className={["lf-footer lf-hillside", className].filter(Boolean).join(" ")} data-theme={theme === "auto" ? undefined : theme}>
    <div className="lf-hillside-scene">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lf-hillside-landscape" src={artworkSrc ?? FOOTER_ART.hillside} alt="" loading="lazy" decoding="async" />
      <div className="lf-hillside-content">
      <div className="lf-hillside-brand"><a className="lf-hillside-wordmark" href={homeHref} aria-label={`${brand} home`}>{brand}</a><p>{description}</p></div>
      </div>
    </div>
    <div className="lf-hillside-bottom">
      <div className="lf-hillside-links"><FooterGroups groups={groups} /></div>
      <div className="lf-hillside-legal"><span>{copyright ?? `${new Date().getFullYear()} ${brand}`}</span><a href={`mailto:${email}`}>{email}</a></div>
    </div>
  </footer></div>;
}
