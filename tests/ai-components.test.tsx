import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { ChatMessage } from "../components/ui/chat-message";
import { PromptInput } from "../components/ui/prompt-input";
import { ModelPicker, type ModelOption } from "../components/ui/model-picker";
import { AgentStatus } from "../components/ui/agent-status";
import { ThinkingIndicator } from "../components/ui/thinking-indicator";
import { ToolCallCard, formatToolValue } from "../components/ui/tool-call-card";
import { aiTestBrowser } from "./ai-browser";

let browser: ReturnType<typeof aiTestBrowser>;
beforeEach(() => { browser = aiTestBrowser(); });
afterEach(() => { cleanup(); browser.restore(); });

describe("PromptInput", () => {
  it("keeps draft ownership with the caller and submits the exact original text", async () => {
    const user = userEvent.setup(), submit = vi.fn();
    function Example() { const [value, setValue] = useState(""); return <PromptInput value={value} onValueChange={setValue} onSubmit={submit} />; }
    render(<Example />);
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Message" }), "  Explain this code  ");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(submit).toHaveBeenCalledWith("  Explain this code  ");
    expect(screen.getByRole("textbox")).toHaveValue("  Explain this code  ");
  });

  it("uses Enter to submit, Shift+Enter for text, and respects newline mode", () => {
    const submit = vi.fn(), change = vi.fn();
    const view = render(<PromptInput value="Draft" onValueChange={change} onSubmit={submit} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).toHaveBeenCalledTimes(1);
    view.rerender(<PromptInput value="Draft" onValueChange={change} onSubmit={submit} enterBehavior="newline" />);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("does not submit during composition or after a caller prevents the key event", () => {
    const submit = vi.fn(), change = vi.fn();
    const view = render(<PromptInput value="Text" onValueChange={change} onSubmit={submit} />);
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(submit).not.toHaveBeenCalled();
    view.rerender(<PromptInput value="Text" onValueChange={change} onSubmit={submit} textareaProps={{ onKeyDown: (event) => event.preventDefault() }} />);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
  });

  it("blocks blank, disabled and readonly drafts and replaces send with controlled stop", async () => {
    const user = userEvent.setup(), submit = vi.fn(), stop = vi.fn(), change = vi.fn();
    const view = render(<PromptInput value={" \n "} onValueChange={change} onSubmit={submit} />);
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).not.toHaveBeenCalled();
    view.rerender(<PromptInput value="Draft" disabled onValueChange={change} onSubmit={submit} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    fireEvent.submit(screen.getByRole("form"));
    view.rerender(<PromptInput value="Draft" onValueChange={change} onSubmit={submit} textareaProps={{ readOnly: true }} />);
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).not.toHaveBeenCalled();
    view.rerender(<PromptInput value="Draft" submitting onStop={stop} onValueChange={change} onSubmit={submit} />);
    await user.click(screen.getByRole("button", { name: "Stop response" }));
    expect(stop).toHaveBeenCalledOnce();
    fireEvent.submit(screen.getByRole("form"));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("Draft");
  });

  it("exposes attachment selection and removal without uploading or clearing caller state", async () => {
    const user = userEvent.setup(), files = vi.fn(), remove = vi.fn(), submit = vi.fn();
    const attachment = { id: "a", name: "notes.txt", detail: "1 KB" };
    const view = render(<PromptInput value="" onValueChange={vi.fn()} onSubmit={submit} attachments={[attachment]} onRemoveAttachment={remove} onFilesSelected={files} accept="text/plain" />);
    await user.click(screen.getByRole("button", { name: "Remove notes.txt" }));
    expect(remove).toHaveBeenCalledWith("a");
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    const file = new File(["Notes"], "notes.txt", { type: "text/plain" });
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    expect(files).toHaveBeenCalledWith([file]);
    expect(input.value).toBe("");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(submit).toHaveBeenCalledWith("");
  });

  it("merges descriptions and retains native textarea constraints", () => {
    render(<><span id="external">External hint</span><PromptInput value="Draft" onValueChange={vi.fn()} onSubmit={vi.fn()} description="Shift+Enter adds a line." error="Try sending again." textareaProps={{ "aria-describedby": "external", maxLength: 500, name: "prompt" }} /></>);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAccessibleDescription("External hint Shift+Enter adds a line. Try sending again.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("maxlength", "500");
    expect(screen.getByRole("alert")).toHaveTextContent("Try sending again.");
  });
});

const models: ModelOption[] = [
  { value: "swift", label: "Swift", provider: "Example provider", description: "Fast everyday replies", tags: ["Fast", "Writing"] },
  { value: "studio", label: "Studio", provider: "Example provider", tags: ["Code"], disabled: true },
  { value: "reason", label: "Reason", provider: "Local", tags: ["Research"] },
];

describe("ModelPicker", () => {
  it("keeps selection controlled and offers provider, tags and disabled options", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const view = render(<ModelPicker options={models} value="swift" onValueChange={change} />);
    await user.click(screen.getByRole("combobox", { name: "Model" }));
    expect(screen.getByRole("option", { name: /Studio/ })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("option", { name: /Reason/ }));
    expect(change).toHaveBeenCalledWith("reason");
    expect(screen.getByRole("combobox")).toHaveTextContent("Swift");
    view.rerender(<ModelPicker options={models} value="reason" onValueChange={change} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Reason");
  });

  it("supports keyboard selection and restores focus", async () => {
    const user = userEvent.setup();
    render(<ModelPicker options={models} defaultValue="swift" />);
    const trigger = screen.getByRole("combobox", { name: "Model" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("option", { name: /Swift/ })).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveTextContent("Reason");
  });

  it("supports required named forms and names the empty and error states", () => {
    const view = render(<form><ModelPicker options={models} defaultValue="reason" name="model" required error="Choose an available model." /></form>);
    const data = new FormData(view.container.querySelector("form")!);
    expect(data.get("model")).toBe("reason");
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription("Choose an available model.");
    view.rerender(<ModelPicker options={[]} />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("combobox")).toHaveTextContent("No models available");
  });
});

describe("ToolCallCard", () => {
  it("provides controlled disclosure and named escaped input and output", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const props = { name: "Search files", summary: "Found three matches", status: "success" as const, input: { query: "<script>example</script>" }, output: "Found 3 files", durationMs: 1240, onOpenChange: change };
    const view = render(<ToolCallCard {...props} open={false} />);
    const trigger = screen.getByRole("button", { name: "Search files Found three matches Complete 1.2 s" });
    expect(trigger).toHaveAccessibleName("Search files Found three matches Complete 1.2 s");
    await user.click(trigger);
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("region", { name: "Search files input" })).toBeNull();
    view.rerender(<ToolCallCard {...props} open />);
    expect(screen.getByRole("region", { name: "Search files input" })).toHaveTextContent("<script>example</script>");
    expect(screen.getByRole("region", { name: "Search files output" })).toHaveTextContent("Found 3 files");
    expect(view.container.querySelector("script")).toBeNull();
    expect(screen.getByText("1.2 s")).toBeInTheDocument();
  });

  it("renders error recovery actions and a useful empty pending state", async () => {
    const user = userEvent.setup(), retry = vi.fn();
    const view = render(<ToolCallCard name="Read document" status="error" error="The document is unavailable." defaultOpen actions={<button onClick={retry}>Retry</button>} />);
    expect(screen.getByRole("alert")).toHaveTextContent("The document is unavailable.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
    view.rerender(<ToolCallCard name="Read document" status="pending" defaultOpen />);
    expect(screen.getByText("Waiting to start.")).toBeInTheDocument();
  });

  it("formats circular values and bigints while preserving repeated shared values", () => {
    const circular: { self?: unknown } = {}; circular.self = circular;
    expect(formatToolValue(circular)).toContain("[Circular]");
    expect(formatToolValue({ value: 9n })).toContain('"9"');
    const shared = { count: 2 };
    expect(JSON.parse(formatToolValue({ a: shared, b: shared }))).toEqual({ a: { count: 2 }, b: { count: 2 } });
  });
});

describe("message and activity", () => {
  it("names the message, keeps streaming content out of live announcements and announces state", () => {
    const view = render(<ChatMessage role="assistant" author="Research helper" status="streaming" timestamp="10:42" dateTime="2026-01-01T10:42:00Z" avatar={<button>Decorative avatar</button>} actions={<button>Copy response</button>}><p>Partial response</p></ChatMessage>);
    const article = screen.getByRole("article", { name: "Research helper" });
    expect(within(article).getByRole("status")).toHaveTextContent("Responding");
    expect(view.container.querySelector(".ui-chat-content")).toHaveAttribute("aria-busy", "true");
    expect(view.container.querySelector(".ui-chat-content")).not.toHaveAttribute("aria-live");
    expect(view.container.querySelector(".ui-chat-avatar")).toHaveAttribute("inert");
    expect(screen.getByRole("group", { name: "Research helper message actions" })).toBeInTheDocument();
  });

  it("exposes labeled states without invented progress", () => {
    const view = render(<AgentStatus status="working" detail="Reading the selected files" />);
    expect(screen.getByRole("status")).toHaveTextContent("WorkingReading the selected files");
    view.rerender(<AgentStatus status="error" label="Search interrupted" detail="Try again when the source is available." announce={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Search interrupted")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("pauses CSS thinking motion offscreen and in reduced motion without requesting frames", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame");
    const view = render(<ThinkingIndicator />), indicator = screen.getByRole("status");
    expect(indicator).toHaveAttribute("data-motion", "paused");
    act(() => browser.visible(indicator, true));
    expect(indicator).toHaveAttribute("data-motion", "running");
    act(() => browser.visible(indicator, false));
    expect(indicator).toHaveAttribute("data-motion", "paused");
    act(() => browser.reduced(true));
    expect(indicator).toHaveAttribute("data-motion", "reduced");
    expect(raf).not.toHaveBeenCalled();
    view.unmount();
    expect(browser.observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it("keeps explicitly inactive thinking motion static", () => {
    render(<ThinkingIndicator active={false} label="Waiting for a response" announce={false} />);
    const indicator = screen.getByText("Waiting for a response").parentElement!;
    act(() => browser.visible(indicator, true));
    expect(indicator).toHaveAttribute("data-motion", "paused");
    expect(screen.queryByRole("status")).toBeNull();
  });
});

it("renders all appearances and stable semantic shells on the server", () => {
  for (const appearance of APPEARANCE_VALUES) {
    const html = renderToStaticMarkup(<><ChatMessage role="user" appearance={appearance}>Hello</ChatMessage><AgentStatus status="idle" appearance={appearance} /><ThinkingIndicator appearance={appearance} /><PromptInput value="" onValueChange={() => {}} onSubmit={() => {}} appearance={appearance} /><ToolCallCard name="Read" status="pending" appearance={appearance} /><ModelPicker options={models} appearance={appearance} /></>);
    expect(html.match(new RegExp(`data-appearance="${appearance}"`, "g"))!.length).toBeGreaterThanOrEqual(6);
    expect(html).toContain("Hello");
    expect(html).toContain("Choose a model");
  }
});
