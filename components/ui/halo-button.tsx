"use client";

import { useRef, type ButtonHTMLAttributes, type CSSProperties } from "react";
import type { Appearance } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/interaction-controls.css";

export type HaloButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { appearance?: Appearance; theme?: CreativeTheme; color?: string; loading?: boolean };
export function HaloButton({ children = "A little more possibility", appearance = "polished", theme = "auto", color = "#ff854c", loading = false, disabled, className, style, type = "button", onPointerMove, ...props }: HaloButtonProps) {
  const root = useRef<HTMLButtonElement>(null), resolved = useCreativeTheme(theme); useMotionActivity(root);
  return <button {...props} ref={root} type={type} className={["creative-surface interaction-surface halo-button", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} disabled={disabled || loading} aria-busy={loading || undefined} style={{ "--halo-color": color, ...style } as CSSProperties} onPointerMove={(event) => { onPointerMove?.(event); const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--halo-angle", `${Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2)}rad`); }}><span className="halo-ring" aria-hidden="true" /><span className="halo-content">{loading && <span className="halo-spinner" aria-hidden="true" />}{children}</span></button>;
}
