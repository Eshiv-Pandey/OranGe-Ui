"use client";

import { ScrollArea as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-navigation.css";

export type ScrollAreaProps = Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, "children" | "asChild"> & AppearanceProps & {
  label: string;
  children: ReactNode;
  orientation?: "vertical" | "horizontal" | "both";
  viewportClassName?: string;
};

export function ScrollArea({ label, children, orientation = "vertical", viewportClassName, appearance = "polished", className, type = "auto", ...props }: ScrollAreaProps) {
  return <Primitive.Root {...props} type={type} className={uiClass("ui-scroll-area", className)} data-appearance={appearance}>
    <Primitive.Viewport className={["ui-scroll-viewport", viewportClassName].filter(Boolean).join(" ")} role="region" aria-label={label} tabIndex={0}>{children}</Primitive.Viewport>
    {(orientation === "vertical" || orientation === "both") && <Primitive.Scrollbar className="ui-scroll-bar" orientation="vertical"><Primitive.Thumb className="ui-scroll-thumb" /></Primitive.Scrollbar>}
    {(orientation === "horizontal" || orientation === "both") && <Primitive.Scrollbar className="ui-scroll-bar" orientation="horizontal"><Primitive.Thumb className="ui-scroll-thumb" /></Primitive.Scrollbar>}
    <Primitive.Corner className="ui-scroll-corner" />
  </Primitive.Root>;
}
