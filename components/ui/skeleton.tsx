import type { CSSProperties } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type SkeletonProps = AppearanceProps & { label?: string; shape?: "text" | "avatar" | "card"; lines?: number; animate?: boolean; style?: CSSProperties };
export function Skeleton({ appearance = "polished", className, label = "Loading content", shape = "text", lines = 3, animate = true, style }: SkeletonProps) {
  return <div className={uiClass("ui-skeleton", className)} data-appearance={appearance} data-shape={shape} data-animate={animate} role="status" aria-label={label} aria-busy="true" style={style}>
    {shape === "text" ? Array.from({ length: Math.max(1, Math.min(10, Math.floor(lines))) }, (_, index) => <span aria-hidden="true" key={index} className="ui-skeleton-block" style={{ width: index === lines - 1 ? "65%" : "100%" }} />) : <span aria-hidden="true" className="ui-skeleton-block" />}
  </div>;
}
