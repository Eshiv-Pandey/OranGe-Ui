"use client";

import { useId, useState } from "react";
import { ArrowUpRight, Check, Circle, Flower2, Leaf, MoveUpRight, Radio, Sun, Waves, Zap } from "lucide-react";
import { NeonSign404 } from "../neon-sign-404";
import { BlockFrame, BlockPhoto, type BlockAction, type BlockProps } from "./shared";
import { SectionArt, SectionLink, SectionPhone, SectionRosette } from "./section-visuals";
import "../../../styles/bento-variants.css";

export type WildseedBentoProps = BlockProps & {
  brand?: string; title?: string; description?: string; action?: BlockAction;
  images?: { forest?: string; coast?: string; flowers?: string };
};

export function WildseedBento({ brand = "wildseed", title = "Little shifts.\nLasting roots.", description = "Good things grow when we make a little room.", action = { label: "Explore our world", href: "#about" }, images, ...props }: WildseedBentoProps) {
  return <BlockFrame {...props} className={`sb-section sb-wildseed ${props.className ?? ""}`}>
    <div className="sb-wild-grid">
      <article className="sb-wild-start"><h2>GROW<br />YOUR<br />OWN WAY.</h2><SectionArt kind="sprout" /></article>
      <div className="sb-photo-cell sb-wild-forest"><BlockPhoto photo="forest" src={images?.forest} alt="Sunlight through a forest canopy" /></div>
      <article className="sb-wild-message"><h2>{title}</h2><Leaf size={58} strokeWidth={1.4} aria-hidden="true" /></article>
      <div className="sb-photo-cell sb-wild-flowers"><BlockPhoto photo="flowers" src={images?.flowers} alt="A field of small summer flowers" /></div>
      <div className="sb-wild-brand"><Flower2 aria-hidden="true" /><h2>{brand}</h2></div>
      <article className="sb-wild-side"><h3>MAKE ROOM<br />FOR BETTER.</h3></article>
      <div className="sb-photo-cell sb-wild-coast"><BlockPhoto photo="coast" src={images?.coast} alt="Waves meeting a quiet coastline" /></div>
      <article className="sb-wild-copy"><h3>LESS WASTE.<br />MORE WONDER.</h3><p>{description}</p></article>
      <div className="sb-wild-action"><SectionLink action={action} /></div>
      <div className="sb-wild-friend"><SectionArt kind="fold" /><span>A fresh perspective.</span></div>
    </div>
  </BlockFrame>;
}

export type CurrentBentoProps = BlockProps & {
  brand?: string; title?: string; description?: string; action?: BlockAction;
  images?: { city?: string; coast?: string; road?: string };
};

export function CurrentBento({ brand = "current", title = "Go somewhere\nthat moves you.", description = "The everyday, with a different point of view.", action = { label: "Find your next move", href: "#collection" }, images, ...props }: CurrentBentoProps) {
  return <BlockFrame {...props} className={`sb-section sb-current ${props.className ?? ""}`}>
    <div className="sb-current-grid">
      <div className="sb-photo-cell sb-current-city"><BlockPhoto photo="city" src={images?.city} alt="Architecture from a different perspective" /><span>TAKE THE<br />LONG WAY.</span></div>
      <div className="sb-photo-cell sb-current-coast"><BlockPhoto photo="coast" src={images?.coast} alt="An open coastline" /><span>OUT OF<br />OFFICE.</span></div>
      <div className="sb-current-signal"><Zap size={96} strokeWidth={1.5} aria-hidden="true" /></div>
      <article className="sb-current-type"><h2>{title}</h2><MoveUpRight size={48} aria-hidden="true" /></article>
      <div className="sb-current-phone"><SectionPhone brand={brand} /></div>
      <div className="sb-current-brand"><Waves size={54} aria-hidden="true" /><h2>{brand}<span>.</span></h2><p>{description}</p></div>
      <div className="sb-current-sticker"><SectionArt kind="eye" /><span>See things<br />differently.</span></div>
      <div className="sb-photo-cell sb-current-road"><BlockPhoto photo="road" src={images?.road} alt="A road winding toward distant mountains" /></div>
      <div className="sb-current-poster"><strong>CHANGE<br />THE SCENE.</strong><ArrowUpRight size={36} aria-hidden="true" /></div>
      <div className="sb-current-orbit"><SectionRosette /></div>
      <div className="sb-current-note"><h3>A little less<br />ordinary.</h3><Sun size={38} aria-hidden="true" /></div>
      <div className="sb-current-action"><SectionLink action={action} /></div>
    </div>
  </BlockFrame>;
}

