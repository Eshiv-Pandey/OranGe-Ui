"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { Appearance } from "../ui/appearance";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Tabs } from "../ui/tabs";
import { ChatMessage } from "../ui/chat-message";
import { PromptInput, type PromptAttachment } from "../ui/prompt-input";
import { ModelPicker, type ModelOption } from "../ui/model-picker";
import { ToolCallCard, type ToolCallStatus } from "../ui/tool-call-card";
import { AgentStatus, type AgentState } from "../ui/agent-status";
import { ThinkingIndicator } from "../ui/thinking-indicator";
import { Markdown } from "../ui/markdown";
import "../../styles/ai-demos.css";

export const AI_DEMO_SLUGS = ["chat-message", "prompt-input", "tool-call-card", "agent-status", "thinking-indicator", "model-picker", "markdown"] as const;
const demoModels: ModelOption[] = [
  { value: "swift", label: "Swift", provider: "Example provider", description: "A quick reply for everyday tasks.", tags: ["Fast", "Writing"] },
  { value: "reason", label: "Reason", provider: "Local", description: "Take time to compare the details.", tags: ["Research", "Code"] },
  { value: "studio", label: "Studio", provider: "Example provider", description: "Unavailable in this preview.", tags: ["Images"], disabled: true },
];
const response = "Start with the smallest useful interface. Keep the primary action visible, label it clearly, and preserve keyboard access as the viewport shrinks.";
const responseWords = response.match(/\S+\s*/g) ?? [];
type StreamState = { position: number; mode: "idle" | "streaming" | "stopped" | "complete" };
function streamReducer(state: StreamState, action: "start" | "stop" | "reset" | "tick"): StreamState {
  if (action === "start") return { position: 0, mode: "streaming" };
  if (action === "reset") return { position: 0, mode: "idle" };
  if (action === "stop") return state.mode === "streaming" ? { ...state, mode: "stopped" } : state;
  if (state.mode !== "streaming") return state;
  const position = Math.min(responseWords.length, state.position + 1);
  return { position, mode: position === responseWords.length ? "complete" : "streaming" };
}

export function AIDemo({ slug, appearance, thumbnail = false }: { slug: string; appearance: Appearance; thumbnail?: boolean }) {
  switch (slug) {
    case "chat-message": return <ChatMessageDemo appearance={appearance} thumbnail={thumbnail} />;
    case "prompt-input": return <PromptInputDemo appearance={appearance} thumbnail={thumbnail} />;
    case "tool-call-card": return <ToolCallDemo appearance={appearance} thumbnail={thumbnail} />;
    case "agent-status": return <AgentStatusDemo appearance={appearance} thumbnail={thumbnail} />;
    case "thinking-indicator": return <ThinkingDemo appearance={appearance} thumbnail={thumbnail} />;
    case "model-picker": return <ModelPickerDemo appearance={appearance} thumbnail={thumbnail} />;
    case "markdown": return <MarkdownDemo appearance={appearance} thumbnail={thumbnail} />;
    default: return null;
  }
}

/** A deterministic, local stream demonstrates updates without a provider request. */
export function ChatMessageDemo({ appearance, thumbnail = false }: { appearance: Appearance; thumbnail?: boolean }) {
  const [stream, dispatch] = useReducer(streamReducer, { position: 0, mode: "idle" });
  useEffect(() => {
    if (stream.mode !== "streaming" || thumbnail) return;
    const interval = window.setInterval(() => dispatch("tick"), 80);
    return () => window.clearInterval(interval);
  }, [stream.mode, thumbnail]);
  const content = thumbnail ? "Keep the primary action easy to find, with clear labels and keyboard access." : responseWords.slice(0, stream.position).join("");
  const label = stream.mode === "streaming" ? "Responding" : stream.mode === "stopped" ? "Response stopped" : stream.mode === "complete" ? "Response complete" : "Ready to preview";
  return <div className="demo-stack launch-chat-demo"><div>
    <ChatMessage role="user" appearance={appearance}>How can I simplify this interface?</ChatMessage>
    <ChatMessage role="assistant" author="Workspace helper" appearance={appearance} status={stream.mode === "streaming" ? "streaming" : "complete"} statusLabel={thumbnail ? "" : label}>
      {content ? <Markdown content={content} appearance={appearance} /> : <p className="launch-ai-placeholder">Start the preview to watch a response arrive.</p>}
    </ChatMessage>
  </div>{!thumbnail && <><div className="demo-row"><Button appearance={appearance} onClick={() => dispatch("start")} disabled={stream.mode === "streaming"}>Start response</Button><Button appearance={appearance} variant="secondary" onClick={() => dispatch("stop")} disabled={stream.mode !== "streaming"}>Stop response</Button><Button appearance={appearance} variant="ghost" onClick={() => dispatch("reset")} disabled={stream.mode === "idle"}>Reset response</Button></div><p className="demo-feedback">This local preview streams a fixed example. It does not contact a model.</p></>}</div>;
}

function PromptInputDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [draft, setDraft] = useState(""), [model, setModel] = useState("swift"), [submitting, setSubmitting] = useState(false), [feedback, setFeedback] = useState("");
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]), nextFile = useRef(0);
  useEffect(() => { if (!submitting) return; const timer = window.setTimeout(() => setSubmitting(false), 1600); return () => window.clearTimeout(timer); }, [submitting]);
  return <div className="demo-stack"><PromptInput appearance={appearance} value={draft} onValueChange={setDraft} onSubmit={(text) => { setFeedback(text.trim() ? `Submitted to the local preview: ${text}` : `Submitted ${attachments.length} attachment${attachments.length === 1 ? "" : "s"} to the local preview.`); setDraft(""); setAttachments([]); setSubmitting(true); }} submitting={submitting} onStop={() => { setSubmitting(false); setFeedback("Response stopped in this preview."); }} label="Your message" description={thumbnail ? undefined : "Enter sends. Shift+Enter adds a line. Files stay in this preview."} toolbar={thumbnail ? undefined : <ModelPicker appearance={appearance} label="Response model" options={demoModels} value={model} onValueChange={setModel} />} attachments={attachments} onRemoveAttachment={(id) => setAttachments((current) => current.filter((file) => file.id !== id))} onFilesSelected={thumbnail ? undefined : (files) => { const incoming = files.map((file) => ({ id: String(++nextFile.current), name: file.name, detail: `${Math.max(1, Math.ceil(file.size / 1024))} KB` })); setAttachments((current) => [...current, ...incoming]); }} />{!thumbnail && <p className="demo-feedback launch-submitted-text" role="status">{submitting ? "Preparing the local preview response." : feedback || "Send a draft to try the composer."}</p>}</div>;
}

function ToolCallDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [status, setStatus] = useState<ToolCallStatus>("success");
  return <div className="demo-stack"><ToolCallCard appearance={appearance} name="Search component files" status={status} summary={status === "success" ? "Found three matching files" : "Look for theme definitions"} input={{ query: "theme tokens", directory: "styles" }} output={status === "success" ? { files: ["tokens.css", "appearances.css", "library-base.css"] } : undefined} durationMs={status === "success" ? 1240 : undefined} error={status === "error" ? "The source is unavailable. Try the example again." : undefined} actions={status === "error" ? <Button appearance={appearance} variant="secondary" onClick={() => setStatus("running")}>Retry search</Button> : undefined} />{!thumbnail && <Select appearance={appearance} label="Tool state" value={status} onValueChange={(next) => setStatus(next as ToolCallStatus)} options={[{ value: "pending", label: "Pending" }, { value: "running", label: "Running" }, { value: "success", label: "Complete" }, { value: "error", label: "Failed" }]} />}</div>;
}

function AgentStatusDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [state, setState] = useState<AgentState>("working");
  const details: Record<AgentState, string> = { idle: "Choose a task to begin.", thinking: "Considering the available information.", working: "Reading the selected project files.", waiting: "A source needs your selection.", complete: "The requested work is ready to review.", error: "The source is unavailable. Choose another source or try again." };
  return <div className="demo-stack"><AgentStatus appearance={appearance} status={state} detail={details[state]} />{!thumbnail && <Select appearance={appearance} label="Agent state" value={state} onValueChange={(next) => setState(next as AgentState)} options={["idle", "thinking", "working", "waiting", "complete", "error"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} />}</div>;
}

function ThinkingDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [active, setActive] = useState(true);
  return <div className="demo-stack"><ThinkingIndicator appearance={appearance} active={active && !thumbnail} label={active ? "Preparing the response" : "Thinking paused"} />{!thumbnail && <Switch appearance={appearance} label="Animate indicator" checked={active} onCheckedChange={setActive} />}</div>;
}

function ModelPickerDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [model, setModel] = useState("swift");
  return <div className="demo-stack"><ModelPicker appearance={appearance} options={demoModels} value={model} onValueChange={setModel} description={thumbnail ? undefined : "Illustrative model names and capabilities for this preview."} />{!thumbnail && <p className="demo-feedback" role="status">{demoModels.find((option) => option.value === model)?.label} selected.</p>}</div>;
}

const markdownSample = "### A useful starting point\n\nKeep **important actions** easy to find.\n\n- [x] Clear labels\n- [ ] Review keyboard access\n\n```tsx\n<AgentStatus status=\"working\" />\n```";
function MarkdownDemo({ appearance, thumbnail }: { appearance: Appearance; thumbnail: boolean }) {
  const [content, setContent] = useState(markdownSample);
  if (thumbnail) return <Markdown appearance={appearance} content="### Readable answers\n\nUse **clear labels**, useful links and `code` when it helps.\n\n- Keyboard access\n- Responsive content" />;
  return <Tabs appearance={appearance} label="Markdown examples" defaultValue="preview" className="launch-markdown-demo" items={[
    { value: "preview", label: "Preview", content: <div role="region" aria-label="Rendered markdown"><Markdown appearance={appearance} content={content} /></div> },
    { value: "source", label: "Source", content: <Textarea appearance={appearance} label="Markdown source" value={content} rows={7} maxLength={5000} onChange={(event) => setContent(event.target.value)} description="Edit this text, then open Preview to see the result." /> },
    { value: "table", label: "Table", content: <Markdown appearance={appearance} content={"### Structured information\n\n| Element | Purpose |\n| --- | --- |\n| Message | Present an answer |\n| Composer | Ask a question |\n\n[Read the component guide](/docs)"} /> },
  ]} />;
}
