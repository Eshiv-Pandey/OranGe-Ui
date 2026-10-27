"use client";
import { Tooltip as Primitive } from "radix-ui";
import type { ReactElement, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type TooltipProps = AppearanceProps & { children: ReactElement; content: ReactNode; side?: "top" | "right" | "bottom" | "left"; delayDuration?: number };
export function Tooltip({ appearance = "polished", className, children, content, side = "top", delayDuration = 250 }: TooltipProps) {
  return <Primitive.Provider delayDuration={delayDuration}><Primitive.Root><Primitive.Trigger asChild>{children}</Primitive.Trigger><Primitive.Portal><Primitive.Content className={uiClass("ui-tooltip", className)} data-appearance={appearance} side={side} sideOffset={8} collisionPadding={12}>{content}<Primitive.Arrow className="ui-tooltip-arrow" /></Primitive.Content></Primitive.Portal></Primitive.Root></Primitive.Provider>;
}
