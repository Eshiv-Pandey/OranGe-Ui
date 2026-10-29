"use client";

import { ContextMenu as Primitive } from "radix-ui";
import { Fragment, useEffect, useId, useRef, useState, type ReactElement } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import type { MenuAction } from "./dropdown-menu";
import { useModalBackground } from "./modal-background";
import { useControllableValue } from "./navigation-shared";
import "../../styles/launch-navigation.css";

export type ContextMenuProps = AppearanceProps & {
  trigger: ReactElement;
  items: readonly MenuAction[];
  label?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: (value: string) => void;
  modal?: boolean;
  dir?: "ltr" | "rtl";
};

function openAtTrigger(target: HTMLElement) {
  const rect = target.getBoundingClientRect();
  const WindowMouseEvent = target.ownerDocument.defaultView?.MouseEvent;
  if (WindowMouseEvent) target.dispatchEvent(new WindowMouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, clientX: rect.left + Math.min(12, rect.width / 2), clientY: rect.top + Math.min(12, rect.height / 2) }));
}

export function ContextMenu({ trigger, items, label = "Actions", disabled = false, open: controlled, defaultOpen = false, onOpenChange, onAction, modal = true, dir, appearance = "polished", className }: ContextMenuProps) {
  const [open, setOpen] = useControllableValue(controlled, defaultOpen, onOpenChange);
  const [anchored, setAnchored] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const outside = useRef(false);
  const id = useId();
  const modalBackground = useModalBackground(modal);
  useEffect(() => {
    if (open && !anchored && !disabled && triggerRef.current) openAtTrigger(triggerRef.current);
  }, [open, anchored, disabled]);
  const shown = open && anchored && !disabled;
  return <Primitive.Root open={shown} onOpenChange={setOpen} modal={modal} dir={dir}>
    <Primitive.Trigger asChild ref={triggerRef} disabled={disabled} tabIndex={disabled ? undefined : 0} aria-haspopup={disabled ? undefined : "menu"} aria-expanded={shown} aria-controls={shown ? id : undefined} onContextMenu={() => { if (!disabled) setAnchored(true); }} onKeyDown={(event) => {
      if (disabled || event.defaultPrevented || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) return;
      event.preventDefault();
      openAtTrigger(event.currentTarget);
    }}>{trigger}</Primitive.Trigger>
    <Primitive.Portal><Primitive.Content id={id} ref={modalBackground} aria-label={label} className={uiClass("ui-menu ui-surface ui-context-menu", className)} data-appearance={appearance} collisionPadding={12} onInteractOutside={() => { outside.current = true; }} onCloseAutoFocus={(event) => { if (!outside.current) { event.preventDefault(); triggerRef.current?.focus(); } outside.current = false; }}>
      <Primitive.Label className="ui-menu-label">{label}</Primitive.Label>
      {items.map((item) => <Fragment key={item.value}>{item.separatorBefore && <Primitive.Separator className="ui-menu-separator" />}<Primitive.Item className="ui-menu-item" disabled={item.disabled} data-destructive={item.destructive || undefined} onSelect={() => onAction?.(item.value)}>{item.label}{item.shortcut && <span className="ui-menu-shortcut">{item.shortcut}</span>}</Primitive.Item></Fragment>)}
    </Primitive.Content></Primitive.Portal>
  </Primitive.Root>;
}
