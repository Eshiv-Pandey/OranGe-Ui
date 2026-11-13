import { describe, expect, it } from "vitest";
import { components } from "../lib/components";
import { componentCategories } from "../lib/component-categories";

describe("shared component discovery", () => {
  it("assigns every entry exactly once and places related controls in their expected group", () => {
    expect(new Set(components.map(c => c.slug)).size).toBe(components.length);
    for (const component of components) expect(componentCategories).toContain(component.category);
    const expected = {
      textarea: "Inputs & forms", input: "Inputs & forms", "halo-button": "Buttons & actions",
      "flip-board": "Typography", "wave-player": "Audio & media", "audio-orb": "Audio & media",
      "character-avatar": "Avatars & characters", "liquid-metal": "Backgrounds & shaders",
      helmet: "Motorsport", "portfolio-footer": "Portfolio", "github-graph": "Portfolio", "animated-truck": "Motion & interactions",
    };
    for (const [slug, category] of Object.entries(expected)) expect(components.find(c => c.slug === slug)?.category).toBe(category);
  });
  it("keeps the same alphabetical ordering for search and navigation", () => {
    for (const category of componentCategories) {
      const names = components.filter(c => c.category === category).map(c => c.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    }
  });
});
