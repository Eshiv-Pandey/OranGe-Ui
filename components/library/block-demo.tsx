"use client";

import { useState, type ReactNode } from "react";
import { AuthPanel, type AuthMode } from "../ui/blocks/auth";
import { QuietAuth, StudioAuth, ContrastAuth, PlayfulAuth } from "../ui/blocks/auth-variants";
import { NeonNotFound } from "../ui/neon-sign-404";
import { ChaiBreak404 } from "../ui/chai-break-404";
import { PavilionFooter } from "../ui/pavilion-footer";
import { BlueHourFooter, HillsideFooter } from "../ui/blocks/landscape-footers";
import { StudioFooter, ColonyFooter } from "../ui/blocks/playful-footers";
import { SkylineFooter } from "../ui/blocks/skyline-footer";
import { EditorialHero, ProductHero } from "../ui/blocks/heroes";
import { PlaygroundHero, OddkinHero, WovenHero, NeonHero } from "../ui/blocks/hero-variants";
import { WildseedBento, CurrentBento, RevenueBento, StudioBento, NeonBento } from "../ui/blocks/bento-variants";
import { SiteHeader, SiteFooter, AnnouncementBar } from "../ui/blocks/navigation";
import { FeatureStory, BentoOverview, PricingSection, TestimonialSection, LogoCloud, IntegrationDirectory, FaqSection, CallToAction } from "../ui/blocks/marketing";
import { JournalSection, TeamSection, CareersSection, ImageGallery, EmptyPage, StatsSection } from "../ui/blocks/content";
import { ContactSection, NewsletterSection, UploadSection } from "../ui/blocks/forms";
import { AppShell, WorkspaceOverview, SettingsPanel, NotificationInbox, FocusWidget } from "../ui/blocks/workspace";
import { StudioLanding, StudioWorkspace } from "../ui/blocks/templates";
import { StackedTestimonials, CollageTestimonials, PortraitTestimonials, InfiniteTestimonials } from "../ui/blocks/testimonial-variants";
import { GlassPricing, TicketPricing } from "../ui/blocks/pricing-variants";
import { FolderFaq, BubbleFaq, PosterFaq, AccordionFaq } from "../ui/blocks/faq-variants";

