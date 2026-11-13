import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RetroCamera } from "../components/ui/retro-camera";

const stop = vi.fn(), getUserMedia = vi.fn();
const media = { getTracks: () => [{ stop }] } as unknown as MediaStream;
beforeEach(() => {
  stop.mockClear(); getUserMedia.mockReset().mockResolvedValue(media);
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    disconnect() {}
  });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
});
afterEach(() => vi.unstubAllGlobals());

it("requests a video stream only on activation and releases it through Stop camera", async () => {
  render(<RetroCamera />);
  expect(getUserMedia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop camera" })).toBeVisible());
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
  fireEvent.click(screen.getByRole("button", { name: "Stop camera" }));
  expect(stop).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Enable camera" })).toBeVisible();
});

it("keeps capture discoverable after permission denial and reports zero-sized frames", async () => {
  getUserMedia.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
  const { container } = render(<RetroCamera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Camera permission denied"));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D);
  Object.defineProperty(container.querySelector(".camera-demo-image"), "complete", { value: true });
  fireEvent.click(screen.getByRole("button", { name: "Take photo" }));
  expect(screen.getByRole("status")).toHaveTextContent("The preview is not ready yet");
});

it("crops a ready live frame and delivers the captured PNG through the callback", async () => {
  const capture = vi.fn(), drawImage = vi.fn(), translate = vi.fn(), scale = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage, translate, scale } as unknown as CanvasRenderingContext2D);
  const blob = new Blob(["test-png"], { type: "image/png" });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(blob));
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
  const { container } = render(<RetroCamera onCapture={capture} />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop camera" })).toBeVisible());
  const video = container.querySelector("video")!;
  Object.defineProperties(video, { readyState: { value: 2 }, videoWidth: { value: 1920 }, videoHeight: { value: 1080 } });
  fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  fireEvent.click(screen.getByRole("button", { name: "Take photo" }));
  expect(drawImage).toHaveBeenCalledWith(video, 192, 108, 1536, 864, 0, 0, 1280, 720);
  expect(scale).toHaveBeenCalledWith(-1, 1);
  expect(capture).toHaveBeenCalledWith(blob);
  expect(screen.getByRole("link", { name: "Download selected photo" })).toHaveAttribute("download");
});

it("stops a delayed permission result after unmount without reactivating the camera", async () => {
  let resolve!: (value: MediaStream) => void;
  getUserMedia.mockReturnValue(new Promise<MediaStream>(done => { resolve = done; }));
  const { unmount } = render(<RetroCamera />);
  fireEvent.click(screen.getByRole("button", { name: "Enable camera" }));
  unmount();
  await act(async () => resolve(media));
  expect(stop).toHaveBeenCalledOnce();
});
