"use client";
import { ToggleGroup as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type ToggleGroupProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { label: string; options: { value: string; label: string; icon?: ReactNode; disabled?: boolean }[] };
export function ToggleGroup({ appearance = "polished", className, label, options, ...props }: ToggleGroupProps) {
  return <Primitive.Root {...props} className={uiClass("ui-toggle-group", className)} data-appearance={appearance} aria-label={label}>
    {options.map((item) => <Primitive.Item key={item.value} value={item.value} aria-label={item.label} disabled={item.disabled} className="ui-toggle">{item.icon ?? item.label}</Primitive.Item>)}
  </Primitive.Root>;
}
