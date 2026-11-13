"use client";
import { WildCursor } from "./portfolio-wild-cursor";
import { PixelTrail } from "./portfolio-pixel-trail";
import { useState } from "react";
import type { Appearance } from "../ui/appearance";
import { useCreativeTheme } from "../ui/creative-surface";
import { PortfolioBanner } from "../ui/portfolio-banner";
import { PortfolioFooter } from "../ui/portfolio-footer";
import { AnimatedTruck } from "../ui/animated-truck";
import { StickerSocialIcons, SOCIAL_STICKER_PRESETS } from "../ui/sticker-social-icons";
import { PORTFOLIO_BRAND, PORTFOLIO_CONTACT, PORTFOLIO_LINK_GROUPS, PORTFOLIO_SOCIALS } from "../ui/portfolio/demo-content";
import { WorkbenchInspector } from "../ui/workbench-inspector";
import { CustomizerRange, CustomizerToggle } from "../ui/artwork-customizer";
import "../../styles/portfolio-demos.css";

export default function PortfolioDemos({ slug = "combined", appearance = "polished", thumbnail = false }: { slug?: string; appearance?: Appearance; thumbnail?: boolean }) {
  const theme = useCreativeTheme(), [count, setCount] = useState(90), [clock, setClock] = useState(true), [truck, setTruck] = useState(true), [road, setRoad] = useState(true), [paused, setPaused] = useState(false), [clicks, setClicks] = useState(0), [cards, setCards] = useState(true), [cursorMode, setCursorMode] = useState<"wild" | "classic">("wild");
  const onTruckClick = () => { setPaused(false); setClicks(value => value + 1); setCursorMode(value => value === "wild" ? "classic" : "wild"); };
  const availableProfiles = slug === "sticker-social-icons" && !thumbnail ? SOCIAL_STICKER_PRESETS.map(preset => ({ ...preset, href: `https://example.com/${preset.appearance}`, hoverCard: { name: "Sample profile", handle: "@example", bio: "Making thoughtful things for the web.", location: "Your city, Anywhere", accent: "var(--portfolio-desi-teal)" } })) : PORTFOLIO_SOCIALS;
  const profiles = cards ? availableProfiles : availableProfiles.map(profile => ({ ...profile, hoverCard: undefined }));
  const footer = <PortfolioFooter brand={PORTFOLIO_BRAND} contact={PORTFOLIO_CONTACT} linkGroups={PORTFOLIO_LINK_GROUPS} profiles={profiles} theme={theme} showTruck={truck} paused={paused} appearance={appearance} onTruckClick={onTruckClick} />;
  const banner = <div className="portfolio-banner-container" style={{ height: "26vh" }}><PortfolioBanner height="26vh" particleCount={count} showClock={clock} showTruck={truck} onTruckClick={onTruckClick} paused={paused} theme={theme} appearance={appearance} /></div>;
  const art = slug === "portfolio-banner" ? banner : slug === "portfolio-footer" ? footer : slug === "animated-truck" ? <AnimatedTruck width="clamp(132px, 16vw, 248px)" duration="26s" height={220} road={road} onTruckClick={onTruckClick} paused={paused} theme={theme} appearance={appearance} /> : slug === "sticker-social-icons" ? <div className="portfolio-social-demo"><StickerSocialIcons profiles={profiles} theme={theme} appearance={appearance} /></div> : <div className="portfolio-composition">{!paused && (cursorMode === "wild" ? <WildCursor /> : <PixelTrail />)}{banner}<div className="portfolio-blueprint-content"><p className="portfolio-demo-wordmark">{PORTFOLIO_BRAND}</p><StickerSocialIcons profiles={profiles} theme={theme} /><p className="portfolio-composition-caption">An animated banner and responsive footer with sample content.</p></div>{footer}</div>;
  if (thumbnail) return <div className="portfolio-thumbnail" data-theme={theme}>{art}</div>;
  return <section className="portfolio-demo artwork-customizer" data-appearance={appearance} data-theme={theme}>
    <div className="artwork-customizer-preview"><div className="artwork-customizer-artwork" data-main-preview>{art}</div><p className="portfolio-demo-status" role="status">{slug === "sticker-social-icons" ? "Hover or focus a sticker to see its profile card." : clicks ? `Truck clicked ${clicks} ${clicks === 1 ? "time" : "times"}.` : "Tap or click the truck to restart."}</p></div>
    <WorkbenchInspector><div className="artwork-customizer-settings"><h3>Portfolio components</h3>
      {(slug === "portfolio-banner" || slug === "combined") && <><CustomizerRange label="Petal count" value={count} min={0} max={180} step={10} onChange={setCount} /><CustomizerToggle label="Show clock" checked={clock} onChange={setClock} /></>}
      {slug !== "sticker-social-icons" && slug !== "animated-truck" && <CustomizerToggle label="Show truck" checked={truck} onChange={setTruck} />}
      {slug === "animated-truck" && <CustomizerToggle label="Dashed road" checked={road} onChange={setRoad} />}
      {(slug === "portfolio-footer" || slug === "sticker-social-icons" || slug === "combined") && <CustomizerToggle label="Profile hover cards" checked={cards} onChange={setCards} />}
      {slug !== "sticker-social-icons" && <CustomizerToggle label="Pause decoration" checked={paused} onChange={setPaused} />}
      <a className="portfolio-combined-link" href="/portfolio">View banner and footer together</a>
    </div></WorkbenchInspector>
  </section>;
}
