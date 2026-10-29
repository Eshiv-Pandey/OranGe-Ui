"use client";

import { useId, useRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { Button } from "./button";
import { AIGlyph } from "./ai-glyph";
import "../../styles/launch-ai.css";

export type PromptAttachment = { id: string; name: string; detail?: string; preview?: ReactNode };
export type PromptInputProps = AppearanceProps & {
  value: string;
  onValueChange: (value: string) => void;
  /** The caller owns sending, errors, clearing the draft and submitting state. */
  onSubmit: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  submitting?: boolean;
  onStop?: () => void;
  submitLabel?: string;
  stopLabel?: string;
  enterBehavior?: "submit" | "newline";
  description?: string;
  error?: string;
  toolbar?: ReactNode;
  attachments?: readonly PromptAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange" | "disabled" | "placeholder" | "children">;
};

export function PromptInput({ value, onValueChange, onSubmit, label = "Message", placeholder = "Ask a question or describe a task", disabled = false, submitting = false, onStop, submitLabel = "Send message", stopLabel = "Stop response", enterBehavior = "submit", description, error, toolbar, attachments = [], onRemoveAttachment, onFilesSelected, accept, multiple = true, textareaProps, appearance = "polished", className }: PromptInputProps) {
  const uid = useId(), fileRef = useRef<HTMLInputElement>(null), composing = useRef(false);
  const { id = `${uid}-input`, onKeyDown, onCompositionStart, onCompositionEnd, "aria-describedby": describedBy, className: textareaClass, ...inputProps } = textareaProps ?? {};
  const canSubmit = !disabled && !submitting && !inputProps.readOnly && (value.trim().length > 0 || attachments.length > 0);
  const help = [describedBy, description && `${uid}-description`, error && `${uid}-error`].filter(Boolean).join(" ") || undefined;
  const submit = () => { if (canSubmit) onSubmit(value); };
  return <form className={uiClass("ui-prompt-input", className)} data-appearance={appearance} data-disabled={disabled || undefined} aria-label={`${label} composer`} onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <label className="ui-prompt-label" htmlFor={id}>{label}</label>
    <div className="ui-prompt-surface ui-surface" data-invalid={Boolean(error)}>
      {attachments.length > 0 && <ul className="ui-prompt-attachments" aria-label="Attachments">{attachments.map((attachment) => <li key={attachment.id} className="ui-prompt-attachment">
        {attachment.preview && <span className="ui-prompt-attachment-preview" aria-hidden="true">{attachment.preview}</span>}
        <span className="ui-prompt-attachment-name"><strong>{attachment.name}</strong>{attachment.detail && <small>{attachment.detail}</small>}</span>
        {onRemoveAttachment && <button type="button" className="ui-icon-button" aria-label={`Remove ${attachment.name}`} disabled={disabled || submitting} onClick={() => onRemoveAttachment(attachment.id)}><AIGlyph name="close" /></button>}
      </li>)}</ul>}
      <textarea {...inputProps} id={id} className={["ui-prompt-textarea", textareaClass].filter(Boolean).join(" ")} rows={inputProps.rows ?? 3} value={value} disabled={disabled} placeholder={placeholder} aria-describedby={help} aria-invalid={Boolean(error) || inputProps["aria-invalid"]} onChange={(event) => onValueChange(event.target.value)} onCompositionStart={(event) => { composing.current = true; onCompositionStart?.(event); }} onCompositionEnd={(event) => { composing.current = false; onCompositionEnd?.(event); }} onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey || event.altKey || composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
        if (enterBehavior === "submit" || event.metaKey || event.ctrlKey) { event.preventDefault(); submit(); }
      }} />
      <div className="ui-prompt-toolbar"><div className="ui-prompt-tools">
        {onFilesSelected && <><input ref={fileRef} type="file" hidden accept={accept} multiple={multiple} disabled={disabled || submitting} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) onFilesSelected(files); }} /><button type="button" className="ui-icon-button" aria-label="Attach files" disabled={disabled || submitting} onClick={() => fileRef.current?.click()}><AIGlyph name="attach" /></button></>}
        {toolbar}
      </div>{submitting && onStop ? <Button appearance={appearance} variant="secondary" disabled={disabled} onClick={onStop} aria-label={stopLabel}><AIGlyph name="stop" /><span>{stopLabel}</span></Button> : <Button appearance={appearance} type="submit" disabled={!canSubmit} aria-label={submitLabel}><AIGlyph name="send" /><span>{submitting ? "Sending" : submitLabel}</span></Button>}</div>
    </div>
    {description && <p id={`${uid}-description`} className="ui-help">{description}</p>}
    {error && <p id={`${uid}-error`} className="ui-error" role="alert">{error}</p>}
    <span className="sr-only" role="status" aria-live="polite">{submitting ? "Response in progress" : ""}</span>
  </form>;
}
