import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PaperCut } from "../components/ui/paper-cut";
import { createPaperCutArt } from "../components/ui/paper-cut-art";

let callbacks: Map<number, FrameRequestCallback>, clock: number, next: number;
let media: EventTarget & { matches: boolean; addListener: () => void; removeListener: () => void };
beforeEach(() => {
  callbacks = new Map(); clock = 0; next = 0;
  media = Object.assign(new EventTarget(), { matches: false, addListener() {}, removeListener() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => media as unknown as MediaQueryList));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { callbacks.set(++next, callback); return next; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => { callbacks.delete(id); }));
  vi.stubGlobal("IntersectionObserver", undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function settle() {
  for (let frame = 0; callbacks.size && frame < 180; frame++) {
    clock += 16; const pending = [...callbacks.values()]; callbacks.clear();
    act(() => pending.forEach(callback => callback(clock)));
  }
  expect(callbacks.size).toBe(0);
}
function point(element: HTMLElement, name = "pointermove", pointerType = "mouse", extra = {}) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, width: 1000, height: 700, right: 1000, bottom: 700, toJSON() {} });
  fireEvent(element, Object.assign(new Event(name, { bubbles: true }), { clientX: 950, clientY: 630, pointerId: 1, pointerType, isPrimary: true, ...extra }));
}
it("keeps complete deterministic artwork and unique definitions in server-rendered instances", () => {
  expect(createPaperCutArt(7)).toEqual(createPaperCutArt(7));
  expect(createPaperCutArt(8)).not.toEqual(createPaperCutArt(7));
  for (const sheet of createPaperCutArt(Infinity, NaN)) expect(sheet.path).not.toMatch(/NaN|Infinity/);
  const html = renderToStaticMarkup(<><PaperCut /><PaperCut><a href="/work">Explore</a></PaperCut></>);
  const ids = [...html.matchAll(/<filter id="([^"]+)"/g)].map(match => match[1]);
  expect(ids).toHaveLength(2); expect(new Set(ids).size).toBe(2);
  expect(html).toContain("Explore"); expect(html).toContain("<path"); expect(html).not.toContain("pinimg");
});
it("shifts real sheets by depth, returns on leave and has no idle animation loop", () => {
  const { getByRole, container } = render(<PaperCut />); const host = getByRole("group");
  expect(callbacks.size).toBe(0); point(host); settle();
  const groups = container.querySelectorAll("[data-paper-sheet]");
  expect(groups[0].getAttribute("transform")).not.toEqual(groups[7].getAttribute("transform"));
  expect(host.dataset.paperPosition).toBe("0.900,0.800");
  fireEvent.pointerLeave(host); settle(); expect(host.dataset.paperPosition).toBe("0.000,0.000");
});
it("supports keyboard perspective while leaving child control keys and touch scrolling native", () => {
  const { getByRole } = render(<PaperCut><input aria-label="Banner input" /></PaperCut>);
  const host = getByRole("group"); fireEvent.keyDown(host, { key: "ArrowRight" }); settle();
  expect(host.dataset.paperPosition).toBe("0.200,0.000");
  fireEvent.keyDown(getByRole("textbox"), { key: "ArrowRight" }); expect(callbacks.size).toBe(0);
  fireEvent.keyDown(host, { key: "Escape" }); settle(); expect(host.dataset.paperPosition).toBe("0.000,0.000");
  point(host, "pointermove", "touch"); expect(callbacks.size).toBe(0);
  point(host, "pointerdown", "touch"); settle(); expect(host.dataset.paperPosition).toBe("0.900,0.800");
  fireEvent.pointerCancel(host); settle(); expect(host.dataset.paperPosition).toBe("0.000,0.000");
});
it("centers and stops motion on preference changes and cancels owned work on unmount", () => {
  const { getByRole, unmount } = render(<PaperCut />); const host = getByRole("group");
  point(host); expect(callbacks.size).toBe(1);
  act(() => { media.matches = true; media.dispatchEvent(new Event("change")); });
  expect(callbacks.size).toBe(0); expect(host.dataset.paperMotion).toBe("reduced"); expect(host.dataset.paperPosition).toBe("0.000,0.000");
  point(host); expect(callbacks.size).toBe(0);
  act(() => { media.matches = false; media.dispatchEvent(new Event("change")); });
  point(host); expect(callbacks.size).toBe(1); unmount(); expect(callbacks.size).toBe(0);
  media.dispatchEvent(new Event("change")); expect(callbacks.size).toBe(0);
});
it("keeps paused and noninteractive surfaces still without a keyboard stop", () => {
  const { getByRole, rerender } = render(<PaperCut paused />); let host = getByRole("group");
  point(host); expect(callbacks.size).toBe(0);
  rerender(<PaperCut interactive={false} />); host = getByRole("group");
  expect(host.hasAttribute("tabindex")).toBe(false); point(host); expect(callbacks.size).toBe(0);
});
