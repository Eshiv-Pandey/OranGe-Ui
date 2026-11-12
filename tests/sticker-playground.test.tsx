import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickerPlayground } from "../components/library/sticker-playground";

vi.mock("../components/ui/sticker-pack", async importOriginal => {
  const original = await importOriginal<typeof import("../components/ui/sticker-pack")>();
  return { ...original, Sticker: ({ label, onClick, decorative }: { label?: string; onClick?: () => void; decorative?: boolean }) => decorative ? <span /> : <button className="orange-sticker" type="button" aria-label={label} onClick={onClick}>Sticker</button> };
});

const descriptors = [
  [HTMLDialogElement.prototype, "showModal"], [HTMLDialogElement.prototype, "close"],
  [HTMLElement.prototype, "requestFullscreen"], [document, "exitFullscreen"], [document, "fullscreenElement"],
] as const;
const originals = descriptors.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));
function setFullscreen(element: Element | null) {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
  document.dispatchEvent(new Event("fullscreenchange"));
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); }) });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  Object.defineProperty(document, "exitFullscreen", { configurable: true, value: vi.fn(async () => { setFullscreen(null); }) });
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: vi.fn(async function(this: HTMLElement) { setFullscreen(this); }) });
});

afterEach(() => {
  descriptors.forEach(([target, key], index) => {
    const descriptor = originals[index];
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  });
  vi.unstubAllGlobals();
});

function openWorkspace() {
  render(<StickerPlayground name="essential-heart" finish="sharp" expanded onClose={vi.fn()} />);
  return screen.getByRole("dialog", { name: "Sticker playground" }).querySelector<HTMLElement>(".sticker-playground")!;
}
function arrangement(workspace: HTMLElement) {
  return [...workspace.querySelectorAll("[data-placement]")].map(element => element.getAttribute("style"));
}

describe("clean sticker canvas preview", () => {
  it("falls back to a clean window preview and prevents edits while retaining the arrangement and selection", async () => {
    vi.mocked(HTMLElement.prototype.requestFullscreen).mockRejectedValue(new Error("Fullscreen denied"));
    const workspace = openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Add Essential heart" }));
    const before = arrangement(workspace), launcher = screen.getByRole("button", { name: "Preview fullscreen" });
    fireEvent.click(launcher);
    await waitFor(() => expect(workspace).toHaveAttribute("data-preview", "true"));
    expect(screen.queryByRole("group", { name: "Playground tools" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "Canvas code format" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove Essential heart from canvas" })).toBeNull();
    const sticker = screen.getByRole("button", { name: "Animate Essential heart" });
    fireEvent.keyDown(sticker, { key: "ArrowRight" }); fireEvent.keyDown(sticker, { key: "Delete" }); fireEvent.click(sticker);
    expect(arrangement(workspace)).toEqual(before);
    fireEvent.click(screen.getByRole("button", { name: "Back to editor" }));
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(workspace).toHaveAttribute("data-preview", "false");
    expect(screen.getByRole("button", { name: "Remove Essential heart from canvas" })).toBeVisible();
    expect(arrangement(workspace)).toEqual(before);
  });

  it("returns to editing when the browser exits native fullscreen", async () => {
    const workspace = openWorkspace(), launcher = screen.getByRole("button", { name: "Preview fullscreen" });
    fireEvent.click(launcher);
    await waitFor(() => expect(document.fullscreenElement).toBe(workspace));
    expect(workspace).toHaveAttribute("data-preview", "true");
    await document.exitFullscreen();
    await waitFor(() => expect(workspace).toHaveAttribute("data-preview", "false"));
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(screen.getByRole("group", { name: "Playground tools" })).toBeVisible();
  });

  it("exits a late fullscreen request if the visitor already returned to the editor", async () => {
    let finishRequest: (() => void) | undefined;
    vi.mocked(HTMLElement.prototype.requestFullscreen).mockImplementation(function(this: HTMLElement) {
      return new Promise<void>(resolve => { finishRequest = () => { setFullscreen(this); resolve(); }; });
    });
    const workspace = openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Preview fullscreen" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to editor" }));
    finishRequest!();
    await waitFor(() => expect(document.exitFullscreen).toHaveBeenCalled());
    expect(document.fullscreenElement).toBeNull();
    expect(workspace).toHaveAttribute("data-preview", "false");
  });
});
