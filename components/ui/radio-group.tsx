"use client";
import { useId, type ComponentPropsWithRef } from "react";
import { RadioGroup as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/library-components.css";
export type RadioOption = { value: string; label: string; description?: string; disabled?: boolean };
export type RadioGroupProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps & { label: string; options: RadioOption[] };
export function RadioGroup({ appearance = "polished", className, label, options, ...props }: RadioGroupProps) {
  const id = useId();
  return <fieldset className={uiClass("ui-radio-group", className)} data-appearance={appearance} disabled={props.disabled}><legend>{label}</legend>
    <Primitive.Root {...props} aria-label={label}>{options.map((option, index) => <div className="ui-choice" key={option.value} data-disabled={option.disabled || props.disabled || undefined}>
      <Primitive.Item value={option.value} disabled={option.disabled} id={id + index} className="ui-radio" aria-describedby={option.description ? id + index + "-help" : undefined}><Primitive.Indicator className="ui-radio-dot" /></Primitive.Item>
      <div><label htmlFor={id + index}>{option.label}</label>{option.description && <p id={id + index + "-help"} className="ui-help">{option.description}</p>}</div>
    </div>)}</Primitive.Root>
  </fieldset>;
}
