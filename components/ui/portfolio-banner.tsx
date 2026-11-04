"use client";
import type { MouseEventHandler } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { NebulaBackground } from "./portfolio/nebula-background";
import { BannerParticles } from "./portfolio/banner-particles";
import { WildPixelField } from "./portfolio/wild-pixel-field";
import { CurrentTime } from "./portfolio/current-time";
import { AnimatedTruck } from "./animated-truck";
import "../../styles/portfolio.css";

export type PortfolioBannerProps = AppearanceProps & {
  height?: number | string; particleCount?: number; showClock?: boolean; showTruck?: boolean;
  onTruckClick?: MouseEventHandler<HTMLButtonElement>; truckImageSrc?: string;
  truckInteractionLabel?: string; timeZone?: string; theme?: CreativeTheme; paused?: boolean;
};
/** Put this absolute banner in a positioned container with the same explicit height. */
export function PortfolioBanner({ height = "22vh", particleCount = 90, showClock = true, showTruck = true, onTruckClick, truckImageSrc, truckInteractionLabel, timeZone, paused = false, theme = "auto", appearance = "polished", className }: PortfolioBannerProps) {
  const resolved = useCreativeTheme(theme);
  return <div className={["portfolio-scope portfolio-banner", className].filter(Boolean).join(" ")} data-cursor-hero data-theme={resolved} data-appearance={appearance} style={{ height }}>
    <NebulaBackground paused={paused} theme={resolved} />
    <BannerParticles count={particleCount} paused={paused} />
    <div className="portfolio-banner-pixels"><WildPixelField ambient={false} paused={paused} theme={resolved} /></div>
    <div className="portfolio-banner-fade portfolio-banner-fade-bottom" /><div className="portfolio-banner-fade portfolio-banner-fade-left" /><div className="portfolio-banner-fade portfolio-banner-fade-right" />
    {showTruck && <div className="portfolio-banner-truck"><AnimatedTruck height="100%" width="clamp(76px, 8vw, 140px)" duration="18s" imageSrc={truckImageSrc} onTruckClick={onTruckClick} interactionLabel={truckInteractionLabel} paused={paused} theme={resolved} /></div>}
    {showClock && <div className="portfolio-banner-clock" data-hero-clock><CurrentTime timeZone={timeZone} /></div>}
  </div>;
}
