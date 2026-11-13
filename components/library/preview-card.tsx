"use client";
import type { ReactNode } from "react";
import { useDemoPlayer, type DemoStep } from "./use-demo-player";
import "../../styles/preview-card.css";

export const AUTONOMOUS_PREVIEWS = new Set(["shader-canvas", "flowing-water", "flowing-grass", "drifting-clouds", "grain-gradient", "anime-fire", "season-tree", "marquee", "skeleton", "progress", "thinking-indicator", "agent-status", "morphing-icons"]);
/** Live subtree plus an inert DOM/canvas frame when its playback slot is paused. */
export function PreviewCard({ children, demo, autonomous = false, pixel = false, label }: { children: ReactNode; demo?: DemoStep[]; autonomous?: boolean; pixel?: boolean; label: string }) {
  const { root, live, still, cursor, mounted } = useDemoPlayer(demo, autonomous);
  return <div ref={root} className="component-thumbnail demo-preview" data-pixel={pixel} data-cursor="false" role="group" tabIndex={0} aria-label={label}>
    <div ref={still} className="preview-still" hidden={mounted} inert aria-hidden="true" />
    {mounted && <div ref={live} className="thumbnail-inner">{children}</div>}
    <span ref={cursor} className="preview-cursor" aria-hidden="true"><i /><svg viewBox="0 0 20 24"><path d="M2 2 17 13l-7 1-4 7Z" /></svg></span>
  </div>;
}
