import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import * as pack from "../components/ui/sticker-pack";

describe("original sticker pack", () => {
  it("provides seventy distinct designs and twenty Everyday favorites", () => {
    expect(pack.STICKERS).toHaveLength(70);
    expect(new Set(pack.STICKERS.map(item => item.name)).size).toBe(70);
    expect(new Set(pack.STICKERS.map(item => item.body)).size).toBe(70);
    for (const category of pack.STICKER_CATEGORIES) expect(pack.STICKERS.filter(item => item.category === category)).toHaveLength(category === "Everyday" ? 20 : 10);
    const named = Object.entries(pack).filter(([name, value]) => /^[A-Z].+Sticker$/.test(name) && typeof value === "function").map(([name, value]) => [name, value as ComponentType<pack.NamedStickerProps>] as const);
    expect(named).toHaveLength(70);
    expect(new Set(named.map(([, Component]) => renderToStaticMarkup(<Component size={96} />))).size).toBe(70);
  });
  it("labels artwork without adding a focus stop and supports decorative use", () => {
    const { rerender } = render(<pack.OrbitSnailSticker size={160} hoverPeel label="A slow little astronaut" />);
    expect(screen.getByRole("img", { name: "A slow little astronaut" })).not.toHaveAttribute("tabindex");
    rerender(<pack.OrbitSnailSticker decorative />);
    expect(screen.queryByRole("img")).toBeNull();
  });
  it("replays click motion with equivalent keyboard actions and preserves consumer callbacks", () => {
    const callback = vi.fn();
    render(<pack.EssentialHeartSticker interactive onClick={callback} rotate={45} motion="wiggle" duration={1100} intensity={1.5} shadow={false} />);
    const control = screen.getByRole("button", { name: "Animate Essential heart" });
    const firstSheet = control.querySelector(".orange-sticker-sheet");
    fireEvent.click(control);
    expect(firstSheet?.isConnected).toBe(false);
    expect(control.querySelector(".orange-sticker-sheet")).toHaveAttribute("data-motion", "wiggle");
    fireEvent.keyDown(control, { key: "Enter" });
    fireEvent.keyDown(control, { key: " " });
    expect(callback).toHaveBeenCalledTimes(3);
    expect(control.style.getPropertyValue("--sticker-rotation")).toBe("45deg");
    expect(control.style.getPropertyValue("--sticker-duration")).toBe("1100ms");
    expect(control).toHaveAttribute("data-shadow", "false");
  });
  it("allows a consumer to suppress activation after dragging and bounds invalid motion settings", () => {
    render(<pack.EssentialHeartSticker interactive onClick={event => event.preventDefault()} duration={NaN} intensity={Infinity} />);
    const control = screen.getByRole("button", { name: "Animate Essential heart" });
    fireEvent.click(control);
    expect(control.querySelector(".orange-sticker-sheet")).not.toHaveAttribute("data-motion");
    expect(control.style.getPropertyValue("--sticker-duration")).toBe("650ms");
    expect(control.style.getPropertyValue("--sticker-intensity")).toBe("1");
  });
  it("exports fifty parseable standalone SVGs without fonts, external assets or duplicate IDs", () => {
    for (const sticker of pack.STICKERS) {
      const svg = pack.stickerSvg(sticker.name, 512), parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
      expect(parsed.querySelector("parsererror"), sticker.name).toBeNull();
      expect(parsed.documentElement.getAttribute("viewBox")).toBe("0 0 128 128");
      expect(parsed.querySelectorAll("path").length).toBeGreaterThan(1);
      expect(svg).not.toMatch(/<(?:script|image|text|foreignObject)|\bid=|(?:href|url)\s*[=(]/i);
    }
    expect(pack.stickerSvg("orbit-snail", NaN)).toContain('width="512"');
    expect(pack.stickerSvg("orbit-snail", 99999)).toContain('width="4096"');
    expect(() => pack.getSticker("unknown" as pack.StickerName)).toThrow(RangeError);
  });
});
