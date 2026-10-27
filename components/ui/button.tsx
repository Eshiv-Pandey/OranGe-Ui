"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ComponentPropsWithRef, type HTMLAttributes, type ReactNode } from "react";
import { z } from "zod";
import "../../styles/primitives.css";
import type { AppearanceProps } from "./appearance";

function isNode(value: unknown): boolean {
  return value == null || typeof value === "string" || typeof value === "number" ||
    typeof value === "boolean" || isValidElement(value) || (Array.isArray(value) && value.every(isNode));
}

const nodeSchema: z.ZodType<ReactNode> = z.custom<ReactNode>(isNode, "Expected renderable content");

export const buttonPropsSchema = z.object({
  appearance: z.enum(["polished", "pixel"]).optional(),
  variant: z.enum(["primary", "secondary", "ghost"]).optional(),
  loading: z.boolean().optional(),
  disabled: z.boolean().optional(),
  asChild: z.boolean().optional(),
  type: z.enum(["button", "submit", "reset"]).optional(),
  children: nodeSchema.optional(),
  className: z.string().optional(),
  onClick: z.custom<NonNullable<ButtonHTMLAttributes<HTMLButtonElement>["onClick"]>>((value) => typeof value === "function").optional(),
}).passthrough();

export const buttonVariants = cva("pixel-button", {
  variants: {
    variant: {
      primary: "pixel-button--primary",
      secondary: "pixel-button--secondary",
      ghost: "pixel-button--ghost",
    },
  },
  defaultVariants: { variant: "primary" },
});

export type ButtonProps = ComponentPropsWithRef<"button"> & AppearanceProps &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    asChild?: boolean;
  };

export const buttonMeta = {
  name: "Button",
  purpose: "A softly rounded, tactile control for actions and navigation.",
  whenToUse: "Use primary for the main action, secondary for supporting actions, and ghost for quiet actions.",
  whenNotToUse: "Use a normal text link for links inside paragraphs. Use Input for editable values.",
  props: buttonPropsSchema,
  composesWith: ["Input", "StatCard"],
  example: '<Button variant="primary">Get started</Button>',
} as const;

export function Button({
  appearance = "polished",
  variant = "primary",
  loading = false,
  disabled = false,
  asChild = false,
  type = "button",
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: ButtonProps) {
  const unavailable = disabled || loading;
  const classes = buttonVariants({ variant, className });

  if (asChild) {
    const stopActivation: NonNullable<HTMLAttributes<HTMLElement>["onClick"]> = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const stopKeyActivation: NonNullable<HTMLAttributes<HTMLElement>["onKeyDown"]> = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    type ChildProps = HTMLAttributes<HTMLElement> & { disabled?: boolean; type?: "button" | "submit" | "reset"; "data-disabled"?: boolean; "data-loading"?: boolean };
    const child = isValidElement<ChildProps>(children)
      ? cloneElement(children, {
          ...(children.type === "button" ? { type: children.props.type ?? type, disabled: unavailable || children.props.disabled } : {}),
          ...(unavailable ? {
            "aria-disabled": true,
            "aria-busy": loading || undefined,
            "data-disabled": true,
            "data-loading": loading || undefined,
            tabIndex: -1,
            onClick: stopActivation,
            onClickCapture: stopActivation,
            onKeyDown: stopKeyActivation,
            onKeyDownCapture: stopKeyActivation,
          } : {}),
        })
      : children;
    return (
      <Slot
        {...props}
        data-appearance={appearance}
        className={classes}
        aria-disabled={unavailable || undefined}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        data-disabled={unavailable || undefined}
        data-as-child="true"
        tabIndex={unavailable ? -1 : props.tabIndex}
        onClick={(event) => {
          if (unavailable) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (!event.defaultPrevented) onClick?.(event as unknown as Parameters<NonNullable<typeof onClick>>[0]);
        }}
        onKeyDown={(event) => {
          if (unavailable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            return;
          }
          if (!event.defaultPrevented) onKeyDown?.(event as unknown as Parameters<NonNullable<typeof onKeyDown>>[0]);
        }}
      >
        {child}
      </Slot>
    );
  }

  return (
    <button
      {...props}
      data-appearance={appearance}
      type={type}
      className={classes}
      disabled={unavailable}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {loading && <span className="pixel-spinner" aria-hidden="true" />}
      <span className="pixel-button__content">{children}</span>
    </button>
  );
}
