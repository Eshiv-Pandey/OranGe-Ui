"use client";

import { useId, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { Switch as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/wall-switch.css";

export type WallSwitchProps = Omit<ComponentPropsWithoutRef<typeof Primitive.Root>, "children" | "className"> & AppearanceProps & {
  label: string;
  description?: string;
  size?: number;
};

/** A household rocker, with native switch semantics and form support. */
export function WallSwitch({ label, description, size = 152, appearance = "polished", className, id, "aria-describedby": describedBy, ...props }: WallSwitchProps) {
  const uid = useId(), fieldId = id ?? uid;
  const details = [describedBy, description && `${fieldId}-help`].filter(Boolean).join(" ") || undefined;
  return <div className={uiClass("wall-switch-field", className)} data-appearance={appearance} data-disabled={props.disabled || undefined}>
    <Primitive.Root {...props} id={fieldId} aria-describedby={details} className="wall-switch" style={{ "--wall-switch-size": `${Math.max(96, Math.min(240, size))}px` } as CSSProperties}>
      <span className="wall-switch-screw" aria-hidden="true" />
      <span className="wall-switch-recess" aria-hidden="true"><span className="wall-switch-rocker"><span className="wall-switch-on">I</span><span className="wall-switch-indicator" /><span className="wall-switch-off">O</span></span></span>
      <span className="wall-switch-screw" aria-hidden="true" />
    </Primitive.Root>
    <label htmlFor={fieldId}>{label}</label>
    {description && <p id={`${fieldId}-help`} className="ui-help">{description}</p>}
  </div>;
}
