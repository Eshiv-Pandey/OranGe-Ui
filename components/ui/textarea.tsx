"use client";
import { useId, type ComponentPropsWithRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";

export type TextareaProps = ComponentPropsWithRef<"textarea"> & AppearanceProps & { label: string; description?: string; error?: string };
export function Textarea({ appearance = "polished", className, label, description, error, id, required, "aria-describedby": describedBy, ...props }: TextareaProps) {
  const uid = useId(); const fieldId = id ?? uid;
  const details = [describedBy, description && fieldId + "-help", error && fieldId + "-error"].filter(Boolean).join(" ") || undefined;
  return <div className={uiClass("ui-field", className)} data-appearance={appearance}>
    <label htmlFor={fieldId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    <textarea {...props} id={fieldId} required={required} aria-invalid={error ? true : props["aria-invalid"]} aria-describedby={details} className="ui-textarea" />
    {description && <p id={fieldId + "-help"} className="ui-help">{description}</p>}
    {error && <p id={fieldId + "-error"} className="ui-error" role="alert">{error}</p>}
  </div>;
}
