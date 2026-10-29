"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { z } from "zod";
import { uiClass, type AppearanceProps } from "./appearance";
import type { InputProps } from "./input";
import "../../styles/launch-forms.css";

export type FormErrors<T> = Partial<Record<Extract<keyof T, string>, string>>;
export type FormFieldBinding = Pick<InputProps, "id" | "name" | "value" | "checked" | "onChange" | "error" | "disabled">;
export type ValidatedFormState<T extends Record<string, unknown>> = {
  values: T; errors: FormErrors<T>; submitting: boolean; formError: string;
  setValue: <K extends Extract<keyof T, string>>(name: K, value: T[K]) => void;
  field: (name: Extract<keyof T, string>) => FormFieldBinding;
  reset: () => void;
};
export type FormProps<T extends Record<string, unknown>> = Omit<ComponentPropsWithoutRef<"form">, "children" | "onSubmit" | "onReset" | "defaultValue"> & AppearanceProps & {
  defaultValues: T; schema: z.ZodType<T>; onSubmit: (values: T) => void | Promise<void>;
  children: (form: ValidatedFormState<T>) => ReactNode; onReset?: () => void;
};

function FormFields<T extends Record<string, unknown>>({ state, children }: { state: ValidatedFormState<T>; children: FormProps<T>["children"] }) {
  return <fieldset className="ui-form-fields" disabled={state.submitting}>{children(state)}</fieldset>;
}

/** Zod validation, field errors, native reset and guarded asynchronous submission. */
export function Form<T extends Record<string, unknown>>({ defaultValues, schema, onSubmit, children, onReset, appearance = "polished", className, ...props }: FormProps<T>) {
  const id = useId(), formRef = useRef<HTMLFormElement>(null);
  const [initial] = useState(defaultValues);
  const [values, setValues] = useState(defaultValues), [errors, setErrors] = useState<FormErrors<T>>({});
  const [submitting, setSubmitting] = useState(false), [formError, setFormError] = useState("");
  const busy = useRef(false), mounted = useRef(true), revision = useRef(0), errorFocus = useRef<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (submitting || !errorFocus.current) return;
    const control = formRef.current?.elements.namedItem(errorFocus.current);
    if (control instanceof HTMLElement) control.focus(); else if (control && "item" in control) (control.item(0) as HTMLElement | null)?.focus();
    errorFocus.current = null;
  }, [submitting, errors]);
  function reset() { revision.current++; setValues(initial); setErrors({}); setFormError(""); onReset?.(); }
  function setValue<K extends Extract<keyof T, string>>(name: K, value: T[K]) {
    revision.current++; setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => { const next = { ...current }; delete next[name]; return next; }); setFormError("");
  }
  function field(name: Extract<keyof T, string>): FormFieldBinding {
    const value = values[name];
    return { id: `${id}-${name}`, name, value: typeof value === "string" || typeof value === "number" || Array.isArray(value) ? value as string | number | string[] : "", checked: typeof value === "boolean" ? value : undefined, disabled: submitting, error: errors[name], onChange: (event) => { const element = event.currentTarget; setValue(name, (element.type === "checkbox" ? element.checked : element.type === "number" && element.value !== "" ? element.valueAsNumber : element.value) as T[typeof name]); } };
  }
  return <form {...props} ref={formRef} noValidate className={uiClass("ui-validated-form", className)} data-appearance={appearance} aria-busy={submitting || undefined} onReset={(event) => { event.preventDefault(); if (!busy.current) reset(); }} onSubmit={async (event) => {
    event.preventDefault(); if (busy.current) return;
    busy.current = true; setSubmitting(true); setFormError(""); const currentRevision = revision.current;
    try {
      const result = await schema.safeParseAsync(values);
      if (!mounted.current || currentRevision !== revision.current) return;
      if (!result.success) {
        const next: FormErrors<T> = {};
        for (const issue of result.error.issues) { const name = issue.path.join(".") as Extract<keyof T, string>; if (name && !next[name]) next[name] = issue.message; }
        setErrors(next); setFormError(result.error.issues.find((issue) => !issue.path.length)?.message ?? "Check the highlighted fields.");
        errorFocus.current = Object.keys(next)[0] ?? null;
        return;
      }
      setErrors({}); await onSubmit(result.data);
    } catch (error) { if (mounted.current) setFormError(error instanceof Error && error.message ? error.message : "The form could not be submitted. Try again."); }
    finally { busy.current = false; if (mounted.current) setSubmitting(false); }
  }}>
    {formError && <p className="ui-form-error" role="alert">{formError}</p>}
    <FormFields state={{ values, errors, submitting, formError, setValue, field, reset }}>{children}</FormFields>
  </form>;
}
