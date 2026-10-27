"use client";
import { Toggle as Primitive } from "radix-ui";
import type { ComponentPropsWithRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type ToggleProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps;
export function Toggle({ appearance = "polished", className, ...props }: ToggleProps) {
  return <Primitive.Root {...props} className={uiClass("ui-toggle", className)} data-appearance={appearance} />;
}
