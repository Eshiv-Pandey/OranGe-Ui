import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mascotPixels, PixelMascot } from "../components/art/pixel-mascot";
import { gamerBoyPixels, GamerBoy } from "../components/art/gamer-boy";
import { PixelGrass } from "../components/art/pixel-grass";

afterEach(() => vi.restoreAllMocks());

describe("Pixel art", () => {
  it.each([["mascot", mascotPixels], ["gamer boy", gamerBoyPixels]])("keeps the %s on a complete 32 by 32 grid", (_, rows) => {
    expect(rows).toHaveLength(32);
    expect(rows.every((row) => row.length === 32)).toBe(true);
    expect(rows.every((row) => /^[.A-Za-z]+$/.test(row))).toBe(true);
  });

  it("keeps decorative characters out of the accessibility tree", () => {
    const { container } = render(<><PixelMascot /><GamerBoy /></>);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("pauses grass when the document is hidden and resumes on return", () => {
    let visibility: DocumentVisibilityState = "visible";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
    const { container } = render(<PixelGrass />);
    const grass = container.querySelector(".pixel-grass");
    expect(grass).not.toHaveAttribute("data-paused");
    visibility = "hidden";
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(grass).toHaveAttribute("data-paused", "true");
    visibility = "visible";
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(grass).not.toHaveAttribute("data-paused");
  });

  it("uses unique paint servers when several grass strips are composed", () => {
    const { container } = render(<><PixelGrass /><PixelGrass /></>);
    const patterns = [...container.querySelectorAll("pattern")].map((pattern) => pattern.id);
    expect(patterns).toHaveLength(6);
    expect(new Set(patterns).size).toBe(6);
    for (const rect of container.querySelectorAll("svg > rect")) {
      expect(patterns).toContain(rect.getAttribute("fill")?.slice(5, -1));
    }
  });
});
