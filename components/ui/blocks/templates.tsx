"use client";

import { EditorialHero } from "./heroes";
import { SiteHeader, SiteFooter } from "./navigation";
import { FeatureStory, PricingSection, FaqSection } from "./marketing";
import { NewsletterSection, ContactSection, type ContactSubmission } from "./forms";
import { AppShell, FocusWidget, type WorkspaceSettings } from "./workspace";
import type { BlockProps } from "./shared";

export type StudioLandingProps = BlockProps & { onSubscribe?: (email: string) => void | Promise<void>; onContact?: (values: ContactSubmission) => void | Promise<void>; onChoosePlan?: (plan: string, billing: "monthly" | "yearly") => void };
export function StudioLanding({ onSubscribe, onContact, onChoosePlan, className = "", id, ...props }: StudioLandingProps) {
  return <div id={id} className={`ob-template ${className}`}><SiteHeader {...props} /><EditorialHero showBrand={false} primaryAction={{ label: "Meet your next chapter", href: "#features" }} secondaryAction={{ label: "Say hello", href: "#contact" }} /><FeatureStory id="features" /><PricingSection id="pricing" onChoose={onChoosePlan} /><FaqSection id="about" /><NewsletterSection id="get-started" onSubscribe={onSubscribe} /><ContactSection id="contact" onSubmit={onContact} /><SiteFooter groups={[{ title: "Explore", links: [{ label: "Our approach", href: "#about" }, { label: "Features", href: "#features" }, { label: "Plans", href: "#pricing" }] }, { title: "Connect", links: [{ label: "Say hello", href: "#contact" }, { label: "A thoughtful newsletter", href: "#get-started" }] }]} /></div>;
}

export type StudioWorkspaceProps = BlockProps & { onSave?: (values: WorkspaceSettings) => void | Promise<void> };
export function StudioWorkspace({ onSave, className = "", id, ...props }: StudioWorkspaceProps) {
  return <div className="ob-container"><div id={id} className={`ob-workspace-template ${className}`}><AppShell {...props} onSave={onSave} /><div className="ob-workspace-focus"><FocusWidget /></div></div></div>;
}
