"use client";

import { useState, type ReactNode } from "react";
import { AuthPanel, type AuthMode } from "../ui/blocks/auth";
import { QuietAuth, StudioAuth, ContrastAuth, PlayfulAuth } from "../ui/blocks/auth-variants";
import { NeonNotFound } from "../ui/neon-sign-404";
import { ChaiBreak404 } from "../ui/chai-break-404";
import { PavilionFooter } from "../ui/pavilion-footer";
import { EditorialHero, ProductHero } from "../ui/blocks/heroes";
import { SiteHeader, SiteFooter, AnnouncementBar } from "../ui/blocks/navigation";
import { FeatureStory, BentoOverview, PricingSection, TestimonialSection, LogoCloud, IntegrationDirectory, FaqSection, CallToAction } from "../ui/blocks/marketing";
import { JournalSection, TeamSection, CareersSection, ImageGallery, EmptyPage, StatsSection } from "../ui/blocks/content";
import { ContactSection, NewsletterSection, UploadSection } from "../ui/blocks/forms";
import { AppShell, WorkspaceOverview, SettingsPanel, NotificationInbox, FocusWidget } from "../ui/blocks/workspace";
import { StudioLanding, StudioWorkspace } from "../ui/blocks/templates";

const landing = "/preview/blocks/studio-landing";
const links = [{ label: "Our approach", href: `${landing}#about` }, { label: "Features", href: `${landing}#features` }, { label: "Plans", href: `${landing}#pricing` }];
const serviceBlocks = new Set(["auth-panel", "integrations", "contact", "newsletter", "settings", "notifications", "file-upload", "app-shell", "studio-landing", "studio-workspace"]);
const authBlocks = new Set(["auth-panel", "quiet-auth", "studio-auth", "contrast-auth", "playful-auth"]);
authBlocks.forEach(slug => serviceBlocks.add(slug));
export function BlockDemo({ slug, controls = true }: { slug: string; controls?: boolean }) {
  const [failure, setFailure] = useState(false), [status, setStatus] = useState(""), [authMode, setAuthMode] = useState<AuthMode>(slug === "playful-auth" ? "sign-up" : "sign-in");
  async function service() { await new Promise(resolve => setTimeout(resolve, 450)); if (failure) throw new Error("This is a demo error. Switch to Success and try again."); }
  const chosen = (plan: string, billing: string) => setStatus(`Demo: ${plan} selected with ${billing} billing. No purchase was made.`);
  let content: ReactNode;
  switch (slug) {
    case "quiet-auth": case "studio-auth": case "contrast-auth": case "playful-auth": {
      const Auth = { "quiet-auth": QuietAuth, "studio-auth": StudioAuth, "contrast-auth": ContrastAuth, "playful-auth": PlayfulAuth }[slug];
      content = <Auth mode={authMode} onModeChange={setAuthMode} onSubmit={service} providers={[{ id: "passkey", label: "Continue with passkey" }, { id: "provider", label: "Demo identity provider" }]} onProvider={service} successMessage="Demo complete. No account was created or authenticated." />; break;
    }
    case "neon-sign-404": content = <NeonNotFound homeHref={landing} sound={false} />; break;
    case "chai-break-404": content = <ChaiBreak404 homeHref={landing} sound={false} />; break;
    case "pavilion-footer": content = <PavilionFooter />; break;
    case "auth-panel": content = <AuthPanel mode={authMode} onModeChange={setAuthMode} onSubmit={service} providers={[{ id: "provider", label: "Demo provider" }]} onProvider={service} successMessage="Demo complete. No account was created or authenticated." />; break;
    case "editorial-hero": content = <EditorialHero primaryAction={{ label: "Find your space", href: `${landing}#features` }} secondaryAction={{ label: "See how it works", href: `${landing}#about` }} />; break;
    case "product-hero": content = <ProductHero action={{ label: "Start a new chapter", href: `${landing}#get-started` }} />; break;
    case "site-header": content = <SiteHeader homeHref={landing} links={links} action={{ label: "Get in touch", href: `${landing}#contact` }} />; break;
    case "site-footer": content = <SiteFooter groups={[{ title: "Explore", links }, { title: "Say hello", links: [{ label: "Contact", href: `${landing}#contact` }, { label: "The journal", href: "/preview/blocks/journal" }, { label: "The team", href: "/preview/blocks/team" }] }]} />; break;
    case "announcement": content = <AnnouncementBar link={{ label: "Take a look", href: landing }} onDismiss={() => setStatus("Announcement dismissed. Reset the preview to bring it back.")} />; break;
    case "feature-story": content = <FeatureStory />; break;
    case "bento-overview": content = <BentoOverview />; break;
    case "pricing-section": content = <PricingSection onChoose={chosen} />; break;
    case "testimonials": content = <TestimonialSection />; break;
    case "logo-cloud": content = <LogoCloud />; break;
    case "integrations": content = <IntegrationDirectory onToggle={service} />; break;
    case "faq": content = <FaqSection />; break;
    case "contact": content = <ContactSection onSubmit={service} />; break;
    case "newsletter": content = <NewsletterSection onSubscribe={service} />; break;
    case "journal": content = <JournalSection />; break;
    case "team": content = <TeamSection />; break;
    case "careers": content = <CareersSection onApply={role => setStatus(`Demo: ${role.title} selected. Connect your recruiting flow in onApply.`)} />; break;
    case "image-gallery": content = <ImageGallery />; break;
    case "call-to-action": content = <CallToAction action={{ label: "Let's begin", href: `${landing}#get-started` }} />; break;
    case "empty-page": content = <EmptyPage action={{ label: "Find your way home", href: landing }} />; break;
    case "app-shell": content = <AppShell onSave={service} onCreate={() => setStatus("Demo: connect your project creation flow in onCreate.")} onOpen={project => setStatus(`Demo: ${project.name} selected. Connect your project route in onOpen.`)} />; break;
    case "workspace-overview": content = <WorkspaceOverview onCreate={() => setStatus("Demo: connect your project creation flow in onCreate.")} onOpen={project => setStatus(`Demo: ${project.name} selected.`)} />; break;
    case "settings": content = <SettingsPanel onSave={service} />; break;
    case "notifications": content = <NotificationInbox onRead={service} />; break;
    case "file-upload": content = <UploadSection onUpload={service} />; break;
    case "stats": content = <StatsSection />; break;
    case "focus-widget": content = <FocusWidget />; break;
    case "studio-landing": content = <StudioLanding onSubscribe={service} onContact={service} onChoosePlan={chosen} />; break;
    case "studio-workspace": content = <StudioWorkspace onSave={service} />; break;
    default: return <p>Preview not available.</p>;
  }
  return <div className="block-demo">{controls && <div className="block-demo-controls"><p>Fictional Daylight demo. Actions do not send or save data.</p>{serviceBlocks.has(slug) && <label>Callback result<select value={failure ? "failure" : "success"} onChange={event => setFailure(event.target.value === "failure")}><option value="success">Success</option><option value="failure">Failure</option></select></label>}{authBlocks.has(slug) && <label>Auth flow<select value={authMode} onChange={event => setAuthMode(event.target.value as AuthMode)}><option value="sign-in">Sign in</option><option value="sign-up">Create account</option><option value="recover">Recover password</option><option value="verify">Verify code</option></select></label>}</div>}{content}<div className="block-demo-status" aria-live="polite">{status && <p>{status}</p>}</div></div>;
}
