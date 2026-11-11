import { StrictMode } from "react";
import { act, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NeonSign404, useNeonFlicker } from "../components/ui/neon-sign-404";
import { ChaiBreak404 } from "../components/ui/chai-break-404";
import { PavilionFooter } from "../components/ui/pavilion-footer";

let reduced = false;
let mediaChange: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers(); reduced = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: (_: string, callback: () => void) => { mediaChange = callback; }, removeEventListener: vi.fn() }));
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1)); vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.spyOn(Math, "random").mockReturnValue(.5);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function Harness({ count = 3, startup = true }: { count?: number; startup?: boolean }) {
  const off = useNeonFlicker(count, { flickerInterval: [300, 300], startup });
  return <output data-testid="off">{off.join(",")}</output>;
}

it("never darkens more than one tube through startup and repeated complete outages", () => {
  render(<Harness />);
  let sawOutage = false;
  for (let elapsed = 0; elapsed < 8000; elapsed += 25) {
    act(() => { vi.advanceTimersByTime(25); });
    const off = screen.getByTestId("off").textContent;
    expect(off).not.toContain(","); if (off) sawOutage = true;
  }
  expect(sawOutage).toBe(true);
});

it("pauses a pending timeout in a hidden tab and resumes only its remaining delay", () => {
  render(<Harness startup={false} />); act(() => { vi.advanceTimersByTime(160); });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(vi.getTimerCount()).toBe(0);
  act(() => { vi.advanceTimersByTime(10000); }); expect(screen.getByTestId("off")).toHaveTextContent("");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(199); });
  expect(screen.getByTestId("off")).toHaveTextContent("");
  act(() => { vi.advanceTimersByTime(1); }); expect(screen.getByTestId("off")).toHaveTextContent("1");
});

it("restores every tube when reduced motion is enabled and leaves no running timer", () => {
  render(<Harness />); act(() => { vi.advanceTimersByTime(60); }); expect(screen.getByTestId("off")).toHaveTextContent("0");
  reduced = true; act(() => { mediaChange?.(); });
  expect(screen.getByTestId("off")).toHaveTextContent(""); expect(vi.getTimerCount()).toBe(0);
});

it("does not run the component's timer chain while its observer reports it offscreen", () => {
  let intersection: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof intersection) { intersection = callback; } observe() {} disconnect = disconnect; });
  const { unmount } = render(<NeonSign404 />); expect(vi.getTimerCount()).toBe(0);
  act(() => { intersection?.([{ isIntersecting: true }]); }); expect(vi.getTimerCount()).toBe(1);
  act(() => { intersection?.([{ isIntersecting: false }]); }); expect(vi.getTimerCount()).toBe(0);
  unmount(); expect(disconnect).toHaveBeenCalledOnce();
});

it("cleans the timeout chain under Strict Mode and treats disabled flicker as steady", () => {
  const { unmount } = render(<StrictMode><Harness /></StrictMode>);
  expect(vi.getTimerCount()).toBe(1); unmount(); expect(vi.getTimerCount()).toBe(0);
  render(<NeonSign404 flicker={false} digits="OPEN" pixelated />);
  expect(document.querySelectorAll(".neon-sign-digit")).toHaveLength(4); expect(vi.getTimerCount()).toBe(0);
  expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

it("provides the requested chai recovery copy, named art and configurable destinations", () => {
  render(<ChaiBreak404 homeHref="/welcome" reportHref="/feedback" />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This page is out for a chai break.");
  expect(screen.getByRole("img")).toHaveAccessibleName("Chai being poured into a glass");
  expect(screen.getByRole("link", { name: "Take me home" })).toHaveAttribute("href", "/welcome");
  expect(screen.getByRole("link", { name: "Report a broken link" })).toHaveAttribute("href", "/feedback");
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});

it("exposes keyboard-operable pavilion controls and custom navigation", () => {
  render(<PavilionFooter pixelated linkGroups={[{ title: "Library", links: [{ label: "Our work", href: "/work" }] }]} />);
  const light = screen.getByRole("button", { name: "Light the pavilion" });
  act(() => { light.click(); }); expect(light).toHaveAttribute("aria-pressed", "true");
  expect(document.querySelector("footer")).toHaveAttribute("data-lit", "true");
  expect(screen.getByRole("link", { name: "Our work" })).toHaveAttribute("href", "/work");
  expect(screen.queryByRole("button", { name: "Send the birds" })).not.toBeInTheDocument();
  expect(document.querySelectorAll(".pavilion-bird")).toHaveLength(4);
  expect(document.querySelectorAll(".pavilion-neighbor")).toHaveLength(3);
});
