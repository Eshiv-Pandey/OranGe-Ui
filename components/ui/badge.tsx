import type { ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type BadgeProps = ComponentPropsWithoutRef<"span"> & AppearanceProps & { tone?: "neutral" | "success" | "warning" | "danger" | "accent"; dot?: boolean };
export function Badge({ appearance = "polished", className, tone = "neutral", dot = false, children, ...props }: BadgeProps) {
  return <span {...props} className={uiClass("ui-badge", className)} data-appearance={appearance} data-tone={tone}>{dot && <span className="ui-badge-dot" aria-hidden="true" />}{children}</span>;
}
