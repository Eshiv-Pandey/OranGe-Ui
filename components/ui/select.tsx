"use client";
import { useId, type ComponentPropsWithRef } from "react";
import { Select as Primitive } from "radix-ui";
import { uiClass, type AppearanceProps } from "./appearance";
import { useModalBackground } from "./modal-background";
import { CheckIcon, ChevronIcon } from "./symbols";
import "../../styles/library-components.css";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectProps = ComponentPropsWithRef<typeof Primitive.Root> & AppearanceProps & { label: string; options: SelectOption[]; placeholder?: string; description?: string; error?: string };
export function Select({ appearance = "polished", className, label, options, placeholder = "Choose an option", description, error, ...props }: SelectProps) {
  const modalBackground = useModalBackground();
  const id = useId();
  return <div className={uiClass("ui-field", className)} data-appearance={appearance}>
    <label id={id + "-label"} htmlFor={id}>{label}</label>
    <Primitive.Root {...props}>
      <Primitive.Trigger id={id} className="ui-select-trigger" aria-labelledby={id + "-label"} aria-invalid={!!error} aria-describedby={error || description ? id + "-help" : undefined}><Primitive.Value placeholder={placeholder} /><Primitive.Icon><ChevronIcon /></Primitive.Icon></Primitive.Trigger>
      <Primitive.Portal><Primitive.Content ref={modalBackground} className={uiClass("ui-select-content ui-surface")} data-appearance={appearance} position="popper" sideOffset={6}>
        <Primitive.ScrollUpButton className="ui-select-scroll">↑</Primitive.ScrollUpButton>
        <Primitive.Viewport>{options.map((option) => <Primitive.Item key={option.value} value={option.value} disabled={option.disabled} className="ui-select-option"><Primitive.ItemText>{option.label}</Primitive.ItemText><Primitive.ItemIndicator><CheckIcon /></Primitive.ItemIndicator></Primitive.Item>)}</Primitive.Viewport>
        <Primitive.ScrollDownButton className="ui-select-scroll">↓</Primitive.ScrollDownButton>
      </Primitive.Content></Primitive.Portal>
    </Primitive.Root>
    {(error || description) && <p id={id + "-help"} className={error ? "ui-error" : "ui-help"} role={error ? "alert" : undefined}>{error || description}</p>}
  </div>;
}
