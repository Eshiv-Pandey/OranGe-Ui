"use client";

import { useId, useState } from "react";
import { ArrowRight, Check, CheckCheck, Layers, MessageCircle, Plus, Puzzle, Quote } from "lucide-react";
import { Button } from "../button";
import { BlockActionLink, BlockFeedback, BlockFrame, BlockPhoto, BlockTitle, useBlockSubmission, type BlockAction, type BlockProps } from "./shared";

export type FeatureStoryProps = BlockProps & { title?: string; features?: { title: string; description: string; detail: string }[] };
export function FeatureStory({ title = "A clearer way to work together.", features = [{ title: "Find your focus", description: "Keep today's work in view, and tomorrow's ideas close by.", detail: "Your next small step" }, { title: "Make it yours", description: "Shape a space that fits the way your team thinks.", detail: "A place for every idea" }, { title: "Stay in the loop", description: "Thoughtful updates, right where the work happens.", detail: "Everyone on the same page" }], ...props }: FeatureStoryProps) {
  const [selected, setSelected] = useState(0), identity = useId();
  const current = features[selected] ?? features[0];
  return <BlockFrame {...props} className={`ob-feature-story ${props.className ?? ""}`}><div><BlockTitle title={title} /><div className="ob-feature-list" role="group" aria-label="Explore features">{features.map((feature, index) => <button type="button" key={feature.title} aria-pressed={index === selected} aria-controls={identity} onClick={() => setSelected(index)}><span><strong>{feature.title}</strong><span>{feature.description}</span></span><ArrowRight size={20} /></button>)}</div></div><div id={identity} className="ob-feature-scene" aria-live="polite"><BlockPhoto photo={selected === 1 ? "coast" : selected === 2 ? "lake" : "forest"} /><div className="ob-feature-note"><CheckCheck size={22} /><p>{current?.detail ?? "A fresh start"}</p><span>A little progress feels good.</span></div></div></BlockFrame>;
}

export type BentoOverviewProps = BlockProps & { title?: string; description?: string; notes?: string[] };
export function BentoOverview({ title = "Everything has its place.", description = "The big picture and the small details, thoughtfully together.", notes = ["A place to gather ideas", "A clear view of the work", "A moment to take a breath"], ...props }: BentoOverviewProps) {
  return <BlockFrame {...props} className={`ob-bento-overview ${props.className ?? ""}`}><BlockTitle title={title} description={description} /><div className="ob-bento-layout"><div className="ob-bento-photo"><BlockPhoto photo="coast" /><div><h3>Room to think.</h3><p>A little perspective goes a long way.</p></div></div><div className="ob-bento-list"><Layers size={26} /><h3>Bring it all together.</h3><ul>{notes.map(note => <li key={note}><Check size={17} />{note}</li>)}</ul></div><div className="ob-bento-focus"><span className="ob-focus-clock">09:41</span><div><h3>One good idea.</h3><p>That&apos;s all it takes to get started.</p></div></div></div></BlockFrame>;
}

export type PricingPlan = { id: string; name: string; description: string; monthly: number; yearly: number; features: string[]; featured?: boolean };
export type PricingSectionProps = BlockProps & { title?: string; description?: string; plans?: PricingPlan[]; currency?: string; onChoose?: (planId: string, billing: "monthly" | "yearly") => void };
const samplePlans: PricingPlan[] = [{ id: "personal", name: "Your space", description: "For your ideas and everyday work.", monthly: 0, yearly: 0, features: ["A personal workspace", "Project notes and lists", "Your own pace"] }, { id: "team", name: "Better together", description: "A shared home for your team's work.", monthly: 12, yearly: 120, features: ["Shared workspaces", "Flexible project views", "Team conversations", "Priority support"], featured: true }];
export function PricingSection({ title = "A plan that fits your day.", description = "Start where you are. Grow when you're ready.", plans = samplePlans, currency = "USD", onChoose, ...props }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly"), [chosen, setChosen] = useState("");
  return <BlockFrame {...props} className={`ob-pricing ${props.className ?? ""}`}><div className="ob-pricing-heading"><BlockTitle title={title} description={description} /><div className="ob-segment" role="group" aria-label="Billing period">{(["monthly", "yearly"] as const).map(period => <button key={period} type="button" aria-pressed={billing === period} onClick={() => { setBilling(period); setChosen(""); }}>{period === "monthly" ? "Monthly" : "Yearly"}</button>)}</div></div><div className="ob-price-plans">{plans.map(plan => <article className="ob-price-plan" data-featured={plan.featured} key={plan.id}><div className="ob-price-title"><h3>{plan.name}</h3>{plan.featured && <span className="ob-pill">Room to grow</span>}</div><p>{plan.description}</p><div className="ob-price"><strong>{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(billing === "monthly" ? plan.monthly : plan.yearly)}</strong><span>/ {billing === "monthly" ? "month" : "year"}</span></div><Button variant={plan.featured ? "primary" : "secondary"} disabled={!onChoose} onClick={() => { onChoose?.(plan.id, billing); setChosen(plan.name); }}>Choose {plan.name.toLowerCase()}<ArrowRight size={16} /></Button><ul>{plan.features.map(feature => <li key={feature}><Check size={17} />{feature}</li>)}</ul></article>)}</div><p className="ob-small ob-selection" role="status">{chosen ? `${chosen} selected with ${billing} billing.` : "Choose the plan that feels right for you."}</p></BlockFrame>;
}

