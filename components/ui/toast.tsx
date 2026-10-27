"use client";
import { Toast as Primitive } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { CloseIcon } from "./symbols";
import "../../styles/library-components.css";
export type ToastProviderProps = ComponentPropsWithoutRef<typeof Primitive.Provider>;
export function ToastProvider({ children, ...props }: ToastProviderProps) {
  return <Primitive.Provider duration={5000} {...props}>{children}<Primitive.Viewport className="ui-toast-viewport" /></Primitive.Provider>;
}
export type ToastProps = ComponentPropsWithoutRef<typeof Primitive.Root> & AppearanceProps & { title: string; description?: string; action?: { label: string; onClick: () => void }; tone?: "info" | "success" | "danger" };
export function Toast({ appearance = "polished", className, title, description, action, tone = "info", ...props }: ToastProps) {
  return <Primitive.Root {...props} className={uiClass("ui-toast ui-surface", className)} data-appearance={appearance} data-tone={tone}>
    <div><Primitive.Title className="ui-toast-title">{title}</Primitive.Title>{description && <Primitive.Description className="ui-help">{description}</Primitive.Description>}</div>
    {action && <Primitive.Action asChild altText={action.label}><button type="button" className="ui-toast-action" onClick={action.onClick}>{action.label}</button></Primitive.Action>}
    <Primitive.Close className="ui-icon-button" aria-label="Dismiss notification"><CloseIcon /></Primitive.Close>
  </Primitive.Root>;
}
