import type { ComponentPropsWithRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-forms.css";

export type KbdProps = ComponentPropsWithRef<"kbd"> & AppearanceProps;
export function Kbd({ appearance = "polished", className, ...props }: KbdProps) {
  return <kbd {...props} className={uiClass("ui-kbd", className)} data-appearance={appearance} />;
}
