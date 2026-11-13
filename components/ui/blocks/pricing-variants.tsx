"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Ticket } from "lucide-react";
import { BlockFeedback, BlockFrame, useBlockSubmission, type BlockProps } from "./shared";
import "../../../styles/pricing-variants.css";

export type GlassPlan = { id: string; name: string; description: string; monthly: number; yearly: number; features: string[]; featured?: boolean };
export type BillingPeriod = "monthly" | "yearly";
export type GlassPricingProps = BlockProps & { title?: string; description?: string; plans?: GlassPlan[]; currency?: string; onChoose?: (plan: string, billing: BillingPeriod) => void | Promise<void> };
const glassPlans: GlassPlan[] = [
  { id: "free", name: "Free", description: "A little room to get started.", monthly: 0, yearly: 0, features: ["A personal workspace", "Three active projects", "Notes and simple lists", "Your ideas, together"] },
  { id: "studio", name: "Studio", description: "For your next good chapter.", monthly: 9, yearly: 90, features: ["Everything in Free", "Unlimited active projects", "Shared project views", "Reusable templates", "Space for your team"] },
  { id: "collective", name: "Collective", description: "Better work, made together.", monthly: 19, yearly: 190, features: ["Everything in Studio", "Flexible team spaces", "Advanced permissions", "Custom workflows", "Priority support"], featured: true },
];
function price(value: number, currency: string) {
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount); }
}
export function GlassPricing({ title = "Room for your next\ngood idea.", description = "Start small. Make space when you need it.", plans = glassPlans, currency = "USD", onChoose, ...props }: GlassPricingProps) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");
  const [chosen, setChosen] = useState("");
  const submission = useBlockSubmission();
  async function choose(plan: GlassPlan) { if (onChoose && await submission.run(() => onChoose(plan.id, billing))) setChosen(`${plan.name} selected with ${billing} billing.`); }
  return <BlockFrame {...props} className={`sb-section mp-glass ${props.className ?? ""}`}><div className="mp-glass-light" aria-hidden="true" /><header><h2>{title}</h2><p>{description}</p></header><div className="mp-glass-plans">{plans.length ? plans.map(plan => <article className="mp-glass-plan" data-featured={Boolean(plan.featured)} key={plan.id}><div><h3>{plan.name}</h3><div className="mp-glass-price" aria-live="polite"><strong>{(billing === "monthly" ? plan.monthly : plan.yearly) === 0 ? "Free" : price(billing === "monthly" ? plan.monthly : plan.yearly, currency)}</strong>{(billing === "monthly" ? plan.monthly : plan.yearly) !== 0 && <span>/ {billing === "monthly" ? "month" : "year"}</span>}</div><p>{plan.description}</p></div><ul>{plan.features.map(feature => <li key={feature}><span><Check size={13} aria-hidden="true" /></span>{feature}</li>)}</ul><button type="button" disabled={!onChoose || submission.pending} onClick={() => choose(plan)}>Choose {plan.name}<ArrowUpRight size={16} aria-hidden="true" /></button></article>) : <p className="mp-empty">No plans to show yet.</p>}</div><div className="mp-glass-billing" role="group" aria-label="Billing period">{(["monthly", "yearly"] as const).map(period => <button type="button" key={period} aria-pressed={billing === period} disabled={submission.pending} onClick={() => { setBilling(period); setChosen(""); submission.reset(); }}>{period === "monthly" ? "Monthly" : "Yearly"}</button>)}</div><BlockFeedback {...submission} success={chosen} /></BlockFrame>;
}

export type PricingTicket = { id: string; name: string; description: string; price: number; unit: string; features: string[]; featured?: boolean };
export type TicketPricingProps = BlockProps & { brand?: string; title?: string; description?: string; tickets?: PricingTicket[]; groupOffer?: PricingTicket | null; currency?: string; onChoose?: (id: string) => void | Promise<void> };
const tickets: PricingTicket[] = [
  { id: "hour", name: "One hour", description: "A little time to find your focus.", price: 12, unit: "session", features: ["Your own desk", "Extend when you need to"] },
  { id: "morning", name: "Three hours", description: "Settle in. Make something.", price: 30, unit: "session", features: ["A proper place to work", "Coffee and a good seat"] },
  { id: "night", name: "Night owl", description: "For the ideas that arrive late.", price: 64, unit: "night", features: ["A whole evening of space", "Quiet corners to focus"], featured: true },
  { id: "day", name: "All day", description: "A day with room to breathe.", price: 90, unit: "day", features: ["Come and go as you like", "Breaks on your own time"] },
];
const teamPass: PricingTicket = { id: "team", name: "Good company", description: "A shared session for your team.", price: 40, unit: "team session", features: [] };
export function TicketPricing({ brand = "DAYPASS", title = "Make room.\nMake a day of it.", description = "A little time, a good place, and your next idea. Pick the ticket that fits your day.", tickets: plans = tickets, groupOffer = teamPass, currency = "USD", onChoose, ...props }: TicketPricingProps) {
  const submission = useBlockSubmission();
  const [chosen, setChosen] = useState("");
  async function choose(plan: PricingTicket) { if (onChoose && await submission.run(() => onChoose(plan.id))) setChosen(`${plan.name} selected.`); }
  return <BlockFrame {...props} className={`sb-section mp-tickets ${props.className ?? ""}`}><header><div className="mp-ticket-brand"><Ticket size={24} aria-hidden="true" />{brand}</div><h2>{title}</h2><p>{description}</p></header><div className="mp-ticket-stage"><div className="mp-ticket-grid">{plans.length ? plans.map(plan => <article className="mp-ticket" data-featured={Boolean(plan.featured)} key={plan.id}><div className="mp-ticket-top"><h3>{plan.name}</h3><p>{plan.description}</p>{plan.featured && <span>More room</span>}</div><div className="mp-ticket-bottom"><div className="mp-ticket-price"><strong>{price(plan.price, currency)}</strong><span>/ {plan.unit}</span></div><ul>{plan.features.map(feature => <li key={feature}><Check size={12} aria-hidden="true" />{feature}</li>)}</ul><button type="button" disabled={!onChoose || submission.pending} onClick={() => choose(plan)}>Choose {plan.name}<ArrowUpRight size={14} aria-hidden="true" /></button></div></article>) : <p className="mp-empty">No tickets to show yet.</p>}</div>{groupOffer && <div className="mp-group-pass"><div><h3>{groupOffer.name}</h3><p>{groupOffer.description}</p></div><button type="button" aria-label={`Choose ${groupOffer.name}`} disabled={!onChoose || submission.pending} onClick={() => choose(groupOffer)}><span>{price(groupOffer.price, currency)}<small>/ {groupOffer.unit}</small></span><ArrowUpRight size={19} aria-hidden="true" /></button></div>}<BlockFeedback {...submission} success={chosen} /></div></BlockFrame>;
}
