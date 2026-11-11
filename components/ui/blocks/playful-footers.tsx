"use client";

import { ArrowUpRight, ArrowRight, Mail, Sparkles } from "lucide-react";
import "../../../styles/playful-footers.css";

export type PlayfulFooterLink = { label: string; href: string };
export type PlayfulFooterGroup = { title: string; links: readonly PlayfulFooterLink[] };
export type PlayfulFooterProps = {
  appearance?: "polished";
  brand?: string;
  homeHref?: string;
  groups?: readonly PlayfulFooterGroup[];
  email?: string;
  copyright?: string;
  className?: string;
  id?: string;
  theme?: "light" | "dark" | "auto";
};

export const PLAYFUL_FOOTER_ART = {
  sprout: "/art/footer/playful-colony-sprout.webp",
  fold: "/art/footer/playful-colony-fold.webp",
  pebble: "/art/footer/playful-colony-pebble.webp",
  spark: "/art/footer/playful-sticker-spark.webp",
  smile: "/art/footer/playful-sticker-smile.webp",
  sun: "/art/footer/playful-sticker-sun.webp",
  eye: "/art/footer/playful-sticker-eye.webp",
} as const;

const studioGroups: readonly PlayfulFooterGroup[] = [{ title: "Follow along", links: [
  { label: "Journal", href: "/journal" }, { label: "Instagram", href: "https://example.com/instagram" },
  { label: "LinkedIn", href: "https://example.com/linkedin" },
] }];
const colonyGroups: readonly PlayfulFooterGroup[] = [
  { title: "Make together", links: [{ label: "Our approach", href: "/about" }, { label: "Find your people", href: "/team" }, { label: "Start a project", href: "/contact" }] },
  { title: "Take a look", links: [{ label: "Selected work", href: "/work" }, { label: "The journal", href: "/journal" }, { label: "Open roles", href: "/careers" }] },
  { title: "Around here", links: [{ label: "Instagram", href: "https://example.com/instagram" }, { label: "LinkedIn", href: "https://example.com/linkedin" }, { label: "Get in touch", href: "/contact" }] },
];

export type StudioFooterProps = PlayfulFooterProps & {
  office?: string;
  officeHref?: string;
  careers?: PlayfulFooterLink;
  contactAction?: PlayfulFooterLink;
};

/** A blue studio close with an oversized live wordmark and original sticker art. */
export function StudioFooter({
  brand = "morrow", homeHref = "/", groups = studioGroups, email = "hello@example.com",
  office = "A little studio.\nNew Delhi, India.", officeHref = "/contact",
  careers = { label: "Good people.\nGreat work.", href: "/careers" },
  contactAction = { label: "Start a conversation", href: "/contact" },
  copyright = `${new Date().getFullYear()} Morrow Studio`, className, id, theme = "auto",
}: StudioFooterProps) {
  return <footer id={id} className={["pf-studio", className].filter(Boolean).join(" ")} data-theme={theme}>
    <div className="pf-studio-frame">
      <div className="pf-studio-top">
        <a className="pf-studio-work" href={careers.href}>Let&apos;s make something<Sparkles size={18} aria-hidden="true" /></a>
        <a className="pf-studio-small-brand" href={homeHref} aria-label={`${brand} home`}>{brand}</a>
        <a className="pf-studio-mail" href={`mailto:${email}`} aria-label={`Email ${brand}`}><Mail size={22} aria-hidden="true" /></a>
      </div>
      <div className="pf-studio-board">
        <div className="pf-studio-columns">
          <section className="pf-studio-column"><h2>Work with us</h2><a className="pf-studio-main-link" href={careers.href}>{careers.label}<ArrowUpRight size={23} aria-hidden="true" /></a></section>
          <section className="pf-studio-column"><h2>Find us</h2><p className="pf-studio-address">{office}</p><a className="pf-studio-direction" href={officeHref}>Get directions<ArrowUpRight size={17} aria-hidden="true" /></a></section>
          <section className="pf-studio-column"><h2>Say hello</h2><a className="pf-studio-main-link pf-studio-email" href={`mailto:${email}`}>{email}</a><a className="pf-studio-contact" href={contactAction.href}>{contactAction.label}<ArrowRight size={17} aria-hidden="true" /></a>
            {groups.map(group => <nav className="pf-studio-socials" key={group.title} aria-label={group.title}>{group.links.map(link => <a key={link.label + link.href} href={link.href}>{link.label}</a>)}</nav>)}
          </section>
        </div>
        <div className="pf-studio-signature" aria-hidden="true">
          <span className="pf-studio-wordmark" style={{ fontSize: `clamp(60px, ${Math.min(29, 155 / Math.max(brand.length, 1))}cqi, 360px)` }}>{brand}</span>
          {/* The art is decorative; every navigation action remains a native link. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-studio-sticker pf-sticker-sun" src={PLAYFUL_FOOTER_ART.sun} alt="" width={240} height={240} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-studio-sticker pf-sticker-smile" src={PLAYFUL_FOOTER_ART.smile} alt="" width={240} height={240} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-studio-sticker pf-sticker-spark" src={PLAYFUL_FOOTER_ART.spark} alt="" width={240} height={240} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-studio-sticker pf-sticker-eye" src={PLAYFUL_FOOTER_ART.eye} alt="" width={240} height={240} />
        </div>
        <div className="pf-studio-legal"><span>{copyright}</span><a href={homeHref}>Back to home<ArrowUpRight size={13} aria-hidden="true" /></a></div>
      </div>
    </div>
  </footer>;
}

export type ColonyFooterProps = PlayfulFooterProps & {
  action?: PlayfulFooterLink;
  support?: PlayfulFooterLink;
  description?: string;
};

/** A quiet navigation panel visited by three original Common characters. */
export function ColonyFooter({
  brand = "Common", homeHref = "/", groups = colonyGroups, email = "hello@example.com",
  action, support = { label: "Help & support", href: "/contact" },
  description = "A little more human.", copyright = `${new Date().getFullYear()} Common Studio`,
  className, id, theme = "auto",
}: ColonyFooterProps) {
  const contact = action ?? { label: "Say hello", href: `mailto:${email}` };
  return <footer id={id} className={["pf-colony", className].filter(Boolean).join(" ")} data-theme={theme}>
    <div className="pf-colony-ground" aria-hidden="true" />
    <div className="pf-colony-art" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-colony-sprout" src={PLAYFUL_FOOTER_ART.sprout} alt="" width={360} height={360} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pf-colony-fold" src={PLAYFUL_FOOTER_ART.fold} alt="" width={360} height={360} />
    </div>
    <div className="pf-colony-card">
      <div className="pf-colony-columns">
        <a className="pf-colony-brand" href={homeHref} aria-label={`${brand} home`}><span className="pf-colony-brand-mark" aria-hidden="true"><span /><span /></span>{brand}</a>
        <div className="pf-colony-navigation">{groups.map(group => <nav key={group.title} aria-label={group.title}><h2>{group.title}</h2>{group.links.map(link => <a key={link.label + link.href} href={link.href}>{link.label}</a>)}</nav>)}</div>
        <a className="pf-colony-action" href={contact.href}>{contact.label}<ArrowUpRight size={19} aria-hidden="true" /></a>
      </div>
      <div className="pf-colony-bottom"><div><span>{copyright}</span><p>{description}</p></div><a href={support.href}>{support.label}<ArrowUpRight size={14} aria-hidden="true" /></a></div>
    </div>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="pf-colony-pebble" aria-hidden="true" src={PLAYFUL_FOOTER_ART.pebble} alt="" width={360} height={360} />
  </footer>;
}
