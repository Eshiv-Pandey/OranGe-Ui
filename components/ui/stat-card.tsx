import type { ReactNode } from "react";
import { isValidElement } from "react";
import { cva } from "class-variance-authority";
import { z } from "zod";
import "../../styles/stat-card.css";

function isNode(value: unknown): boolean {
  return value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || isValidElement(value) || (Array.isArray(value) && value.every(isNode));
}

const nodeSchema = z.custom<ReactNode>(isNode, "Expected renderable content");
const statSchema = z.object({ label: z.string().min(1), value: z.union([z.string().min(1), z.number()]) });

export const statCardPropsSchema = z.object({
  appearance: z.enum(["polished", "pixel"]).optional(),
  accent: z.enum(["lime", "mint", "amber", "sky", "coral"]).default("lime"),
  counter: z.string().min(1),
  art: nodeSchema,
  title: z.string().min(1),
  subtitle: z.string().min(1),
  stats: z.tuple([statSchema, statSchema]),
  footer: nodeSchema,
  href: z.string().regex(/^(https?:\/\/|\/|#|\.\/|\.\.\/)/, "Use an http, https, relative, or fragment link").optional(),
  className: z.string().optional(),
});

export type StatCardProps = z.input<typeof statCardPropsSchema>;

export const statCardMeta = {
  name: "StatCard",
  purpose: "Present a compact visual summary with two related statistics.",
  whenToUse: ["Compare a small collection of projects, components, or milestones.", "Link a visual summary to its detail page."],
  whenNotToUse: ["Dense tables or more than two statistics.", "Nested interactive controls inside a linked card."],
  props: statCardPropsSchema,
  composesWith: ["Button", "Input"],
  example: '<StatCard accent="lime" counter="01 / 05" art={<span>01</span>} title="Button" subtitle="A solid first impression" stats={[{label:"Variants",value:3},{label:"States",value:6}]} footer="Ready to use" href="#button" />',
} as const;

const cardVariants = cva("stat-card", {
  variants: { accent: { lime: "stat-card--lime", mint: "stat-card--mint", amber: "stat-card--amber", sky: "stat-card--sky", coral: "stat-card--coral" } },
  defaultVariants: { accent: "lime" },
});

export function StatCard({ appearance = "polished", accent = "lime", counter, art, title, subtitle, stats, footer, href, className }: StatCardProps) {
  const content = <>
    <div className="stat-card__art" aria-hidden="true">
      <div className="stat-card__tab"><span className="stat-card__hatch" /><span>FIELD NOTES</span></div>
      <div className="stat-card__illustration">{art}</div>
      <span className="stat-card__index">{counter}</span>
    </div>
    <div className="stat-card__heading"><h3 className="pixel-type">{title}</h3>{href && <span className="stat-card__arrow" aria-hidden="true">↗</span>}</div>
    <p className="stat-card__subtitle">{subtitle}</p>
    <dl className="stat-card__stats">{stats.map((stat, index) => <div key={index}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
    <div className="stat-card__footer"><span className="stat-card__footer-dot" aria-hidden="true" />{footer}</div>
  </>;
  const classes = cardVariants({ accent, className });
  return href ? <a data-appearance={appearance} className={`${classes} stat-card--linked`} href={href}>{content}</a> : <article data-appearance={appearance} className={classes}>{content}</article>;
}
