import { useId, type ReactNode } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-ai.css";

export type ChatMessageRole = "user" | "assistant" | "system" | "tool";
export type ChatMessageStatus = "complete" | "sending" | "streaming" | "error";
export type ChatMessageProps = AppearanceProps & {
  role: ChatMessageRole;
  children: ReactNode;
  author?: string;
  avatar?: ReactNode;
  timestamp?: ReactNode;
  dateTime?: string;
  status?: ChatMessageStatus;
  statusLabel?: string;
  actions?: ReactNode;
  metadata?: ReactNode;
};

const authors: Record<ChatMessageRole, string> = { user: "You", assistant: "Assistant", system: "System", tool: "Tool" };
const statuses: Record<ChatMessageStatus, string> = { complete: "", sending: "Sending", streaming: "Responding", error: "Message failed" };

/** A message shell; compose Markdown or other rich content through children. */
export function ChatMessage({ role, children, author, avatar, timestamp, dateTime, status = "complete", statusLabel, actions, metadata, appearance = "polished", className }: ChatMessageProps) {
  const id = useId();
  const name = author?.trim() || authors[role];
  const stateLabel = statusLabel ?? statuses[status];
  return <article className={uiClass("ui-chat-message", className)} data-appearance={appearance} data-role={role} data-status={status} aria-labelledby={`${id}-author`}>
    {avatar && <div className="ui-chat-avatar" aria-hidden="true" inert>{avatar}</div>}
    <div className="ui-chat-main">
      <header className="ui-chat-header"><strong id={`${id}-author`}>{name}</strong>{timestamp && <time dateTime={dateTime}>{timestamp}</time>}{metadata && <span className="ui-chat-metadata">{metadata}</span>}</header>
      <div className="ui-chat-content" aria-busy={status === "sending" || status === "streaming" || undefined}>{children}</div>
      <span className="ui-chat-status" role="status" aria-live="polite" aria-atomic="true">{stateLabel}</span>
      {actions && <div className="ui-chat-actions" role="group" aria-label={`${name} message actions`}>{actions}</div>}
    </div>
  </article>;
}
