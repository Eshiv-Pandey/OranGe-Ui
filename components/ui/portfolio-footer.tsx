"use client";
import type { ReactNode, MouseEventHandler } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { FooterFavicon } from "./portfolio/footer-favicon";
import { MonumentSkyline } from "./portfolio/monument-skyline";
import { NebulaBackground } from "./portfolio/nebula-background";
import { AnimatedTruck } from "./animated-truck";
import { StickerSocialIcons, type StickerProfile } from "./sticker-social-icons";
import "../../styles/portfolio.css";

export type PortfolioFooterLink = { name: string; href: string; external?: boolean };
export type PortfolioFooterLinkGroup = { title: string; links: readonly PortfolioFooterLink[] };
export type PortfolioFooterProps = AppearanceProps & {
  brand: ReactNode; contact?: { email?: string; phone?: string; phoneHref?: string; location?: string; title?: string };
  linkGroups: readonly PortfolioFooterLinkGroup[]; profiles?: readonly StickerProfile[];
  faviconSrc?: string; truckImageSrc?: string; showTruck?: boolean; showNebula?: boolean;
  fullBleed?: boolean; id?: string; paused?: boolean; theme?: CreativeTheme;
  onTruckClick?: MouseEventHandler<HTMLButtonElement>;
};
export function PortfolioFooter({ brand, contact, linkGroups, profiles = [], faviconSrc, truckImageSrc, showTruck = true, showNebula = true, fullBleed = false, id, paused = false, theme = "auto", onTruckClick, appearance = "polished", className }: PortfolioFooterProps) {
  const resolved = useCreativeTheme(theme);
  return <footer id={id} className={["portfolio-scope portfolio-footer", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-full-bleed={fullBleed} data-paused={paused}>
    <div className="portfolio-footer-card">
      {showNebula && <NebulaBackground paused={paused} theme={resolved} />}
      <div aria-hidden="true" className="portfolio-footer-veil" />
      <div className="portfolio-footer-content">
        <div className="portfolio-footer-masthead"><FooterFavicon src={faviconSrc} paused={paused} /><span className="portfolio-footer-wordmark">{brand}</span></div>
        <div className="portfolio-footer-rule" />
        <div className="portfolio-footer-columns">
          {linkGroups.map(group => <div key={group.title} className="portfolio-footer-column"><p className="portfolio-footer-heading">{group.title}</p><ul>{group.links.map(link => <li key={link.href}><a className="portfolio-footer-link" href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined}>{link.name}</a></li>)}</ul></div>)}
          {(contact || profiles.length > 0) && <div className="portfolio-footer-connect"><p className="portfolio-footer-heading">{contact?.title ?? "Connect With Me"}</p>
            <ul className="portfolio-footer-contact">
              {contact?.email && <li><a href={`mailto:${contact.email}`}><Mail aria-hidden="true" /><span>{contact.email}</span></a></li>}
              {contact?.phone && <li><a href={contact.phoneHref ?? `tel:${contact.phone.replace(/[^+\d]/g, "")}`}><Phone aria-hidden="true" /><span>{contact.phone}</span></a></li>}
              {contact?.location && <li><MapPin aria-hidden="true" /><span>{contact.location}</span></li>}
            </ul>
            {profiles.length > 0 && <StickerSocialIcons className="portfolio-footer-social" profiles={profiles} theme={resolved} />}
          </div>}
        </div>
      </div>
      <div className="portfolio-footer-skyline"><MonumentSkyline /><div className="portfolio-footer-truck">{showTruck && <AnimatedTruck height="100%" width="15%" duration="14s" imageSrc={truckImageSrc} onTruckClick={onTruckClick} paused={paused} theme={resolved} />}</div></div>
    </div>
  </footer>;
}
