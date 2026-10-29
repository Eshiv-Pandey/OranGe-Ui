import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatMessageDemo } from "../components/library/ai-demos";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("ChatMessage streaming demo", () => {
  it("updates content, announces stable state and stops without losing the partial response", () => {
    vi.useFakeTimers();
    const view = render(<ChatMessageDemo appearance="polished" />);
    const article = screen.getByRole("article", { name: "Workspace helper" });
    expect(within(article).getByRole("status")).toHaveTextContent("Ready to preview");
    fireEvent.click(screen.getByRole("button", { name: "Start response" }));
    expect(within(article).getByRole("status")).toHaveTextContent("Responding");
    act(() => vi.advanceTimersByTime(400));
    const partial = article.querySelector(".ui-chat-content")!.textContent;
    expect(partial).toContain("Start with the smallest useful");
    expect(article.querySelector(".ui-chat-content")).toHaveAttribute("aria-busy", "true");
    expect(article.querySelector(".ui-chat-content")).not.toHaveAttribute("aria-live");
    fireEvent.click(screen.getByRole("button", { name: "Stop response" }));
    expect(within(article).getByRole("status")).toHaveTextContent("Response stopped");
    expect(article.querySelector(".ui-chat-content")).not.toHaveAttribute("aria-busy");
    act(() => vi.advanceTimersByTime(4000));
    expect(article.querySelector(".ui-chat-content")!.textContent).toBe(partial);
    expect(screen.getByRole("button", { name: "Stop response" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reset response" }));
    expect(within(article).getByRole("status")).toHaveTextContent("Ready to preview");
    expect(within(article).getByText("Start the preview to watch a response arrive.")).toBeInTheDocument();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("completes the local stream, can replay it, and starts no timer for thumbnails", () => {
    vi.useFakeTimers();
    const view = render(<ChatMessageDemo appearance="terminal" />);
    fireEvent.click(screen.getByRole("button", { name: "Start response" }));
    act(() => vi.advanceTimersByTime(12_000));
    const article = screen.getByRole("article", { name: "Workspace helper" });
    expect(within(article).getByRole("status")).toHaveTextContent("Response complete");
    expect(article).toHaveTextContent("viewport shrinks.");
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Start response" }));
    act(() => vi.advanceTimersByTime(80));
    expect(article.querySelector(".ui-chat-content")!.textContent?.trim()).toBe("Start");
    view.unmount();
    render(<ChatMessageDemo appearance="polished" thumbnail />);
    expect(screen.queryByRole("button", { name: "Start response" })).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