export type RevenuePeriod = { id: string; label: string; revenue: number; users: number; growth: string; series: number[] };
const revenuePeriods: RevenuePeriod[] = [
  { id: "month", label: "Monthly", revenue: 24414, users: 78000, growth: "+10%", series: [22, 29, 24, 42, 36, 48, 52, 47, 65, 59, 76, 84] },
  { id: "quarter", label: "Quarterly", revenue: 73242, users: 92000, growth: "+18%", series: [18, 28, 34, 30, 44, 52, 48, 61, 72, 68, 80, 94] },
];
export type RevenueBentoProps = BlockProps & {
  brand?: string; title?: string; action?: BlockAction; periods?: RevenuePeriod[];
  currency?: string; rating?: string; customerQuote?: string; customerName?: string;
};

export function RevenueBento({ brand = "folio", title = "The whole picture.\nA clearer view.", action = { label: "Explore the workspace", href: "#workspace" }, periods = revenuePeriods, currency = "USD", rating = "4.9", customerQuote = "A little clarity changes everything.", customerName = "Alex, studio owner", ...props }: RevenueBentoProps) {
  const [chosen, setChosen] = useState(""), chartId = useId();
  const current = periods.find(period => period.id === chosen) ?? periods[0];
  const values = current?.series ?? [], max = Math.max(1, ...values);
  const format = (value: number) => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const area = values.length ? `M0 150 ${values.map((value, index) => `L${index * 400 / Math.max(1, values.length - 1)} ${140 - value / max * 110}`).join(" ")} L400 150Z` : "";
  return <BlockFrame {...props} className={`sb-section sb-revenue ${props.className ?? ""}`}>
    <div className="sb-revenue-grid">
      <div className="sb-revenue-brand"><h2>{brand}<Circle size={9} fill="currentColor" aria-hidden="true" /></h2></div>
      <div className="sb-revenue-app"><h3>Your work.<br />Within reach.</h3><SectionPhone brand={brand} /></div>
      <article className="sb-revenue-users" aria-live="polite"><span>New users</span><strong>{current ? new Intl.NumberFormat("en", { notation: "compact" }).format(current.users) : "0"}</strong><span className="sb-revenue-growth">{current?.growth ?? "No data"}</span></article>
      <article className="sb-revenue-rating"><span>Community rating</span><strong>{rating}<ArrowUpRight size={23} aria-hidden="true" /></strong><div className="sb-revenue-avatars" aria-hidden="true"><span>AL</span><span>RM</span><span>JK</span></div></article>
      <article className="sb-revenue-story"><h2>{title}</h2><SectionRosette /><SectionLink action={action} /></article>
      <article className="sb-revenue-quote"><div><SectionArt kind="pebble" /></div><blockquote>{customerQuote}</blockquote><span>{customerName}</span></article>
      <article className="sb-revenue-chart">
        <div className="sb-revenue-chart-top"><h3>Revenue rhythm</h3>{periods.length > 0 && <div role="group" aria-label="Revenue period">{periods.map(period => <button type="button" key={period.id} aria-pressed={period.id === current?.id} aria-controls={chartId} onClick={() => setChosen(period.id)}>{period.label}</button>)}</div>}</div>
        <div id={chartId} aria-live="polite"><svg viewBox="0 0 400 150" preserveAspectRatio="none" role="img" aria-label={`${current?.label ?? "No"} revenue trend: ${values.join(", ") || "no data"}`}><path d={area} fill="#b59aec" /><path d={area} fill="#d8c8fa" transform="translate(0 25)" /><path d={area} fill="#efe7ff" transform="translate(0 47)" /></svg><div className="sb-revenue-total"><span>{current?.label ?? "No"} revenue</span><strong>{format(current?.revenue ?? 0)}</strong></div></div>
      </article>
      <article className="sb-revenue-donut"><div className="sb-revenue-donut-shape" aria-hidden="true"><span>+23%</span></div><h3>Room to grow.</h3><p>From the first idea<br />to the next chapter.</p></article>
    </div>
    <p className="sb-sample">Illustrative workspace data and community story.</p>
  </BlockFrame>;
}

