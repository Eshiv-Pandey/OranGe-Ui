"use client";
import { Accordion as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { ChevronIcon } from "./symbols";
import "../../styles/library-components.css";
export type AccordionProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { items: { value: string; title: string; content: ReactNode; disabled?: boolean }[] };
export function Accordion({ appearance = "polished", className, items, ...props }: AccordionProps) {
  return <Primitive.Root {...props} className={uiClass("ui-accordion ui-surface", className)} data-appearance={appearance}>
    {items.map((item) => <Primitive.Item key={item.value} value={item.value} disabled={item.disabled} className="ui-accordion-item">
      <Primitive.Header className="ui-accordion-header"><Primitive.Trigger className="ui-accordion-trigger">{item.title}<ChevronIcon /></Primitive.Trigger></Primitive.Header>
      <Primitive.Content className="ui-accordion-content"><div>{item.content}</div></Primitive.Content>
    </Primitive.Item>)}
  </Primitive.Root>;
}
