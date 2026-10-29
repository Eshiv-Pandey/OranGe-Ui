import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLACK, WHITE, LiveOrb, createLiveOrb, fallbackFaceStyle, resolveVariant } from "../components/ui/live-orb";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => { cleanup(); delete document.documentElement.dataset.theme; document.documentElement.className = ""; vi.unstubAllGlobals(); });

describe("LiveOrb source integration", () => {
  it("renders an accessible static fallback without WebGL and updates colors", () => {
    const view = render(<LiveOrb variant="custom" size={120} color="#2563eb" eyeColor="#ffffff" />);
    const orb = screen.getByRole("img", { name: "Orb character" });
    expect(orb).toHaveStyle({ width: "120px", height: "120px" });
    expect(orb.querySelector(":scope > div")).toHaveStyle({ backgroundColor: "#2563eb" });
    view.rerender(<LiveOrb variant="custom" color="#059669" eyeColor="#171717" />);
    expect(orb.querySelector(":scope > div")).toHaveStyle({ backgroundColor: "#059669" });
    expect(orb.querySelector("span")).toHaveStyle({ backgroundColor: "#171717" });
  });
  it("follows document themes and preserves explicit variants", async () => {
    const view = render(<LiveOrb />);
    const face = screen.getByRole("img").querySelector(":scope > div");
    expect(face).toHaveStyle({ backgroundColor: BLACK.color });
    await act(async () => { document.documentElement.dataset.theme = "dark"; });
    await waitFor(() => expect(face).toHaveStyle({ backgroundColor: WHITE.color }));
    view.rerender(<LiveOrb variant="black" />);
    expect(face).toHaveStyle({ backgroundColor: BLACK.color });
  });
  it("preserves palette stops in the fallback and initializes safely without a context", () => {
    expect(fallbackFaceStyle(resolveVariant("webgl", undefined, undefined, ["#ff0000", "#00ff00", "#0000ff"]))).toEqual({ backgroundImage: "linear-gradient(135deg, #ff0000, #00ff00, #0000ff)" });
    expect(createLiveOrb(document.createElement("canvas"))).toBeNull();
  });
  it("provides named server-rendered content before hydration", () => {
    const html = renderToString(<LiveOrb size={96} />);
    expect(html).toContain('aria-label="Orb character"');
    expect(html).toContain("<canvas");
    expect(html).not.toContain("NaN");
  });
});
