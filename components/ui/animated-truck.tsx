"use client";
import { useRef, useState, type CSSProperties, type MouseEventHandler } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/portfolio.css";

export type AnimatedTruckProps = AppearanceProps & {
  width?: string; duration?: string; road?: boolean; height?: number | string;
  imageSrc?: string; onTruckClick?: MouseEventHandler<HTMLButtonElement>;
  interactionLabel?: string; paused?: boolean; theme?: CreativeTheme; restartOnInteract?: boolean;
};
const PUFF_DELAYS = [0, -540, -1080, -1620, -2160];
/** Original transparent 570:328 lorry. Driving, suspension and exhaust have separate layers. */
export function AnimatedTruck({ className, width = "clamp(132px, 16vw, 248px)", duration = "26s", road = false, height = 180, imageSrc = "/portfolio/truck-art.webp", onTruckClick, interactionLabel = "Restart truck", paused = false, theme = "auto", restartOnInteract = true, appearance = "polished" }: AnimatedTruckProps) {
  const resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null), drive = useRef<HTMLDivElement>(null), [restarts, setRestarts] = useState(0);
  useMotionActivity(root, {});
  const interact: MouseEventHandler<HTMLButtonElement> = event => {
    if (restartOnInteract) { drive.current?.getAnimations().forEach(animation => { animation.currentTime = 0; }); setRestarts(value => value + 1); }
    onTruckClick?.(event);
  };
  return <div ref={root} aria-hidden={restartOnInteract || onTruckClick ? undefined : true} className={["portfolio-scope portfolio-truck", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} data-paused={paused} data-restarts={restarts} style={{ height, "--portfolio-truck-w": width, "--portfolio-truck-duration": duration } as CSSProperties}>
    {road && <div className="portfolio-road" />}
    <div ref={drive} className="portfolio-truck-drive"><div className="portfolio-truck-art">
      {(restartOnInteract || onTruckClick) && <button type="button" className="portfolio-truck-button" aria-label={interactionLabel} onClick={interact} />}
      <span className="portfolio-truck-shadow" />
      {PUFF_DELAYS.map(delay => <span key={delay} className="portfolio-smoke-puff" style={{ "--portfolio-puff-delay": `${delay}ms` } as CSSProperties} />)}
      <div className="portfolio-truck-jounce">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="" width={570} height={328} draggable={false} decoding="async" />
      </div>
    </div></div>
  </div>;
}
