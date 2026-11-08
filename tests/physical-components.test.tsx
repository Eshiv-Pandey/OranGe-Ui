import { createHash } from "node:crypto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { WallSwitch } from "../components/ui/wall-switch";
import { CHARACTER_HAIR, CHARACTER_OUTFITS, CHARACTER_FACES, CHARACTER_GLASSES, generateCharacterConfig, characterToSvgString } from "../components/ui/character-art";
import { createFilmPath } from "../components/ui/endless-film-path";
afterEach(() => vi.unstubAllGlobals());

it("toggles the household switch with its label and keyboard, and submits a native form value", async () => {
  const user = userEvent.setup();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  const { container } = render(<form><WallSwitch label="Studio light" name="light" value="on" /></form>);
  const button = screen.getByRole("switch", { name: "Studio light" });
  button.focus(); await user.keyboard(" "); expect(button).toBeChecked();
  expect(new FormData(container.querySelector("form")!).get("light")).toBe("on");
  await user.click(screen.getByText("Studio light")); expect(button).not.toBeChecked();
  expect(new FormData(container.querySelector("form")!).get("light")).toBeNull();
});

it("preserves the exact existing female artwork across 588 part combinations", () => {
  const base = generateCharacterConfig("preserve-female", "female"), hash = createHash("sha256");
  for (const hair of CHARACTER_HAIR) for (const outfit of CHARACTER_OUTFITS) for (const face of CHARACTER_FACES) for (const glasses of CHARACTER_GLASSES) {
    hash.update(characterToSvgString({ ...base, parts: { ...base.parts, hair, outfit, face, glasses } }, 240, { id: "female-regression" }));
  }
  expect(hash.digest("hex")).toBe("9441e1ddb39728c5020bddc5765887af888ba7dbe14af8b9d94f15645b907679");
});

it("gives every male face its own features even with no facial hair", () => {
  const base = generateCharacterConfig("clean-shaven", "male");
  for (const face of CHARACTER_FACES) {
    const svg = characterToSvgString({ ...base, parts: { ...base.parts, face, facialHair: "none" } });
    expect(svg).toContain("character-male-face"); expect(svg).toContain("character-male-eye"); expect(svg).not.toContain('class="character-facial-hair"');
  }
});

it("keeps both ribbon paths finite and ordered at every frame position", () => {
  for (const compact of [false, true]) {
    const path = createFilmPath(compact);
    expect(path.length).toBeGreaterThan(1200);
    for (let distance = 0; distance <= path.length; distance += 37) {
      const point = path.at(distance);
      expect([point.x, point.y, point.angle].every(Number.isFinite)).toBe(true);
      if (distance + 37 <= path.length) {
        const next = path.at(distance + 37);
        expect(Math.hypot(next.x - point.x, next.y - point.y)).toBeLessThanOrEqual(37.01);
      }
    }
  }
});
