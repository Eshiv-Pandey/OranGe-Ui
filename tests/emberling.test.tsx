import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Emberling } from "../components/ui/emberling";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); delete document.documentElement.dataset.theme; document.documentElement.className = ""; vi.unstubAllGlobals(); });

describe("Emberling", () => {
  it("renders complete, named artwork before hydration without a graphics context", () => {
    const html = renderToString(<Emberling size={96} />);
    expect(html).toContain('aria-label="Fire elemental with a happy expression"');
    expect(html).toContain("<svg"); expect(html).toContain("<path");
    expect(html).not.toContain("<canvas"); expect(html).not.toContain("NaN");
  });
  it("keeps custom shell and eye colors live without replacing the artwork", () => {
    const view = render(<Emberling variant="custom" size={120} color="#2563eb" eyeColor="#ffffff" />);
    const character = screen.getByRole("img"), artwork = character.querySelector("svg");
    expect(character).toHaveStyle({ width: "120px", "--ember-color": "#2563eb" });
    view.rerender(<Emberling variant="custom" color="#059669" eyeColor="#171717" blink={false} />);
    expect(character.querySelector("svg")).toBe(artwork);
    expect(character).toHaveStyle({ "--ember-color": "#059669" });
    expect(character.querySelector(".emberling-eyes")).toHaveAttribute("fill", "#171717");
    expect(character).toHaveAttribute("data-blink", "false");
  });
  it("follows live themes, preserves explicit themes and avoids duplicate gradient IDs", async () => {
    render(<><Emberling /><Emberling theme="light" variant="prism" /></>);
    const characters = screen.getAllByRole("img");
    await act(async () => { document.documentElement.dataset.theme = "dark"; });
    await waitFor(() => expect(characters[0]).toHaveAttribute("data-theme", "dark"));
    expect(characters[1]).toHaveAttribute("data-theme", "light");
    const ids = [...document.querySelectorAll("svg [id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
