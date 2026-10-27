"use client";
import { Popover as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useModalBackground } from "./modal-background";
import { CloseIcon } from "./symbols";
import "../../styles/library-components.css";
export type PopoverProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { trigger: ReactElement; title: string; children: ReactNode; align?: "start" | "center" | "end" };
export function Popover({ appearance = "polished", className, trigger, title, children, align = "center", ...props }: PopoverProps) {
  const modalBackground = useModalBackground(props.modal === true);
  return <Primitive.Root {...props}><Primitive.Trigger asChild>{trigger}</Primitive.Trigger><Primitive.Portal>
    <Primitive.Content ref={modalBackground} className={uiClass("ui-popover ui-surface", className)} data-appearance={appearance} sideOffset={10} collisionPadding={16} align={align} aria-label={title}>
      <h3 className="ui-overlay-title">{title}</h3><div className="ui-overlay-body">{children}</div>
      <Primitive.Close className="ui-icon-button ui-overlay-close" aria-label="Close popover"><CloseIcon /></Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal></Primitive.Root>;
}
