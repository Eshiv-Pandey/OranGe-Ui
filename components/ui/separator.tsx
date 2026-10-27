import type { ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type SeparatorProps = ComponentPropsWithoutRef<"div"> & AppearanceProps & { orientation?: "horizontal" | "vertical"; decorative?: boolean };
export function Separator({ appearance = "polished", className, orientation = "horizontal", decorative = false, ...props }: SeparatorProps) {
  return <div {...props} className={uiClass("ui-separator", className)} data-appearance={appearance} data-orientation={orientation} role={decorative ? "none" : "separator"} aria-orientation={decorative ? undefined : orientation} />;
}
