import { StrictMode, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickerEditorDialog } from "../components/library/sticker-editor-dialog";
import { DEFAULT_STICKER_OPTIONS, stickerReactCode } from "../lib/sticker-options";

const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const showDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const urlDescriptor = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
const revokeDescriptor = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

function restore(target: object, key: string, descriptor: PropertyDescriptor | undefined) {
  if (descriptor) Object.defineProperty(target, key, descriptor);
  else Reflect.deleteProperty(target, key);
}

function Host() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({ ...DEFAULT_STICKER_OPTIONS });
  return <><button type="button" onClick={() => setOpen(true)}>Open editor</button>{open && <StickerEditorDialog name="essential-heart" options={options} onChange={setOptions} onClose={() => setOpen(false)} />}</>;
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); }) });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:sticker-test") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  restore(HTMLDialogElement.prototype, "close", closeDescriptor);
  restore(HTMLDialogElement.prototype, "showModal", showDescriptor);
  restore(navigator, "clipboard", clipboardDescriptor);
  restore(URL, "createObjectURL", urlDescriptor);
  restore(URL, "revokeObjectURL", revokeDescriptor);
  vi.unstubAllGlobals();
});

function openEditor() {
  const opener = screen.getByRole("button", { name: "Open editor" });
  opener.focus();
  fireEvent.click(opener);
  return opener;
}

describe("sticker editor", () => {
  it("opens under Strict Mode and closes through native cancel with focus and scroll restoration", () => {
    const originalOverflow = document.body.style.overflow;
    render(<StrictMode><Host /></StrictMode>);
    const opener = openEditor();
    const dialog = screen.getByRole("dialog", { name: "Edit Essential heart" });
    expect(dialog).toHaveAttribute("open");
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("keeps edited preview settings, copied code, disabled motion controls and reset in sync", async () => {
    render(<Host />);
    openEditor();
    fireEvent.change(screen.getByRole("slider", { name: "Sticker size" }), { target: { value: "312" } });
    fireEvent.change(screen.getByRole("slider", { name: "Rotation" }), { target: { value: "45" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Click animation" }), { target: { value: "wiggle" } });
    fireEvent.change(screen.getByRole("slider", { name: "Duration" }), { target: { value: "1200" } });
    fireEvent.change(screen.getByRole("slider", { name: "Intensity" }), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: /Playful Soft color/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Soft shadow" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy edited sticker React code" }));
    const edited = { ...DEFAULT_STICKER_OPTIONS, size: 312, rotate: 45, motion: "wiggle" as const, duration: 1200, intensity: 1.5, finish: "playful" as const, shadow: false };
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(stickerReactCode("essential-heart", edited)));
    expect(screen.getByLabelText("Edited sticker React code")).toHaveTextContent('finish="playful"');
    fireEvent.change(screen.getByRole("combobox", { name: "Click animation" }), { target: { value: "none" } });
    expect(screen.getByRole("slider", { name: "Duration" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Intensity" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replay motion" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reset settings" }));
    expect(screen.getByRole("slider", { name: "Sticker size" })).toHaveValue(String(DEFAULT_STICKER_OPTIONS.size));
    expect(screen.getByRole("combobox", { name: "Click animation" })).toHaveValue(DEFAULT_STICKER_OPTIONS.motion);
    expect(screen.getByRole("checkbox", { name: "Soft shadow" })).toBeChecked();
  });

  it("downloads a complete React component using the exact current settings", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<Host />);
    openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Download React component" }));
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const source = await new Promise<string>(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob); });
    expect(source).toContain('import { Sticker } from "orangeui-stickers"');
    expect(source).toContain('import "orangeui-stickers/styles.css"');
    expect(source).toContain("export default function CustomSticker()");
    expect(source).toContain('name="essential-heart"');
    expect(source).toContain("size={180}");
    expect(source).not.toContain("hoverPeel");
  });
});
