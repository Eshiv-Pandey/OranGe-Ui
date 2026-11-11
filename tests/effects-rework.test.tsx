import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createFireAudio } from "../components/ui/fire-audio";
import { GrainGradient } from "../components/ui/grain-gradient";

afterEach(() => vi.unstubAllGlobals());

it("starts fire only after a gesture, adjusts a running bed without restarting, and releases it", () => {
  const buffers: Float32Array[][] = [];
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = [];
  const level = { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() };
  const close = vi.fn(() => Promise.resolve());
  const Constructor = vi.fn(function () { return {
    state: "running", currentTime: 1, sampleRate: 8000, destination: {}, resume: () => Promise.resolve(), close,
    createBuffer(channels: number, length: number) { const data = Array.from({ length: channels }, () => new Float32Array(length)); buffers.push(data); return { getChannelData: (channel: number) => data[channel] }; },
    createBufferSource() { const source = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null }; sources.push(source); return source; },
    createGain: () => ({ gain: level, connect: vi.fn(), disconnect: vi.fn() }),
  }; });
  vi.stubGlobal("AudioContext", Constructor);
  const fire = createFireAudio();
  fire.start(0.3); expect(Constructor).not.toHaveBeenCalled();
  fire.unlock(); expect(sources).toHaveLength(0);
  fire.start(0.3); expect(sources).toHaveLength(1); expect(sources[0].start).toHaveBeenCalledOnce();
  fire.start(0.6); expect(sources).toHaveLength(1); expect(level.setTargetAtTime).toHaveBeenLastCalledWith(0.42, 1, 0.08);
  expect(buffers[0]).toHaveLength(2);
  expect(buffers[0][0].every(Number.isFinite)).toBe(true);
  expect(buffers[0][0].some((value, index) => value !== buffers[0][1][index])).toBe(true);
  fire.destroy(); expect(sources[0].stop).toHaveBeenCalledOnce(); expect(close).toHaveBeenCalledOnce();
  sources[0].onended?.(); expect(sources[0].disconnect).toHaveBeenCalledOnce();
});

it("exits fallback full screen with Escape and restores document scrolling", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  document.body.style.overflow = "auto";
  const view = render(<GrainGradient />);
  fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
  expect(view.container.querySelector(".grain-gradient")).toHaveAttribute("data-fullscreen", "fallback");
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(view.container.querySelector(".grain-gradient")).not.toHaveAttribute("data-fullscreen");
  expect(document.body.style.overflow).toBe("auto");
  expect(screen.getByRole("button", { name: "Full screen" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
  view.unmount(); expect(document.body.style.overflow).toBe("auto");
});
