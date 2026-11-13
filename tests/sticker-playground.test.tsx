import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickerPlayground } from "../components/library/sticker-playground";

vi.mock("../components/ui/sticker-pack", async importOriginal => {
  const original = await importOriginal<typeof import("../components/ui/sticker-pack")>();
  return { ...original, Sticker: ({ label, onClick, decorative }: { label?: string; onClick?: () => void; decorative?: boolean }) => decorative ? <span /> : <button className="orange-sticker" type="button" aria-label={label} onClick={onClick}>Sticker</button> };
});

const descriptors = [
  [HTMLDialogElement.prototype, "showModal"], [HTMLDialogElement.prototype, "close"],
  [HTMLElement.prototype, "requestFullscreen"], [document, "exitFullscreen"], [document, "fullscreenElement"],
  [HTMLElement.prototype, "setPointerCapture"], [HTMLElement.prototype, "hasPointerCapture"], [HTMLElement.prototype, "releasePointerCapture"],
  [URL, "createObjectURL"], [URL, "revokeObjectURL"],
] as const;
const originals = descriptors.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));
function setFullscreen(element: Element | null) {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
  document.dispatchEvent(new Event("fullscreenchange"));
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number;
    constructor(type: string, options: PointerEventInit = {}) { super(type, options); this.pointerId = options.pointerId ?? 0; }
  });
  const captures = new WeakMap<HTMLElement, Set<number>>();
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn(function(this: HTMLElement, id: number) { const ids = captures.get(this) ?? new Set(); ids.add(id); captures.set(this, ids); }) });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { configurable: true, value: vi.fn(function(this: HTMLElement, id: number) { return captures.get(this)?.has(id) ?? false; }) });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { configurable: true, value: vi.fn(function(this: HTMLElement, id: number) { captures.get(this)?.delete(id); }) });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:sticker-canvas") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
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
  vi.restoreAllMocks();
});

function openWorkspace() {
  render(<StickerPlayground name="essential-heart" finish="sharp" expanded onClose={vi.fn()} />);
  return screen.getByRole("dialog", { name: "Sticker playground" }).querySelector<HTMLElement>(".sticker-playground")!;
}
function arrangement(workspace: HTMLElement) {
  return [...workspace.querySelectorAll("[data-placement]")].map(element => element.getAttribute("style"));
}
function startDrag(workspace: HTMLElement) {
  const board = workspace.querySelector<HTMLElement>(".sticker-playground-board")!, placement = workspace.querySelector<HTMLElement>('[data-placement="start-1"]')!;
  vi.spyOn(board, "getBoundingClientRect").mockReturnValue({ width: 1000, height: 500, x: 0, y: 0, top: 0, left: 0, bottom: 500, right: 1000, toJSON: () => ({}) });
  fireEvent.pointerDown(placement, { pointerId: 1, button: 0, clientX: 170, clientY: 120 });
  fireEvent.pointerMove(placement, { pointerId: 1, clientX: 270, clientY: 170 });
  return placement;
}

