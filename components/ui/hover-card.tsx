"use client";

import { HoverCard as Primitive } from "radix-ui";
import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useControllableValue } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type HoverCardProps = AppearanceProps & {
  trigger: ReactElement<{ "aria-describedby"?: string }>;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

export function HoverCard({ trigger, children, open: controlled, defaultOpen = false, onOpenChange, openDelay = 300, closeDelay = 150, side = "bottom", align = "start", appearance = "polished", className }: HoverCardProps) {
  const id = useId();
  const [open, setOpen] = useControllableValue(controlled, defaultOpen, onOpenChange);
  const describedBy = [trigger.props["aria-describedby"], open ? id : undefined].filter(Boolean).join(" ") || undefined;
  return <Primitive.Root open={open} onOpenChange={setOpen} openDelay={Math.max(0, Number.isFinite(openDelay) ? openDelay : 300)} closeDelay={Math.max(0, Number.isFinite(closeDelay) ? closeDelay : 150)}>
    <Primitive.Trigger asChild aria-describedby={describedBy}>{cloneElement(trigger, { "aria-describedby": describedBy })}</Primitive.Trigger>
    <Primitive.Portal><Primitive.Content id={id} role="note" className={uiClass("ui-hover-card ui-surface", className)} data-appearance={appearance} side={side} align={align} sideOffset={10} collisionPadding={16}>{children}</Primitive.Content></Primitive.Portal>
  </Primitive.Root>;
}
