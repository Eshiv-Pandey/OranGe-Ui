"use client";

import { Select as Primitive } from "radix-ui";
import { useId, useState } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { useModalBackground } from "./modal-background";
import { AIGlyph } from "./ai-glyph";
import "../../styles/launch-ai.css";

export type ModelOption = { value: string; label: string; provider?: string; description?: string; tags?: readonly string[]; disabled?: boolean };
export type ModelPickerProps = AppearanceProps & {
  options: readonly ModelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** A rich select with native typeahead, roving focus and form participation. */
export function ModelPicker({ options, value: controlled, defaultValue = "", onValueChange, label = "Model", placeholder = "Choose a model", description, error, disabled = false, required = false, name, open, defaultOpen, onOpenChange, appearance = "polished", className }: ModelPickerProps) {
  const id = useId(), modalBackground = useModalBackground();
  const [local, setLocal] = useState(defaultValue);
  const value = controlled === undefined ? local : controlled;
  const available = options.filter((option) => option.value.length > 0);
  const selected = available.find((option) => option.value === value);
  const help = error || description;
  return <div className={uiClass("ui-model-picker", className)} data-appearance={appearance}>
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <Primitive.Root value={value} onValueChange={(next) => { if (controlled === undefined) setLocal(next); if (next !== value) onValueChange?.(next); }} disabled={disabled || !available.length} required={required} name={name} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Primitive.Trigger id={id} className="ui-model-trigger" aria-labelledby={`${id}-label`} aria-invalid={Boolean(error)} aria-describedby={help ? `${id}-help` : undefined}>
        <Primitive.Value id={`${id}-value`} placeholder={available.length ? placeholder : "No models available"}>{selected ? <span className="ui-model-selected"><strong>{selected.label}</strong>{selected.provider && <small>{selected.provider}</small>}</span> : available.length ? placeholder : "No models available"}</Primitive.Value>
        <Primitive.Icon><AIGlyph name="chevron" /></Primitive.Icon>
      </Primitive.Trigger>
      <Primitive.Portal><Primitive.Content ref={modalBackground} className={uiClass("ui-model-content ui-surface")} data-appearance={appearance} position="popper" sideOffset={8} collisionPadding={16}>
        <Primitive.ScrollUpButton className="ui-model-scroll ui-model-scroll-up"><AIGlyph name="chevron" /></Primitive.ScrollUpButton>
        <Primitive.Viewport className="ui-model-viewport">{available.map((option) => <Primitive.Item key={option.value} value={option.value} disabled={option.disabled} textValue={`${option.label} ${option.provider ?? ""}`} className="ui-model-option">
          <span className="ui-model-option-copy"><span className="ui-model-option-heading"><Primitive.ItemText>{option.label}</Primitive.ItemText>{option.provider && <small>{option.provider}</small>}</span>{option.description && <span className="ui-model-description">{option.description}</span>}{Boolean(option.tags?.length) && <span className="ui-model-tags">{option.tags!.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}</span>}</span>
          <Primitive.ItemIndicator className="ui-model-selected-icon"><AIGlyph name="check" /></Primitive.ItemIndicator>
        </Primitive.Item>)}</Primitive.Viewport>
        <Primitive.ScrollDownButton className="ui-model-scroll"><AIGlyph name="chevron" /></Primitive.ScrollDownButton>
      </Primitive.Content></Primitive.Portal>
    </Primitive.Root>
    {help && <p id={`${id}-help`} className={error ? "ui-error" : "ui-help"} role={error ? "alert" : undefined}>{help}</p>}
  </div>;
}
