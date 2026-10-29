import type { ComponentPropsWithRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type LabelProps = ComponentPropsWithRef<"label"> & AppearanceProps & { required?: boolean; disabled?: boolean };
export function Label({ appearance = "polished", className, required, disabled, children, ...props }: LabelProps) {
  return <label {...props} className={uiClass("ui-label", className)} data-appearance={appearance} data-disabled={disabled || undefined}>{children}{required && <span aria-hidden="true"> *</span>}</label>;
}