describe("clean sticker canvas preview", () => {
  it("fills the window preview and permits keyboard placement while protecting stickers from deletion", async () => {
    vi.mocked(HTMLElement.prototype.requestFullscreen).mockRejectedValue(new Error("Fullscreen denied"));
    const workspace = openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Add Essential heart" }));
    const before = arrangement(workspace), launcher = screen.getByRole("button", { name: "Preview fullscreen" });
    fireEvent.click(launcher);
    await waitFor(() => expect(workspace).toHaveAttribute("data-preview", "true"));
    expect(screen.queryByRole("group", { name: "Playground tools" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "Canvas code format" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove Essential heart from canvas" })).toBeNull();
    const sticker = screen.getByRole("button", { name: "Move Essential heart. Drag or use arrow keys." });
    expect(workspace.querySelector(".sticker-playground-board")).toHaveStyle({ width: "100%", height: "100%", aspectRatio: "auto" });
    fireEvent.keyDown(sticker, { key: "ArrowRight" });
    const moved = arrangement(workspace); expect(moved).not.toEqual(before);
    fireEvent.keyDown(sticker, { key: "Delete" }); fireEvent.keyDown(sticker, { key: "Backspace" }); fireEvent.click(sticker);
    expect(arrangement(workspace)).toEqual(moved);
    fireEvent.click(screen.getByRole("button", { name: "Back to editor" }));
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(workspace).toHaveAttribute("data-preview", "false");
    expect(screen.getByRole("button", { name: "Remove Essential heart from canvas" })).toBeVisible();
    expect(arrangement(workspace)).toEqual(moved);
    fireEvent.click(screen.getByRole("button", { name: "Undo last canvas change" }));
    expect(arrangement(workspace)).toEqual(before);
  });

  it("drags an existing sticker in preview, records one undo step and cancels interrupted drags", async () => {
    const workspace = openWorkspace(), before = arrangement(workspace);
    fireEvent.click(screen.getByRole("button", { name: "Preview fullscreen" }));
    await waitFor(() => expect(workspace).toHaveAttribute("data-preview", "true"));
    const placement = startDrag(workspace);
    expect(placement.hasPointerCapture(1)).toBe(true);
    expect(placement).toHaveStyle({ left: "27%", top: "34%" });
    fireEvent.pointerUp(placement, { pointerId: 1, clientX: 270, clientY: 170 });
    expect(placement.hasPointerCapture(1)).toBe(false);
    const moved = arrangement(workspace);
    fireEvent.click(screen.getByRole("button", { name: "Back to editor" }));
    expect(arrangement(workspace)).toEqual(moved);
    fireEvent.click(screen.getByRole("button", { name: "Undo last canvas change" }));
    expect(arrangement(workspace)).toEqual(before);
    expect(screen.getByRole("button", { name: "Undo last canvas change" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Preview fullscreen" }));
    const interrupted = startDrag(workspace);
    fireEvent.click(screen.getByRole("button", { name: "Back to editor" }));
    expect(interrupted.hasPointerCapture(1)).toBe(false);
    expect(arrangement(workspace)).toEqual(before);
    expect(screen.getByRole("button", { name: "Undo last canvas change" })).toBeDisabled();
  });

  it("returns to editing when the browser exits native fullscreen", async () => {
    const workspace = openWorkspace(), launcher = screen.getByRole("button", { name: "Preview fullscreen" });
    fireEvent.click(launcher);
    await waitFor(() => expect(document.fullscreenElement).toBe(workspace));
    expect(workspace).toHaveAttribute("data-preview", "true");
    const before = arrangement(workspace), placement = startDrag(workspace);
    await document.exitFullscreen();
    await waitFor(() => expect(workspace).toHaveAttribute("data-preview", "false"));
    await waitFor(() => expect(launcher).toHaveFocus());
    expect(screen.getByRole("group", { name: "Playground tools" })).toBeVisible();
    expect(arrangement(workspace)).toEqual(before);
    expect(placement.hasPointerCapture(1)).toBe(false);
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

describe("canvas export format controls", () => {
  it("uses one tab stop, supports wrapped arrow navigation and downloads the selected format", () => {
    openWorkspace();
    const group = within(screen.getByRole("radiogroup", { name: "Canvas code format" })), react = group.getByRole("radio", { name: "React" }), html = group.getByRole("radio", { name: "HTML" }), json = group.getByRole("radio", { name: "JSON" });
    expect(react).toHaveAttribute("aria-checked", "true"); expect(react.tabIndex).toBe(0); expect(html.tabIndex).toBe(-1); expect(json.tabIndex).toBe(-1);
    fireEvent.keyDown(react, { key: "ArrowLeft" }); expect(json).toHaveFocus(); expect(json).toHaveAttribute("aria-checked", "true");
    fireEvent.keyDown(json, { key: "Home" }); expect(react).toHaveFocus();
    fireEvent.keyDown(react, { key: "End" }); expect(json).toHaveFocus();
    fireEvent.keyDown(json, { key: "ArrowRight" }); expect(react).toHaveFocus();
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) { downloads.push(this.download); });
    for (const [control, format, extension, mime] of [[react, "React", "tsx", "text/plain;charset=utf-8"], [html, "HTML", "html", "text/html;charset=utf-8"], [json, "JSON", "json", "application/json"]] as const) {
      fireEvent.click(control); expect(control).toHaveAttribute("aria-checked", "true"); expect(control.tabIndex).toBe(0);
      fireEvent.click(screen.getByRole("button", { name: `Download ${format} canvas` }));
      expect(downloads.at(-1)).toBe(`my-sticker-canvas.${extension}`);
      expect(vi.mocked(URL.createObjectURL).mock.calls.at(-1)?.[0]).toHaveProperty("type", mime);
    }
  });
});
