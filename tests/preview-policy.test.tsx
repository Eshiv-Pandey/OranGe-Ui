import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PreviewCard, STATIC_PREVIEWS } from "../components/library/preview-card";

const playback = vi.hoisted(() => vi.fn());
vi.mock("../components/library/use-demo-player", () => ({ useDemoPlayer: playback }));

it("shows simple previews without playback, a cursor or interactive descendants", () => {
  const { container } = render(<PreviewCard staticPreview label="Button"><button>Continue</button></PreviewCard>);
  expect(container.querySelector("[inert]")).toContainElement(container.querySelector("button"));
  expect(container.querySelector(".preview-cursor")).toBeNull();
  expect(container.querySelector(".demo-preview")).toHaveAttribute("data-playing", "false");
  expect(playback).not.toHaveBeenCalled();
  for (const slug of ["button", "input", "select", "badge", "sticker-social-icons"]) expect(STATIC_PREVIEWS.has(slug)).toBe(true);
  for (const slug of ["race-start-lights", "retro-camera", "audio-orb", "flowing-water"]) expect(STATIC_PREVIEWS.has(slug)).toBe(false);
});
