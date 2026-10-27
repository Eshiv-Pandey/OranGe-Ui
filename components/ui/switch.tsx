"use client";
import { useId, type ComponentPropsWithRef } from "react";
import { Switch as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type SwitchProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps & { label: string; description?: string };
export function Switch({ appearance = "polished", className, label, description, id, "aria-describedby": describedBy, ...props }: SwitchProps) {
  const uid = useId(); const fieldId = id ?? uid;
  const details = [describedBy, description && fieldId + "-help"].filter(Boolean).join(" ") || undefined;
  return <div className={uiClass("ui-choice ui-switch-field", className)} data-appearance={appearance} data-disabled={props.disabled || undefined}>
    <div><label htmlFor={fieldId}>{label}</label>{description && <p id={fieldId + "-help"} className="ui-help">{description}</p>}</div>
    <Primitive.Root {...props} id={fieldId} className="ui-switch" aria-describedby={details}><Primitive.Thumb className="ui-switch-thumb" /></Primitive.Root>
  </div>;
}