export type Testimonial = { quote: string; name: string; role: string };
export type TestimonialSectionProps = BlockProps & { title?: string; testimonials?: Testimonial[] };
export function TestimonialSection({ title = "Good work feels different.", testimonials = [{ quote: "We finally have a place where the work makes sense. It feels like someone cleared the desk for us.", name: "Avery Lane", role: "Designer, Common Ground" }, { quote: "Less chasing updates. More making things we're proud of.", name: "Jamie Reed", role: "Founder, Northbank" }], ...props }: TestimonialSectionProps) {
  const [index, setIndex] = useState(0), current = testimonials[index] ?? testimonials[0];
  return <BlockFrame {...props} className={`ob-testimonials ${props.className ?? ""}`}><BlockTitle title={title} /><div className="ob-quote-layout"><Quote size={42} aria-hidden="true" /><div aria-live="polite">{current ? <><blockquote>{current.quote}</blockquote><div className="ob-quote-person"><span className="ob-initial-avatar">{current.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</span><div><strong>{current.name}</strong><span>{current.role}</span></div></div></> : <p>No stories to show yet.</p>}</div></div>{testimonials.length > 1 && <div className="ob-story-controls" role="group" aria-label="Select a story">{testimonials.map((story, position) => <button type="button" key={story.name} aria-label={`Read ${story.name}'s story`} aria-pressed={position === index} onClick={() => setIndex(position)}><span /></button>)}</div>}</BlockFrame>;
}

export type LogoCloudProps = BlockProps & { title?: string; names?: string[] };
export function LogoCloud({ title = "Different teams. A shared way forward.", names = ["Northbank", "Common Ground", "Fieldwork", "Made Studio", "Sunday"], ...props }: LogoCloudProps) {
  return <BlockFrame {...props} className={`ob-logo-cloud ${props.className ?? ""}`}><h2>{title}</h2><ul aria-label="Organizations">{names.map((name, index) => <li key={name} data-logo-style={index % 3}>{name}</li>)}</ul></BlockFrame>;
}

export type IntegrationDirectoryProps = BlockProps & { title?: string; integrations?: { id: string; name: string; description: string; connected?: boolean }[]; onToggle?: (id: string, connected: boolean) => void | Promise<void> };
export function IntegrationDirectory({ title = "Keep your favorite tools close.", integrations = [{ id: "calendar", name: "Calendar", description: "Make room for your next meeting." }, { id: "files", name: "Cloud files", description: "Put every document in reach." }, { id: "messages", name: "Team messages", description: "Keep the conversation connected.", connected: true }], onToggle, ...props }: IntegrationDirectoryProps) {
  return <BlockFrame {...props} className={`ob-integrations ${props.className ?? ""}`}><BlockTitle title={title} description="A thoughtful connection, right where you need it." /><div className="ob-integration-list">{integrations.map(item => <IntegrationRow key={item.id} item={item} onToggle={onToggle} />)}</div></BlockFrame>;
}
function IntegrationRow({ item, onToggle }: { item: NonNullable<IntegrationDirectoryProps["integrations"]>[number]; onToggle: IntegrationDirectoryProps["onToggle"] }) {
  const [override, setOverride] = useState<boolean>(), submission = useBlockSubmission(), connected = override ?? item.connected ?? false;
  async function toggle() { if (onToggle && await submission.run(() => onToggle(item.id, !connected))) setOverride(!connected); }
  return <div><div className="ob-integration-row"><span className="ob-integration-symbol"><Puzzle size={25} aria-hidden="true" /></span><div><h3>{item.name}</h3><p>{item.description}</p></div><Button variant="secondary" aria-label={`${connected ? "Disconnect" : "Connect"} ${item.name}`} disabled={!onToggle} loading={submission.pending} onClick={toggle}>{connected ? "Disconnect" : "Connect"}</Button></div><BlockFeedback {...submission} success={`${item.name} ${connected ? "connected" : "disconnected"}.`} /></div>;
}

export type FaqSectionProps = BlockProps & { title?: string; description?: string; questions?: { question: string; answer: string }[] };
export function FaqSection({ title = "A few things worth knowing.", description = "Good questions deserve clear answers.", questions = [{ question: "Where should I begin?", answer: "Start with one project and one small step. Give your ideas a place, then shape the space as you go." }, { question: "Can I work with my team?", answer: "A shared workflow starts with a shared understanding. Invite the people you work with and agree on what comes next." }, { question: "What if my plans change?", answer: "Make room for change. Revisit your priorities, move things around, and keep what still matters." }, { question: "How can I ask for help?", answer: "Get in touch with your workspace administrator or the support team for your application." }], ...props }: FaqSectionProps) {
  return <BlockFrame {...props} className={`ob-faq ${props.className ?? ""}`}><BlockTitle title={title} description={description} /><div className="ob-faq-list">{questions.map(item => <details key={item.question}><summary>{item.question}<Plus size={19} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></BlockFrame>;
}

export type CallToActionProps = BlockProps & { title?: string; description?: string; action?: BlockAction };
export function CallToAction({ title = "Your next good idea starts here.", description = "Give it a little space. See where it takes you.", action = { label: "Let's begin", href: "#get-started" }, ...props }: CallToActionProps) {
  return <BlockFrame {...props} className={`ob-cta ${props.className ?? ""}`}><div><MessageCircle size={32} aria-hidden="true" /><h2>{title}</h2><p>{description}</p></div><BlockActionLink action={action} secondary /></BlockFrame>;
}
