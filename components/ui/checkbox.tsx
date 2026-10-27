"use client";
import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { Checkbox as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import { CheckIcon } from "./symbols";
import "../../styles/library-components.css";
export type CheckboxProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps & { label: ReactNode; description?: string };
export function Checkbox({ appearance = "polished", className, label, description, id, "aria-describedby": describedBy, ...props }: CheckboxProps) {
  const uid = useId(); const fieldId = id ?? uid;
  const details = [describedBy, description && fieldId + "-help"].filter(Boolean).join(" ") || undefined;
  return <div className={uiClass("ui-choice", className)} data-appearance={appearance} data-disabled={props.disabled || undefined}>
    <Primitive.Root {...props} id={fieldId} className="ui-checkbox" aria-describedby={details}><Primitive.Indicator className="ui-checkbox-indicator"><CheckIcon className="ui-checkmark" /><span aria-hidden="true" className="ui-indeterminate">−</span></Primitive.Indicator></Primitive.Root>
    <div><label htmlFor={fieldId}>{label}</label>{description && <p id={fieldId + "-help"} className="ui-help">{description}</p>}</div>
  </div>;
}
