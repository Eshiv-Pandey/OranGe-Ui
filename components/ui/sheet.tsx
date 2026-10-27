"use client";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useModalBackground } from "./modal-background";
import { CloseIcon } from "./symbols";
import "../../styles/library-components.css";
export type SheetProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { trigger: ReactElement; title: string; description?: string; children: ReactNode; footer?: ReactNode; side?: "left" | "right" };
export function Sheet({ appearance = "polished", className, trigger, title, description, children, footer, side = "right", ...props }: SheetProps) {
  const modalBackground = useModalBackground(props.modal !== false);
  return <Primitive.Root {...props}><Primitive.Trigger asChild>{trigger}</Primitive.Trigger><Primitive.Portal>
    <Primitive.Overlay className="ui-overlay" />
    <Primitive.Content ref={modalBackground} className={uiClass("ui-sheet ui-surface", className)} data-appearance={appearance} data-side={side} {...(!description ? { "aria-describedby": undefined } : {})}>
      <Primitive.Title className="ui-overlay-title">{title}</Primitive.Title>
      {description && <Primitive.Description className="ui-overlay-description">{description}</Primitive.Description>}
      <div className="ui-overlay-body">{children}</div>
      {footer && <div className="ui-overlay-footer">{footer}</div>}
      <Primitive.Close className="ui-icon-button ui-overlay-close" aria-label="Close panel"><CloseIcon /></Primitive.Close>
    </Primitive.Content>
  </Primitive.Portal></Primitive.Root>;
}
