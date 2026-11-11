"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { bounded } from "./interaction-utils";
import "../../styles/interaction-text.css";

export type WiggleTextProps = AppearanceProps & { children: ReactNode; strength?: number; speed?: number; paused?: boolean; theme?: CreativeTheme; style?: CSSProperties };
export function WiggleText({ children, strength = 2.5, speed = 110, paused = false, theme = "auto", appearance = "polished", className, style }: WiggleTextProps) {
  const id = useId().replace(/:/g, ""), root = useRef<HTMLSpanElement>(null), lettering = useRef<HTMLSpanElement>(null), last = useRef(-1), resolved = useCreativeTheme(theme);
  useMotionActivity(root, { onStatus: (status) => { if (status === "reduced" && lettering.current) lettering.current.style.filter = "none"; }, onFrame: ({ time }) => {
    if (!lettering.current) return;
    if (paused) { lettering.current.style.filter = "none"; last.current = -1; return; }
    const frame = Math.floor(time / bounded(speed, 70, 500, 110)) % 5; if (last.current === frame) return; last.current = frame; lettering.current.style.filter = `url(#${id}-${frame})`;
  } });
  return <span ref={root} className={["creative-surface interaction-surface wiggle-text", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} style={style}>
    <svg className="wiggle-definitions" width="0" height="0" aria-hidden="true"><defs>{Array.from({ length: 5 }, (_, index) => <filter key={index} id={`${id}-${index}`} x="-15%" y="-25%" width="130%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".025 .045" numOctaves="2" seed={index * 7 + 3} result="displacement" /><feDisplacementMap in="SourceGraphic" in2="displacement" scale={bounded(strength, 0, 12, 2.5)} xChannelSelector="R" yChannelSelector="G" /></filter>)}</defs></svg><span ref={lettering}>{children}</span>
  </span>;
}
