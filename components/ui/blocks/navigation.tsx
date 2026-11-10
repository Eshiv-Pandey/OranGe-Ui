"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { BlockActionLink, BlockBrand, BlockFrame, type BlockAction, type BlockLink, type BlockProps } from "./shared";

export type SiteHeaderProps = BlockProps & { brand?: string; homeHref?: string; links?: BlockLink[]; action?: BlockAction };
export function SiteHeader({ brand = "Daylight", homeHref, links = [{ label: "Our approach", href: "#about" }, { label: "Features", href: "#features" }, { label: "Plans", href: "#pricing" }], action = { label: "Get in touch", href: "#contact" }, ...props }: SiteHeaderProps) {
  const [open, setOpen] = useState(false), navigationId = useId(), trigger = useRef<HTMLButtonElement>(null);
  return <BlockFrame {...props} className={`ob-site-header ${props.className ?? ""}`}><BlockBrand name={brand} href={homeHref} /><button type="button" ref={trigger} className="ob-menu-toggle" aria-expanded={open} aria-controls={navigationId} aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button><nav id={navigationId} className="ob-site-nav" data-open={open} aria-label={`${brand} navigation`} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>{links.map(link => <a key={link.href + link.label} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}<BlockActionLink action={action} /></nav></BlockFrame>;
}

export type SiteFooterProps = BlockProps & { brand?: string; description?: string; groups?: { title: string; links: BlockLink[] }[]; copyright?: string };
export function SiteFooter({ brand = "Daylight", description = "Make a little space for good work.", groups = [{ title: "Explore", links: [{ label: "Our approach", href: "#about" }, { label: "Features", href: "#features" }, { label: "Plans", href: "#pricing" }] }, { title: "Say hello", links: [{ label: "Contact us", href: "#contact" }, { label: "The journal", href: "#journal" }, { label: "Meet the team", href: "#team" }] }], copyright, ...props }: SiteFooterProps) {
  return <BlockFrame {...props} className={`ob-site-footer ${props.className ?? ""}`}><div className="ob-footer-top"><div><BlockBrand name={brand} /><h2>{description}</h2></div><div className="ob-footer-groups">{groups.map(group => <nav key={group.title} aria-label={group.title}><h3>{group.title}</h3>{group.links.map(link => <a key={link.label} href={link.href}>{link.label}</a>)}</nav>)}</div></div><div className="ob-footer-bottom"><span>{copyright ?? `${new Date().getFullYear()} ${brand}`}</span><span>Thoughtfully made, every day.</span></div></BlockFrame>;
}

export type AnnouncementBarProps = BlockProps & { text?: string; link?: BlockAction; dismissible?: boolean; onDismiss?: () => void };
export function AnnouncementBar({ text = "A fresh chapter is here. Come take a look.", link = { label: "What's new", href: "#updates" }, dismissible = true, onDismiss, ...props }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <BlockFrame {...props} className={`ob-announcement ${props.className ?? ""}`}><p>{text}</p><a href={link.href}>{link.label}<ArrowRight size={15} aria-hidden="true" /></a>{dismissible && <button type="button" aria-label="Dismiss announcement" onClick={() => { setDismissed(true); onDismiss?.(); }}><X size={17} /></button>}</BlockFrame>;
}
