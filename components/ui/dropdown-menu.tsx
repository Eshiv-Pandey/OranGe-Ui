"use client";
import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useModalBackground } from "./modal-background";
import "../../styles/library-components.css";
export type MenuAction = { value: string; label: string; shortcut?: string; disabled?: boolean; destructive?: boolean; separatorBefore?: boolean };
export type DropdownMenuProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { trigger: ReactElement; label?: string; items: MenuAction[]; onAction?: (value: string) => void };
export function DropdownMenu({ appearance = "polished", className, trigger, label, items, onAction, ...props }: DropdownMenuProps) {
  const modalBackground = useModalBackground(props.modal !== false);
  return <Primitive.Root {...props}><Primitive.Trigger asChild>{trigger}</Primitive.Trigger><Primitive.Portal>
    <Primitive.Content ref={modalBackground} className={uiClass("ui-menu ui-surface", className)} data-appearance={appearance} sideOffset={8} collisionPadding={12}>
      {label && <Primitive.Label className="ui-menu-label">{label}</Primitive.Label>}
      {items.map((item) => <div key={item.value}>{item.separatorBefore && <Primitive.Separator className="ui-menu-separator" />}<Primitive.Item className="ui-menu-item" disabled={item.disabled} data-destructive={item.destructive || undefined} onSelect={() => onAction?.(item.value)}>{item.label}{item.shortcut && <span className="ui-menu-shortcut">{item.shortcut}</span>}</Primitive.Item></div>)}
    </Primitive.Content>
  </Primitive.Portal></Primitive.Root>;
}