export type StudioBentoProject = { name: string; category: string; href: string; art: "spark" | "smile" | "sun" | "eye" | "fold" | "pebble"; color: "lime" | "pink" | "yellow" | "purple" };
const studioProjects: StudioBentoProject[] = [
  { name: "A brighter start", category: "Brand identity", href: "#work", art: "sun", color: "lime" },
  { name: "Good company", category: "Digital experience", href: "#work", art: "smile", color: "pink" },
  { name: "Fresh perspective", category: "Art direction", href: "#work", art: "eye", color: "yellow" },
];
export type StudioBentoProps = BlockProps & { brand?: string; title?: string; description?: string; action?: BlockAction; projects?: StudioBentoProject[] };

export function StudioBento({ brand = "SIDEQUEST", title = "Good work.\nA little weird.", description = "A small independent studio for brands with a point of view.", action = { label: "Start something", href: "#contact" }, projects = studioProjects, ...props }: StudioBentoProps) {
  return <BlockFrame {...props} className={`sb-section sb-studio ${props.className ?? ""}`}>
    <header className="sb-studio-header"><h2>{brand}<span aria-hidden="true">*</span></h2><SectionLink action={action} /></header>
    <div className="sb-studio-grid">
      <article className="sb-studio-intro"><h2>{title}</h2><p>{description}</p><span>Design / Digital / Delight</span></article>
      <article className="sb-studio-board"><div className="sb-studio-window"><span><i /><i /><i /></span>ideas.board<Flower2 size={16} aria-hidden="true" /></div><SectionArt kind="spark" /><span className="sb-studio-stamp">A FRESH<br />PAIR OF EYES.</span></article>
      <article className="sb-studio-checklist"><div className="sb-studio-window"><span><i /><i /><i /></span>the.plan</div><h3>Less talk.<br />More making.</h3><ul>{["Find the good idea", "Make it feel right", "Put it into the world"].map(item => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul></article>
      {projects.map(project => <a key={project.name} href={project.href} className="sb-studio-project" data-color={project.color}><div className="sb-studio-window"><span><i /><i /><i /></span>{project.category}<ArrowUpRight size={18} aria-hidden="true" /></div><div className="sb-studio-project-art"><SectionArt kind={project.art} /></div><h3>{project.name}</h3></a>)}
    </div>
  </BlockFrame>;
}

export type NeonBentoProps = BlockProps & { brand?: string; title?: string; description?: string; action?: BlockAction; hours?: { day: string; time: string }[]; signText?: string; flicker?: boolean; imageSrc?: string };

export function NeonBento({ brand = "Nightshift", title = "Small hours.\nBig ideas.", description = "A creative space for the things that keep you up at night.", action = { label: "Step inside", href: "#studio" }, hours = [{ day: "Mon - Fri", time: "18:00 - 02:00" }, { day: "Saturday", time: "16:00 - late" }], signText = "OPEN", flicker = true, imageSrc, ...props }: NeonBentoProps) {
  return <BlockFrame {...props} className={`sb-section sb-neon sb-neon-bento ${props.className ?? ""}`}>
    <div className="sb-neon-grid">
      <article className="sb-neon-intro"><span className="sb-neon-brand"><Radio size={22} aria-hidden="true" />{brand}</span><h2>{title}</h2><p>{description}</p><SectionLink action={action} /></article>
      <div className="sb-neon-sign-cell"><NeonSign404 digits={signText} flicker={flicker} sound={false} size={180} /></div>
      <article className="sb-neon-hours"><div><Sun size={24} aria-hidden="true" /><h3>After the everyday.</h3></div><dl>{hours.map(hour => <div key={hour.day}><dt>{hour.day}</dt><dd>{hour.time}</dd></div>)}</dl><p>Come as you are.<br />Stay for the good ideas.</p></article>
      <div className="sb-photo-cell sb-neon-photo"><BlockPhoto photo="night" src={imageSrc} alt="A city coming alive after dark" /><span>THE NIGHT<br />IS STILL YOUNG.</span></div>
      <article className="sb-neon-note"><Zap size={34} aria-hidden="true" /><h3>Leave a little<br />light on.</h3><span>For your next good idea.</span></article>
    </div>
  </BlockFrame>;
}
