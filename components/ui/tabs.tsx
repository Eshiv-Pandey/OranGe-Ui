"use client";
import { Tabs as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type TabsProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { label: string; items: { value: string; label: string; content: ReactNode; disabled?: boolean }[] };
export function Tabs({ appearance = "polished", className, label, items, defaultValue, ...props }: TabsProps) {
  return <Primitive.Root {...props} defaultValue={defaultValue ?? items.find((item) => !item.disabled)?.value} className={uiClass("ui-tabs", className)} data-appearance={appearance}>
    <Primitive.List className="ui-tabs-list" aria-label={label}>{items.map((item) => <Primitive.Trigger key={item.value} value={item.value} disabled={item.disabled} className="ui-tabs-trigger">{item.label}</Primitive.Trigger>)}</Primitive.List>
    {items.map((item) => <Primitive.Content key={item.value} value={item.value} className="ui-tabs-content">{item.content}</Primitive.Content>)}
  </Primitive.Root>;
}
