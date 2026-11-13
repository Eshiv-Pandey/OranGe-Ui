import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdaptiveInput } from "../components/ui/adaptive-input";
import { ChecklistCard } from "../components/ui/checklist-card";
import { FocusTimerCard } from "../components/ui/focus-timer-card";
import { PollCard } from "../components/ui/poll-card";
import { CalculatorCard } from "../components/ui/calculator-card";
import { ColorCard } from "../components/ui/color-card";
import { BillSplitCard } from "../components/ui/bill-split-card";
import { UnitConverterCard } from "../components/ui/unit-converter-card";
import { NoteCard } from "../components/ui/note-card";
import type { AdaptiveClassifier, AdaptiveIntent } from "../components/ui/adaptive/types";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return { useReducedMotion: () => true, AnimatePresence: ({ children }: { children: React.ReactNode }) => children, motion: { div: ({ children, ...props }: { children: React.ReactNode }) => React.createElement("div", { "data-motion-test": Object.keys(props).length }, children) } };
});
afterEach(() => vi.useRealTimers());
describe("editable standalone cards", () => {
  it("keeps controlled ownership and supports disabled and readonly fields", () => {
    const onChange = vi.fn(), value = { title: "Title", text: "Original" };
    const view = render(<NoteCard value={value} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Note text"), { target: { value: "Edited" } });
    expect(onChange).toHaveBeenCalledWith({ ...value, text: "Edited" }); expect(screen.getByLabelText("Note text")).toHaveValue("Original");
    view.rerender(<NoteCard value={value} editable={false} />); expect(screen.getByLabelText("Note text")).toHaveAttribute("readonly");
    view.rerender(<NoteCard value={value} disabled />); expect(screen.getByLabelText("Note text")).toBeDisabled();
  });
  it("adds, edits, checks and removes checklist items", () => {
    render(<ChecklistCard defaultValue={{ title: "List", items: [] }} />);
    fireEvent.change(screen.getByLabelText("New item"), { target: { value: "Milk" } }); fireEvent.keyDown(screen.getByLabelText("New item"), { key: "Enter" });
    fireEvent.click(screen.getByLabelText("Complete Milk")); expect(screen.getByText("1 of 1 completed")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Item 1"), { target: { value: "Bread" } });
    expect(screen.getByLabelText("Complete Bread")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Remove item 1")); expect(screen.getByText("Add an item to start this list.")).toBeInTheDocument();
  });
  it("moves a vote without increasing the total and locks when requested", () => {
    const submit = vi.fn(), value = { question: "Which?", options: [{ id: "a", label: "A", votes: 2 }, { id: "b", label: "B", votes: 3 }] };
    const view = render(<PollCard defaultValue={value} onSubmit={submit} editable={false} />);
    fireEvent.click(screen.getByRole("button", { name: "A 2 votes" })); fireEvent.click(screen.getByRole("button", { name: "B 3 votes" }));
    expect(submit.mock.lastCall?.[0].options.map((option: { votes: number }) => option.votes)).toEqual([2, 4]);
    view.rerender(<PollCard defaultValue={value} allowChangeVote={false} editable={false} />);
    expect(screen.getByRole("button", { name: "A 2 votes" })).toBeDisabled();
  });
  it("blocks invalid computed handoffs", () => {
    const submit = vi.fn();
    const view = render(<CalculatorCard defaultValue={{ expression: "1/0" }} onSubmit={submit} />);
    expect(screen.getByRole("button", { name: "Use result" })).toBeDisabled();
    view.rerender(<ColorCard value={{ color: "invalid", name: "" }} onSubmit={submit} />); expect(screen.getByRole("button", { name: "Use result" })).toBeDisabled();
    view.rerender(<BillSplitCard value={{ amount: 20, people: 0, currency: "USD" }} onSubmit={submit} />); expect(screen.getByRole("button", { name: "Use result" })).toBeDisabled();
    view.rerender(<UnitConverterCard value={{ amount: 1, from: "kg", to: "km" }} onSubmit={submit} />); expect(screen.getByRole("button", { name: "Use result" })).toBeDisabled();
  });
  it("copies valid computed values and reports clipboard failure", async () => {
    const copy = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } });
    render(<CalculatorCard defaultValue={{ expression: "18% of 3450" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy value" })); await screen.findByText("Copied."); expect(copy).toHaveBeenCalledWith("621");
    copy.mockRejectedValueOnce(new Error("Unavailable")); fireEvent.click(screen.getByRole("button", { name: "Copy value" })); await screen.findByText("Copy unavailable. Select the value and copy it.");
  });
  it("lets a numeric field be cleared before replacing the amount", () => {
    render(<BillSplitCard />); const amount = screen.getByLabelText("Bill amount");
    fireEvent.change(amount, { target: { value: "" } }); expect(amount).toHaveValue(null);
    fireEvent.change(amount, { target: { value: "90" } }); expect(amount).toHaveValue(90);
  });
  it("does not keep using a previous amount after a numeric field is cleared", () => {
    render(<BillSplitCard onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Bill amount"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Bill amount"));
    expect(screen.getByLabelText("Bill amount")).toHaveValue(null);
    expect(screen.getByRole("button", { name: "Use result" })).toBeDisabled();
    expect(screen.queryByText("Each person pays")).not.toBeInTheDocument();
  });
});
describe("timer lifecycle", () => {
  it("does not autoplay, uses a deadline, pauses, completes once and cleans up", () => {
    vi.useFakeTimers(); vi.setSystemTime(100000); const complete = vi.fn();
    const view = render(<FocusTimerCard defaultValue={{ title: "Short", seconds: 3 }} onComplete={complete} />);
    act(() => vi.advanceTimersByTime(2000)); expect(screen.getByLabelText("Time remaining")).toHaveTextContent("00:03");
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ })); act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole("button", { name: /^Pause$/ })); act(() => vi.advanceTimersByTime(5000)); expect(screen.getByLabelText("Time remaining")).toHaveTextContent("00:02");
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ })); act(() => vi.advanceTimersByTime(3000)); expect(complete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reset" })); expect(screen.getByLabelText("Time remaining")).toHaveTextContent("00:03");
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ })); view.unmount(); act(() => vi.advanceTimersByTime(10000)); expect(complete).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
});
describe("adaptive input ownership and async interpretation", () => {
  it("keeps event people and places out of incompatible manual card fields", () => {
    const raw = "breakfast with Subham, Eshiv, Ravi at delhi hatt, India at 6pm";
    render(<AdaptiveInput defaultValue={raw} />);
    expect(screen.getByLabelText("Event title")).toHaveValue("Breakfast");
    expect(screen.getByLabelText("Attendees")).toHaveValue("Subham, Eshiv, Ravi");
    expect(screen.getByLabelText("Location")).toHaveValue("delhi hatt, India");
    const checks = [
      ["checklist", "List title"], ["reminder", "Task"], ["timer", "Session title"],
      ["color", "Color value"], ["split", "Bill amount"], ["convert", "Amount"],
      ["calculate", "Expression"], ["poll", "Question"], ["bookmark", "URL"],
    ];
    for (const [kind, field] of checks) {
      fireEvent.change(screen.getByLabelText("Card type"), { target: { value: kind } });
      expect(screen.getByLabelText("Describe what you need")).toHaveValue(raw);
      expect(screen.getByLabelText(field)).toHaveValue(["split", "convert"].includes(kind) ? null : "");
      expect(screen.getByRole("button", { name: "Use card" })).toBeDisabled();
      if (kind === "checklist") expect(screen.getByText("Add an item to start this list.")).toBeInTheDocument();
      if (kind === "timer") expect(screen.getByLabelText("Duration in minutes")).toHaveValue(null);
    }
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "note" } });
    expect(screen.getByLabelText("Note text")).toHaveValue(raw);
  });
  it("detects a new request after manual selection and keeps only same-request edits", () => {
    const raw = "breakfast with Subham tomorrow at 6pm";
    render(<AdaptiveInput defaultValue={raw} />);
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    fireEvent.change(screen.getByLabelText("List title"), { target: { value: "Prep" } });
    fireEvent.change(screen.getByLabelText("New item"), { target: { value: "Book a table" } });
    fireEvent.keyDown(screen.getByLabelText("New item"), { key: "Enter" });
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "event" } });
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    expect(screen.getByLabelText("List title")).toHaveValue("Prep");
    expect(screen.getByLabelText("Item 1")).toHaveValue("Book a table");
    fireEvent.change(screen.getByLabelText("Describe what you need"), { target: { value: "5 miles in km" } });
    expect(screen.getByLabelText("Card type")).toHaveValue("auto");
    expect(screen.getByLabelText("Amount")).toHaveValue(5);
    expect(screen.getByLabelText("From unit")).toHaveValue("mi");
    fireEvent.change(screen.getByLabelText("Describe what you need"), { target: { value: raw } });
    expect(screen.getByLabelText("Event title")).toHaveValue("Breakfast");
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    expect(screen.getByLabelText("List title")).toHaveValue("");
  });
  it("invalidates manual mode and drafts when a controlled request changes", () => {
    const raw = "breakfast tomorrow 6pm";
    const view = render(<AdaptiveInput value={raw} />);
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    fireEvent.change(screen.getByLabelText("List title"), { target: { value: "Old draft" } });
    view.rerender(<AdaptiveInput value="5 miles in km" />);
    expect(screen.getByLabelText("Card type")).toHaveValue("auto");
    expect(screen.getByLabelText("Amount")).toHaveValue(5);
    view.rerender(<AdaptiveInput value={raw} />);
    expect(screen.getByLabelText("Card type")).toHaveValue("auto");
    expect(screen.getByLabelText("Event title")).toHaveValue("Breakfast");
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    expect(screen.getByLabelText("List title")).toHaveValue("");
  });
  it("interprets compatible plain lists and numbers when selected manually", () => {
    const view = render(<AdaptiveInput defaultValue="Milk, eggs, bread" />);
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "checklist" } });
    expect(screen.getByLabelText("Item 1")).toHaveValue("Milk");
    expect(screen.getByLabelText("Item 3")).toHaveValue("bread");
    view.rerender(<AdaptiveInput value="42" />);
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "calculate" } });
    expect(screen.getByLabelText("Expression")).toHaveValue("42");
    expect(screen.getByRole("button", { name: "Use card" })).toBeEnabled();
  });
  it("preserves raw text and per-type edits, uses Enter and restores saved data", () => {
    const save = vi.fn(), original = "Ideas for next week";
    const restored: AdaptiveIntent = { kind: "note", confidence: 1, data: { title: "Saved title", text: "Saved edited text" } };
    render(<AdaptiveInput defaultValue={original} initialIntent={restored} onSave={save} />);
    expect(screen.getByLabelText("Note text")).toHaveValue("Saved edited text");
    fireEvent.change(screen.getByLabelText("Note text"), { target: { value: "Edited again" } });
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "reminder" } });
    expect(screen.getByLabelText("Describe what you need")).toHaveValue(original);
    fireEvent.change(screen.getByLabelText("Card type"), { target: { value: "note" } }); expect(screen.getByLabelText("Note text")).toHaveValue("Edited again");
    fireEvent.keyDown(screen.getByLabelText("Describe what you need"), { key: "Enter", shiftKey: true }); expect(save).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText("Describe what you need"), { key: "Enter" }); expect(save.mock.lastCall?.[0].data.text).toBe("Edited again");
    fireEvent.keyDown(screen.getByLabelText("Describe what you need"), { key: "Escape" }); expect(screen.getByLabelText("Describe what you need")).toHaveValue("");
  });
  it("cancels stale requests and rejects malformed results with offline fallback", async () => {
    const pending: { signal: AbortSignal; resolve: (value: AdaptiveIntent) => void }[] = [];
    const classifier: AdaptiveClassifier = (_text, { signal }) => new Promise(resolve => pending.push({ signal, resolve }));
    render(<AdaptiveInput defaultValue="orange" classifier={classifier} debounceMs={0} />);
    await waitFor(() => expect(pending).toHaveLength(1));
    fireEvent.change(screen.getByLabelText("Describe what you need"), { target: { value: "25 min focus" } });
    await waitFor(() => expect(pending).toHaveLength(2)); expect(pending[0].signal.aborted).toBe(true);
    await act(async () => pending[0].resolve({ kind: "note", confidence: 1, data: { title: "Stale", text: "Stale" } }));
    expect(screen.getByLabelText("Session title")).toBeInTheDocument();
    await act(async () => pending[1].resolve({ kind: "unknown" } as unknown as AdaptiveIntent));
    await screen.findByText("Classifier unavailable. Using offline interpretation."); expect(screen.getByLabelText("Session title")).toBeInTheDocument();
  });
  it("accepts confident custom interpretation and ignores low confidence", async () => {
    const classifier = vi.fn<AdaptiveClassifier>().mockResolvedValue({ kind: "note", confidence: .9, data: { title: "Custom", text: "Custom result" } });
    const view = render(<AdaptiveInput defaultValue="orange" classifier={classifier} debounceMs={0} />);
    await waitFor(() => expect(screen.getByLabelText("Note text")).toHaveValue("Custom result"));
    classifier.mockResolvedValueOnce({ kind: "note", confidence: .2, data: { title: "Uncertain", text: "Low confidence" } });
    view.rerender(<AdaptiveInput value="blue" classifier={classifier} debounceMs={0} />);
    await waitFor(() => expect(classifier).toHaveBeenCalledTimes(2)); expect(screen.getByLabelText("Color value")).toHaveValue("#3b82f6");
  });
});