const landing = "/preview/blocks/studio-landing";
const links = [{ label: "Our approach", href: `${landing}#about` }, { label: "Features", href: `${landing}#features` }, { label: "Plans", href: `${landing}#pricing` }];
const serviceBlocks = new Set(["auth-panel", "integrations", "contact", "newsletter", "settings", "notifications", "file-upload", "app-shell", "studio-landing", "studio-workspace"]);
const authBlocks = new Set(["auth-panel", "quiet-auth", "studio-auth", "contrast-auth", "playful-auth"]);
const heroBlocks = new Set(["editorial-hero", "product-hero", "playground-hero", "oddkin-hero", "woven-hero", "neon-hero"]);
authBlocks.forEach(slug => serviceBlocks.add(slug));
export function BlockDemo({ slug, controls = true, theme = "auto" }: { slug: string; controls?: boolean; theme?: "light" | "dark" | "auto" }) {
  const [failure, setFailure] = useState(false), [status, setStatus] = useState(""), [authMode, setAuthMode] = useState<AuthMode>(slug === "playful-auth" ? "sign-up" : "sign-in");
  async function service() { await new Promise(resolve => setTimeout(resolve, 450)); if (failure) throw new Error("This is a demo error. Switch to Success and try again."); }
  const chosen = (plan: string, billing: string) => setStatus(`Demo: ${plan} selected with ${billing} billing. No purchase was made.`);
  let content: ReactNode;
  switch (slug) {
    case "stacked-testimonials": content = <StackedTestimonials />; break;
    case "collage-testimonials": content = <CollageTestimonials />; break;
    case "portrait-testimonials": content = <PortraitTestimonials />; break;
    case "infinite-testimonials": content = <InfiniteTestimonials />; break;
    case "glass-pricing": content = <GlassPricing onChoose={async () => { await service(); }} />; break;
    case "ticket-pricing": content = <TicketPricing onChoose={async () => { await service(); }} />; break;
    case "folder-faq": content = <FolderFaq />; break;
    case "bubble-faq": content = <BubbleFaq />; break;
    case "poster-faq": content = <PosterFaq />; break;
    case "accordion-faq": content = <AccordionFaq />; break;
    case "blue-hour-footer": content = <BlueHourFooter theme={theme} homeHref={landing} groups={[
      { title: "Collections", links: [{ label: "All objects", href: "/preview/blocks/image-gallery" }, { label: "For the home", href: `${landing}#features` }, { label: "Small editions", href: "/preview/blocks/pricing" }, { label: "The journal", href: "/preview/blocks/journal" }] },
      { title: "Our studio", links: [{ label: "Our story", href: `${landing}#about` }, { label: "Our work", href: `${landing}#features` }, { label: "The people", href: "/preview/blocks/team" }, { label: "Join the studio", href: "/preview/blocks/careers" }] },
      { title: "Here to help", links: [{ label: "Questions", href: `${landing}#about` }, { label: "Get in touch", href: `${landing}#contact` }, { label: "Care guide", href: "/preview/blocks/journal" }, { label: "Plan a visit", href: `${landing}#contact` }] }
    ]} socialLinks={[{label: "Journal", href: "/preview/blocks/journal"}, {label: "People", href: "/preview/blocks/team"}, {label: "Contact", href: `${landing}#contact`}]} onSubscribe={service} successMessage="Demo complete. No email was subscribed." />; break;
    case "studio-footer": content = <StudioFooter theme={theme} homeHref={landing} careers={{ label: "Good people.\nGreat work.", href: "/preview/blocks/careers" }} office={"A little studio.\nNew Delhi, India."} officeHref={`${landing}#contact`} contactAction={{ label: "Start a conversation", href: `${landing}#contact` }} groups={[{ title: "Around the studio", links: [{ label: "Journal", href: "/preview/blocks/journal" }, { label: "Work", href: `${landing}#features` }, { label: "People", href: "/preview/blocks/team" }] }]} />; break;
    case "colony-footer": content = <ColonyFooter theme={theme} homeHref={landing} groups={[{ title: "Make together", links }, { title: "Take a look", links: [{ label: "Selected work", href: `${landing}#features` }, { label: "The journal", href: "/preview/blocks/journal" }, { label: "Open roles", href: "/preview/blocks/careers" }] }, { title: "Around here", links: [{ label: "The people", href: "/preview/blocks/team" }, { label: "Questions", href: `${landing}#about` }, { label: "Get in touch", href: `${landing}#contact` }] }]} support={{ label: "Help & support", href: `${landing}#contact` }} />; break;
    case "hillside-footer": content = <HillsideFooter theme={theme} homeHref={landing} groups={[{ title: "Explore", links: [{ label: "Places to stay", href: "/preview/blocks/image-gallery" }, { label: "Village stories", href: "/preview/blocks/journal" }, { label: "Around here", href: `${landing}#about` }] }, { title: "Plan a visit", links: [{ label: "Getting here", href: `${landing}#contact` }, { label: "Good to know", href: `${landing}#about` }, { label: "Say hello", href: `${landing}#contact` }] }]} />; break;
    case "skyline-footer": content = <SkylineFooter theme={theme} linkGroups={[{ title: "Quick links", links: [{ name: "Projects", href: `${landing}#features` }, { name: "About", href: `${landing}#about` }, { name: "Journal", href: "/preview/blocks/journal" }, { name: "Contact", href: `${landing}#contact` }] }]} />; break;
    case "quiet-auth": case "studio-auth": case "contrast-auth": case "playful-auth": {
      const Auth = { "quiet-auth": QuietAuth, "studio-auth": StudioAuth, "contrast-auth": ContrastAuth, "playful-auth": PlayfulAuth }[slug];
      content = <Auth mode={authMode} onModeChange={setAuthMode} onSubmit={service} providers={[{ id: "passkey", label: "Continue with passkey" }, { id: "provider", label: "Demo identity provider" }]} onProvider={service} successMessage="Demo complete. No account was created or authenticated." />; break;
    }
    case "neon-sign-404": content = <NeonNotFound homeHref={landing} sound={false} />; break;
    case "chai-break-404": content = <ChaiBreak404 homeHref={landing} sound={false} />; break;
    case "pavilion-footer": content = <PavilionFooter />; break;
    case "auth-panel": content = <AuthPanel mode={authMode} onModeChange={setAuthMode} onSubmit={service} providers={[{ id: "provider", label: "Demo provider" }]} onProvider={service} successMessage="Demo complete. No account was created or authenticated." />; break;
    case "editorial-hero": content = <EditorialHero />; break;
    case "playground-hero": content = <PlaygroundHero />; break;
    case "oddkin-hero": content = <OddkinHero />; break;
    case "woven-hero": content = <WovenHero />; break;
    case "neon-hero": content = <NeonHero />; break;
    case "product-hero": content = <ProductHero />; break;
    case "site-header": content = <SiteHeader homeHref={landing} links={links} action={{ label: "Get in touch", href: `${landing}#contact` }} />; break;
    case "site-footer": content = <SiteFooter groups={[{ title: "Explore", links }, { title: "Say hello", links: [{ label: "Contact", href: `${landing}#contact` }, { label: "The journal", href: "/preview/blocks/journal" }, { label: "The team", href: "/preview/blocks/team" }] }]} />; break;
    case "announcement": content = <AnnouncementBar link={{ label: "Take a look", href: landing }} onDismiss={() => setStatus("Announcement dismissed. Reset the preview to bring it back.")} />; break;
    case "feature-story": content = <FeatureStory />; break;
    case "bento-overview": content = <BentoOverview />; break;
    case "wildseed-bento": content = <WildseedBento action={{ label: "Explore our world", href: `${landing}#about` }} />; break;
    case "current-bento": content = <CurrentBento action={{ label: "Find your next move", href: "/preview/blocks/image-gallery" }} />; break;
    case "revenue-bento": content = <RevenueBento action={{ label: "Explore the workspace", href: "/preview/blocks/workspace-overview" }} />; break;
    case "studio-bento": content = <StudioBento action={{ label: "Start something", href: `${landing}#contact` }} projects={[
      { name: "A brighter start", category: "Brand identity", href: `${landing}#features`, art: "sun", color: "lime" },
      { name: "Good company", category: "Digital experience", href: "/preview/blocks/editorial-hero", art: "smile", color: "pink" },
      { name: "Fresh perspective", category: "Art direction", href: "/preview/blocks/image-gallery", art: "eye", color: "yellow" },
    ]} />; break;
    case "neon-bento": content = <NeonBento action={{ label: "Step inside", href: `${landing}#about` }} />; break;
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
  return <div className="block-demo" onClickCapture={event => { if (heroBlocks.has(slug) && event.target instanceof Element && event.target.closest("a")) event.preventDefault(); }} onAuxClickCapture={event => { if (heroBlocks.has(slug) && event.target instanceof Element && event.target.closest("a")) event.preventDefault(); }}>{controls && serviceBlocks.has(slug) && <div className="block-demo-controls"><label>Callback result<select value={failure ? "failure" : "success"} onChange={event => setFailure(event.target.value === "failure")}><option value="success">Success</option><option value="failure">Failure</option></select></label>{authBlocks.has(slug) && <label>Auth flow<select value={authMode} onChange={event => setAuthMode(event.target.value as AuthMode)}><option value="sign-in">Sign in</option><option value="sign-up">Create account</option><option value="recover">Recover password</option><option value="verify">Verify code</option></select></label>}</div>}{content}<div className="block-demo-status" aria-live="polite">{status && <p>{status}</p>}</div></div>;
}
