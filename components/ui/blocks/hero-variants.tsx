"use client";

import { ArrowDown, Flower2, Radio, Sun } from "lucide-react";
import { NeonSign404 } from "../neon-sign-404";
import { BlockFrame, type BlockAction, type BlockProps } from "./shared";
import { SectionArt, SectionLink } from "./section-visuals";
import "../../../styles/hero-variants.css";

export type PlaygroundHeroProps = BlockProps & {
  brand?: string; title?: string; description?: string; primaryAction?: BlockAction;
  secondaryAction?: BlockAction; navigation?: BlockAction[]; note?: string;
};
export function PlaygroundHero({ brand = "Good Company", title = "Good\ncompany.", description = "Objects, ideas and little things that make an ordinary day feel a bit more yours.", primaryAction = { label: "Meet the collection", href: "#collection" }, secondaryAction = { label: "Our story", href: "#about" }, navigation = [{ label: "Objects", href: "#collection" }, { label: "About us", href: "#about" }], note = "Made for everyday joy.", ...props }: PlaygroundHeroProps) {
  const lines = title.split("\n");
  return <BlockFrame {...props} className={`sb-section sb-playground-hero ${props.className ?? ""}`}>
    <header className="sb-playground-header"><span><Flower2 size={23} aria-hidden="true" />{brand}</span><nav aria-label={`${brand} navigation`}>{navigation.map(link => <a key={link.label} href={link.href}>{link.label}</a>)}</nav></header>
    <div className="sb-playground-stage">
      <div className="sb-playground-orbit" aria-hidden="true" />
      <h1>{lines.map((line, index) => <span key={index}>{line}{index < lines.length - 1 && <span className="sr-only"> </span>}</span>)}</h1>
      <div className="sb-playground-friend"><SectionArt kind="sprout" /></div>
      <div className="sb-playground-sun"><SectionArt kind="sun" /></div>
      <span className="sb-playground-seal">A LITTLE<br />EVERYDAY<br />DELIGHT.</span>
    </div>
    <div className="sb-playground-bottom"><p>{description}</p><div><SectionLink action={primaryAction} /><a className="sb-playground-secondary" href={secondaryAction.href}>{secondaryAction.label}<ArrowDown size={16} aria-hidden="true" /></a></div><span>{note}</span></div>
  </BlockFrame>;
}

export type OddkinHeroProps = BlockProps & { brand?: string; title?: string; description?: string; primaryAction?: BlockAction; secondaryAction?: BlockAction; note?: string };
export function OddkinHero({ brand = "oddkin", title = "Make room\nfor the odd.", description = "A home for curious objects and the people who see things a little differently.", primaryAction = { label: "Find your kind", href: "#collection" }, secondaryAction = { label: "Meet the studio", href: "#about" }, note = "GOOD IDEAS COME IN ALL SHAPES.", ...props }: OddkinHeroProps) {
  return <BlockFrame {...props} className={`sb-section sb-oddkin-hero ${props.className ?? ""}`}>
    <header className="sb-oddkin-header"><span><Sun size={24} aria-hidden="true" />{brand}</span><a href={secondaryAction.href}>{secondaryAction.label}<Flower2 size={18} aria-hidden="true" /></a></header>
    <div className="sb-oddkin-copy"><h1>{title}</h1><div><SectionLink action={primaryAction} /><p>{description}</p></div></div>
    <div className="sb-oddkin-creatures" aria-hidden="true"><SectionArt kind="sprout" /><SectionArt kind="fold" /><SectionArt kind="pebble" /></div>
    <div className="sb-oddkin-ground"><svg viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40Q60 5 120 43T245 40Q280 12 320 47T420 45Q460 12 510 50T620 45Q665 0 720 42T820 45Q860 12 900 40T1005 38Q1050 3 1100 43T1200 40V90H0Z" /></svg><span>{note}</span><Flower2 size={30} aria-hidden="true" /></div>
  </BlockFrame>;
}

export type WovenHeroProps = BlockProps & { brand?: string; title?: string; description?: string; primaryAction?: BlockAction; secondaryAction?: BlockAction; imageSrc?: string; note?: string };
export function WovenHero({ brand = "Afterimage", title = "Stay with\nthe feeling.", description = "An independent creative practice for identities, experiences and ideas that leave an impression.", primaryAction = { label: "Explore the work", href: "#work" }, secondaryAction = { label: "Start a conversation", href: "#contact" }, imageSrc = "/art/sections/woven-glow.webp", note = "A different way of seeing.", ...props }: WovenHeroProps) {
  return <BlockFrame {...props} className={`sb-section sb-woven-hero ${props.className ?? ""}`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- Original portable procedural material, eager above the fold. */}
    <img className="sb-woven-material" src={imageSrc} alt="" loading="eager" decoding="async" />
    <header className="sb-woven-header"><span><Flower2 size={23} aria-hidden="true" />{brand}</span><a href={secondaryAction.href}>{secondaryAction.label}</a></header>
    <div className="sb-woven-copy"><h1>{title}</h1><p>{description}</p><SectionLink action={primaryAction} /></div>
    <div className="sb-woven-foot"><span>{note}</span><ArrowDown size={22} aria-hidden="true" /><span>Identity / Digital / Art direction</span></div>
  </BlockFrame>;
}

export type NeonHeroProps = BlockProps & { brand?: string; title?: string; description?: string; primaryAction?: BlockAction; secondaryAction?: BlockAction; signText?: string; flicker?: boolean; note?: string };
export function NeonHero({ brand = "Nightshift", title = "Made after\nhours.", description = "An independent studio for bright ideas, late conversations and work that has a little soul.", primaryAction = { label: "Come on in", href: "#work" }, secondaryAction = { label: "Meet the studio", href: "#about" }, signText = "OPEN", flicker = true, note = "Stay curious. Stay a little longer.", ...props }: NeonHeroProps) {
  return <BlockFrame {...props} className={`sb-section sb-neon sb-neon-hero ${props.className ?? ""}`}>
    <header className="sb-neon-hero-header"><span className="sb-neon-brand"><Radio size={22} aria-hidden="true" />{brand}</span><a href={secondaryAction.href}>{secondaryAction.label}</a></header>
    <div className="sb-neon-hero-layout"><div className="sb-neon-hero-copy"><h1>{title}</h1><p>{description}</p><SectionLink action={primaryAction} /></div><div className="sb-neon-hero-sign"><NeonSign404 digits={signText} flicker={flicker} sound={false} size={230} /></div></div>
    <div className="sb-neon-hero-foot"><span><i aria-hidden="true" />{note}</span><a href={primaryAction.href}>Follow the light<ArrowDown size={16} aria-hidden="true" /></a></div>
  </BlockFrame>;
}
