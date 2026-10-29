"use client";

import { Collapsible as Primitive } from "radix-ui";
import { useId, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { CodeBlock } from "./code-block";
import { AIGlyph, type AIGlyphName } from "./ai-glyph";
import "../../styles/launch-ai.css";

export type ToolCallStatus = "pending" | "running" | "success" | "error";
export type ToolCallCardProps = AppearanceProps & {
  name: string;
  status: ToolCallStatus;
  summary?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  durationMs?: number;
  children?: ReactNode;
  actions?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const states: Record<ToolCallStatus, { label: string; icon: AIGlyphName }> = {
  pending: { label: "Pending", icon: "clock" }, running: { label: "Running", icon: "tool" },
  success: { label: "Complete", icon: "check" }, error: { label: "Failed", icon: "error" },
};

export function formatToolValue(value: unknown): string {
  if (typeof value === "string") return value;
  const ancestors: object[] = [];
  try {
    return JSON.stringify(value, function (_key, item: unknown) {
      if (typeof item === "bigint") return item.toString();
      if (typeof item === "object" && item !== null) {
        while (ancestors.length && ancestors.at(-1) !== this) ancestors.pop();
        if (ancestors.includes(item)) return "[Circular]";
        ancestors.push(item);
      }
      return item;
    }, 2) ?? String(value);
  } catch { return "This value could not be displayed."; }
}

export function ToolCallCard({ name, status, summary, input, output, error, durationMs, children, actions, open, defaultOpen = false, onOpenChange, appearance = "polished", className }: ToolCallCardProps) {
  const id = useId(), state = states[status];
  const duration = typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs >= 0 ? durationMs < 1000 ? `${Math.round(durationMs)} ms` : `${(durationMs / 1000).toFixed(1)} s` : undefined;
  return <Primitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={uiClass("ui-tool-call ui-surface", className)} data-appearance={appearance} data-status={status}>
    <Primitive.Trigger className="ui-tool-trigger">
      <span className="ui-tool-symbol"><AIGlyph name="tool" /></span><span className="ui-tool-heading"><strong>{name}</strong>{summary && <span>{summary}</span>}</span>
      <span className="ui-tool-state" role="status" aria-live="polite" aria-atomic="true"><AIGlyph name={state.icon} /><span>{state.label}</span></span>{duration && <span className="ui-tool-duration">{duration}</span>}<AIGlyph name="chevron" className="ui-tool-chevron" />
    </Primitive.Trigger>
    <Primitive.Content className="ui-tool-content">
      <div className="ui-tool-details" aria-busy={status === "running" || undefined}>
        {input !== undefined && <section aria-labelledby={`${id}-input`}><h4 id={`${id}-input`}>Input</h4><CodeBlock code={formatToolValue(input)} language={typeof input === "string" ? "text" : "json"} label={`${name} input`} maxHeight={240} appearance={appearance} /></section>}
        {output !== undefined && <section aria-labelledby={`${id}-output`}><h4 id={`${id}-output`}>Output</h4><CodeBlock code={formatToolValue(output)} language={typeof output === "string" ? "text" : "json"} label={`${name} output`} maxHeight={320} appearance={appearance} /></section>}
        {error && <p className="ui-error" role="alert">{error}</p>}
        {children}
        {input === undefined && output === undefined && !error && !children && <p className="ui-tool-empty">{status === "pending" ? "Waiting to start." : status === "running" ? "The tool is working." : "No additional details."}</p>}
        {actions && <div className="ui-tool-actions">{actions}</div>}
      </div>
    </Primitive.Content>
  </Primitive.Root>;
}
