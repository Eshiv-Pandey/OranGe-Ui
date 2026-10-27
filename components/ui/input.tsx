"use client";

import { isValidElement, useId, type ComponentPropsWithRef, type InputHTMLAttributes, type ReactNode } from "react";
import { z } from "zod";
import "../../styles/primitives.css";
import { APPEARANCE_VALUES, type AppearanceProps } from "./appearance";

export const inputPropsSchema = z.object({
  appearance: z.enum(APPEARANCE_VALUES).optional(),
  label: z.string().optional(),
  hideLabel: z.boolean().optional(),
  description: z.string().optional(),
  error: z.string().optional(),
  icon: z.custom<ReactNode>((value) => value == null || isValidElement(value) || typeof value === "string").optional(),
  loading: z.boolean().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  id: z.string().optional(),
  placeholder: z.string().optional(),
  type: z.string().optional(),
  value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  defaultValue: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
  onChange: z.custom<NonNullable<InputHTMLAttributes<HTMLInputElement>["onChange"]>>((value) => typeof value === "function").optional(),
}).passthrough();

export type InputProps = ComponentPropsWithRef<"input"> & AppearanceProps & {
  label?: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  icon?: ReactNode;
  loading?: boolean;
};

export const inputMeta = {
  name: "Input",
  purpose: "A readable, rounded text field with clear focus and validation.",
  whenToUse: "Use for short editable text, search, email, and other native input values. Provide a label or accessible name.",
  whenNotToUse: "Use a multiline field for long text and a selection control for a fixed list of choices.",
  props: inputPropsSchema,
  composesWith: ["Button"],
  example: '<Input label="Email" type="email" placeholder="you@example.com" />',
} as const;

export function Input({
  appearance = "polished",
  label,
  hideLabel = false,
  description,
  error,
  icon,
  loading = false,
  id,
  className,
  disabled,
  required,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? `input-${generatedId}`;
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;
  const descriptionIds = [describedBy, description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`pixel-field${className ? ` ${className}` : ""}`} data-appearance={appearance} data-error={Boolean(error) || undefined} data-disabled={disabled || undefined}>
      {label && <label htmlFor={fieldId} className={hideLabel ? "sr-only" : "pixel-field__label"}>{label}{required && <span aria-hidden="true"> *</span>}</label>}
      <div className="pixel-field__frame">
        {icon && <span className="pixel-field__icon" aria-hidden="true">{icon}</span>}
        <input
          {...props}
          id={fieldId}
          className="pixel-input"
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : invalid}
          aria-describedby={descriptionIds}
          aria-busy={loading || undefined}
        />
        {loading && <span className="pixel-spinner pixel-field__spinner" aria-hidden="true" />}
        {error && <span className="pixel-field__error-icon" aria-hidden="true">!</span>}
      </div>
      {description && <p id={descriptionId} className="pixel-field__description">{description}</p>}
      {error && <p id={errorId} className="pixel-field__error" role="alert">{error}</p>}
    </div>
  );
}
