import type { ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { AIGlyph, type AIGlyphName } from "./ai-glyph";
import "../../styles/launch-ai.css";

export type AgentState = "idle" | "thinking" | "working" | "waiting" | "complete" | "error";
export type AgentStatusProps = AppearanceProps & {
  status: AgentState;
  label?: string;
  detail?: ReactNode;
  /** Turn off when a parent already announces the same status. */
  announce?: boolean;
};

const states: Record<AgentState, { label: string; icon: AIGlyphName }> = {
  idle: { label: "Ready", icon: "pause" }, thinking: { label: "Thinking", icon: "clock" },
  working: { label: "Working", icon: "tool" }, waiting: { label: "Waiting for input", icon: "pause" },
  complete: { label: "Complete", icon: "check" }, error: { label: "Needs attention", icon: "error" },
};

export function AgentStatus({ status, label, detail, announce = true, appearance = "polished", className }: AgentStatusProps) {
  const state = states[status];
  return <div className={uiClass("ui-agent-status", className)} data-appearance={appearance} data-status={status} role={announce ? "status" : undefined} aria-live={announce ? "polite" : undefined} aria-atomic={announce || undefined}>
    <span className="ui-agent-symbol"><AIGlyph name={state.icon} /></span>
    <div><span className="ui-agent-label">{label?.trim() || state.label}</span>{detail && <div className="ui-agent-detail">{detail}</div>}</div>
  </div>;
}
