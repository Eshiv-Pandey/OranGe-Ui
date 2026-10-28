import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvatarEditor } from "../components/ui/avatar-editor";
import { generateMascotConfig, normalizeMascotConfig, MASCOT_OPTIONS, MASCOT_PALETTES, type MascotConfig } from "../components/ui/mascot-art";
import { downloadArtwork, svgToPng } from "../components/ui/svg-export";
import { generateAvatarConfig, normalizeAvatarConfig } from "../lib/avatar/generator";
import { avatarGlyphs } from "../lib/avatar/glyphs";
import type { AvatarConfig } from "../lib/avatar/types";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

function characterConfig(): MascotConfig {
  return JSON.parse(screen.getByLabelText("Character configuration").textContent ?? "null") as MascotConfig;
}

function glyphConfig(): AvatarConfig {
  return JSON.parse(screen.getByLabelText("Avatar configuration").textContent ?? "null") as AvatarConfig;
}

describe("AvatarEditor independent character identity", () => {
  beforeEach(() => {
    // Identity tests do not advance motion. The scheduler's browser lifecycle
    // is exercised separately in pointer-gaze and mascot-avatar tests.
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
  });

  it("emits controlled character changes and waits for the owner to supply the new value", async () => {
    const user = userEvent.setup();
    const glyph = generateAvatarConfig("controlled-glyph");
    const character = generateMascotConfig("controlled-character");
    const nextKind = MASCOT_OPTIONS.find((option) => option.value !== character.mascot)!;
    const onChange = vi.fn();
    const onCharacterChange = vi.fn();
    const view = render(<AvatarEditor value={glyph} onChange={onChange} characterValue={character} onCharacterChange={onCharacterChange} />);

    await user.click(screen.getByRole("tab", { name: "Characters" }));
    await user.click(screen.getByRole("radio", { name: nextKind.label }));
    const requested = normalizeMascotConfig({ ...character, mascot: nextKind.value });
    expect(onCharacterChange).toHaveBeenLastCalledWith(requested);
    expect(characterConfig()).toEqual(character);
    expect(screen.getByRole("radio", { name: nextKind.label })).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();

    view.rerender(<AvatarEditor value={glyph} onChange={onChange} characterValue={requested} onCharacterChange={onCharacterChange} />);
    expect(characterConfig()).toEqual(requested);
    expect(screen.getByRole("radio", { name: nextKind.label })).toBeChecked();

    fireEvent.change(screen.getByLabelText("Body color"), { target: { value: "#123456" } });
    const colored = normalizeMascotConfig({ ...requested, colors: { ...requested.colors, body: "#123456" } });
    expect(onCharacterChange).toHaveBeenLastCalledWith(colored);
    expect(characterConfig()).toEqual(requested);
    expect(screen.getByLabelText("Body color")).toHaveValue(requested.colors.body);
    view.rerender(<AvatarEditor value={glyph} onChange={onChange} characterValue={colored} onCharacterChange={onCharacterChange} />);
    expect(screen.getByLabelText("Body color")).toHaveValue("#123456");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("routes character identity edits separately and keeps AI state and motion settings transient", async () => {
    const user = userEvent.setup();
    const seed = "separate-identities";
    const onChange = vi.fn();
    const onCharacterChange = vi.fn();
    render(<AvatarEditor value={generateAvatarConfig(seed)} onChange={onChange} seed={seed} onCharacterChange={onCharacterChange} />);
    await user.click(screen.getByRole("tab", { name: "Characters" }));
    const original = characterConfig();
    const otherKind = MASCOT_OPTIONS.find((option) => option.value !== original.mascot)!;

    await user.click(screen.getByRole("radio", { name: otherKind.label }));
    expect(onCharacterChange).toHaveBeenCalledTimes(1);
    expect(characterConfig().mascot).toBe(otherKind.value);
    await user.selectOptions(screen.getByRole("combobox", { name: "Character palette" }), "2");
    expect(onCharacterChange).toHaveBeenCalledTimes(2);
    expect(characterConfig().colors).toEqual(MASCOT_PALETTES[2].colors);
    fireEvent.change(screen.getByLabelText("Accent color"), { target: { value: "#345678" } });
    expect(onCharacterChange).toHaveBeenCalledTimes(3);
    expect(characterConfig().colors.accent).toBe("#345678");

    const customized = characterConfig();
    await user.selectOptions(screen.getByRole("combobox", { name: "Character state" }), "talking");
    expect(screen.getByRole("button", { name: "Mascot preview, talking" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Follow pointer" }));
    await user.click(screen.getByRole("checkbox", { name: "Blink" }));
    expect(screen.getByRole("img", { name: "Mascot preview, talking" })).toBeInTheDocument();
    expect(characterConfig()).toEqual(customized);
    expect(onCharacterChange).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole("button", { name: "Randomize character" }));
    expect(onCharacterChange).toHaveBeenCalledTimes(4);
    expect(characterConfig()).not.toEqual(customized);
    await user.click(screen.getByRole("button", { name: "Reset character" }));
    expect(onCharacterChange).toHaveBeenCalledTimes(5);
    expect(characterConfig()).toEqual(generateMascotConfig(seed));
    expect(screen.getByRole("combobox", { name: "Character state" })).toHaveValue("idle");
    expect(screen.getByRole("checkbox", { name: "Follow pointer" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Blink" })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("preserves the owner's edited glyph config and the local character config across tab switches", async () => {
    const user = userEvent.setup();
    const onGlyphChange = vi.fn();
    const initial = normalizeAvatarConfig({ ...generateAvatarConfig("tab-memory"), palette: 0, glyph: avatarGlyphs[0].id });
    function StatefulEditor() {
      const [value, setValue] = useState(initial);
      return <AvatarEditor value={value} onChange={(next) => { setValue(next); onGlyphChange(next); }} seed="tab-memory" />;
    }
    render(<StatefulEditor />);
    fireEvent.change(screen.getByRole("slider", { name: "Gradient angle" }), { target: { value: "217" } });
    fireEvent.change(screen.getByLabelText("Gradient color 1"), { target: { value: "#abcdef" } });
    await user.click(screen.getByRole("radio", { name: avatarGlyphs[1].name }));
    const editedGlyph = glyphConfig();
    expect(editedGlyph.angle).toBe(217);
    expect(editedGlyph.customColors?.[0]).toBe("#abcdef");
    expect(editedGlyph.glyph).toBe(avatarGlyphs[1].id);
    const glyphChanges = onGlyphChange.mock.calls.length;

    await user.click(screen.getByRole("tab", { name: "Characters" }));
    await user.click(screen.getByRole("radio", { name: "Ribbon ray" }));
    fireEvent.change(screen.getByLabelText("Body color"), { target: { value: "#fedcba" } });
    const editedCharacter = characterConfig();
    expect(editedCharacter.colors.body).toBe("#fedcba");
    await user.click(screen.getByRole("tab", { name: "Glyphs" }));
    expect(glyphConfig()).toEqual(editedGlyph);
    expect(screen.getByRole("radio", { name: avatarGlyphs[1].name })).toBeChecked();
    expect(screen.getByRole("slider", { name: "Gradient angle" })).toHaveValue("217");
    expect(screen.getByLabelText("Gradient color 1")).toHaveValue("#abcdef");
    expect(onGlyphChange).toHaveBeenCalledTimes(glyphChanges);

    await user.click(screen.getByRole("tab", { name: "Characters" }));
    expect(characterConfig()).toEqual(editedCharacter);
    expect(screen.getByRole("radio", { name: "Ribbon ray" })).toBeChecked();
  });

  it("resets each identity from the current seed without overwriting a controlled value", async () => {
    const user = userEvent.setup();
    const oldSeed = "earlier-seed";
    const seed = "current-reset-seed";
    const glyph = normalizeAvatarConfig({ ...generateAvatarConfig("saved-glyph"), angle: 17 });
    const character = normalizeMascotConfig({ ...generateMascotConfig("saved-character"), colors: { ...generateMascotConfig("saved-character").colors, body: "#123456" } });
    const onChange = vi.fn();
    const onCharacterChange = vi.fn();
    const view = render(<AvatarEditor value={glyph} onChange={onChange} characterValue={character} onCharacterChange={onCharacterChange} seed={oldSeed} />);
    await user.click(screen.getByRole("tab", { name: "Characters" }));
    view.rerender(<AvatarEditor value={glyph} onChange={onChange} characterValue={character} onCharacterChange={onCharacterChange} seed={seed} />);
    await user.click(screen.getByRole("button", { name: "Reset character" }));
    expect(onCharacterChange).toHaveBeenLastCalledWith(generateMascotConfig(seed));
    expect(characterConfig()).toEqual(character);
    expect(onChange).not.toHaveBeenCalled();
    view.rerender(<AvatarEditor value={glyph} onChange={onChange} characterValue={generateMascotConfig(seed)} onCharacterChange={onCharacterChange} seed={seed} />);
    expect(characterConfig()).toEqual(generateMascotConfig(seed));

    await user.click(screen.getByRole("tab", { name: "Glyphs" }));
    expect(glyphConfig()).toEqual(glyph);
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(onChange).toHaveBeenLastCalledWith(generateAvatarConfig(seed));
    expect(glyphConfig()).toEqual(glyph);
    expect(onCharacterChange).toHaveBeenCalledTimes(1);
  });
});

describe("character export failure cleanup", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><circle cx="80" cy="80" r="60" fill="#abcdef"/></svg>';

  it("releases the decoded SVG URL when the browser cannot encode PNG", async () => {
    const drawImage = vi.fn();
    const canvas = { getContext: () => ({ drawImage }), toBlob: (callback: BlobCallback) => callback(null) };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:failed-encoding", revokeObjectURL });
    vi.stubGlobal("Image", class { onload?: () => void; set src(_value: string) { this.onload?.(); } });
    await expect(svgToPng(svg)).rejects.toThrow("could not encode the PNG");
    expect(drawImage).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:failed-encoding");
  });

  it("releases the source URL and does not encode after a canvas drawing failure", async () => {
    const toBlob = vi.fn();
    const canvas = { getContext: () => ({ drawImage: () => { throw new Error("Canvas drawing failed"); } }), toBlob };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:failed-drawing", revokeObjectURL });
    vi.stubGlobal("Image", class { onload?: () => void; set src(_value: string) { this.onload?.(); } });
    await expect(svgToPng(svg)).rejects.toThrow("Canvas drawing failed");
    expect(toBlob).not.toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:failed-drawing");
  });

  it("removes the download link and releases its URL when click dispatch fails", () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:failed-download", revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { throw new Error("Download dispatch failed"); });
    expect(() => downloadArtwork(new Blob([svg]), "character.svg")).toThrow("Download dispatch failed");
    expect(document.querySelector('a[href="blob:failed-download"]')).toBeNull();
    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:failed-download");
  });
});
