import { useState } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { Avatar, AVATAR_SIZES, avatarSizePixels } from "../components/ui/avatar";
import { AvatarGroup } from "../components/ui/avatar-group";
import { AvatarEditor } from "../components/ui/avatar-editor";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { DEFAULT_AVATAR_SEED, generateAvatarConfig, normalizeAvatarConfig } from "../lib/avatar/generator";
import { avatarGlyphs } from "../lib/avatar/glyphs";
import { avatarPalettes } from "../lib/avatar/palettes";
import type { AvatarConfig } from "../lib/avatar/types";
import * as orangeUi from "../index";

function glyphPaths(config: AvatarConfig) {
  return avatarGlyphs.find((glyph) => glyph.id === config.glyph)!.paths;
}

function ControlledEditor({ initial = generateAvatarConfig("keyboard-user") }: { initial?: AvatarConfig }) {
  const [value, setValue] = useState(initial);
  return <AvatarEditor value={value} onChange={setValue} seed="keyboard-user" />;
}

describe("avatar public entry point", () => {
  it("exports the components, portable config, data, and server-safe SVG helpers", () => {
    const config: orangeUi.AvatarConfig = orangeUi.generateAvatarConfig("public-profile");
    expect(orangeUi.Avatar).toBe(Avatar);
    expect(orangeUi.AvatarGroup).toBe(AvatarGroup);
    expect(orangeUi.AvatarEditor).toBe(AvatarEditor);
    expect(orangeUi.avatarPalettes).toBe(avatarPalettes);
    expect(orangeUi.avatarGlyphs).toBe(avatarGlyphs);
    expect(orangeUi.normalizeAvatarConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
    expect(renderToString(<orangeUi.Avatar config={config} name="Public profile" />)).toContain('aria-label="Public profile"');
    const svg = orangeUi.avatarToSvgString(config, 128);
    expect(svg).toContain('width="128"');
    expect(decodeURIComponent(orangeUi.avatarToDataUrl(config, 128).split(",")[1])).toBe(svg);
    expect(orangeUi.avatarToPng).toBeTypeOf("function");
  });
});

describe("Avatar", () => {
  it("renders a named, fixed-size inline SVG with a stable seed-derived glyph", () => {
    const { container } = render(<Avatar seed="person-12" name="Maya Patel" />);
    const avatar = screen.getByRole("img", { name: "Maya Patel" });
    expect(avatar.tagName.toLowerCase()).toBe("svg");
    expect(avatar).toHaveAttribute("viewBox", "0 0 100 100");
    expect(avatar).toHaveAttribute("width", "48");
    expect(avatar).toHaveAttribute("height", "48");
    for (const path of glyphPaths(generateAvatarConfig("person-12"))) expect(avatar.innerHTML).toContain(path);
    expect(container.querySelector("img, image, canvas")).toBeNull();
  });

  it("uses saved config before seed, and uses a deterministic guest when both are absent", () => {
    const config = generateAvatarConfig("saved-profile");
    const { rerender } = render(<Avatar config={config} seed="ignored-seed" aria-label="Saved avatar" />);
    for (const path of glyphPaths(config)) expect(screen.getByRole("img").innerHTML).toContain(path);
    rerender(<Avatar />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Generated profile avatar");
    for (const path of glyphPaths(generateAvatarConfig(DEFAULT_AVATAR_SEED))) expect(screen.getByRole("img").innerHTML).toContain(path);
  });

  it("keeps the existing name seed and status aliases, with custom accessible names", () => {
    const { rerender } = render(<Avatar name="Alex Chen" status="online" />);
    expect(screen.getByRole("img", { name: "Alex Chen, online" })).toBeInTheDocument();
    for (const path of glyphPaths(generateAvatarConfig("Alex Chen"))) expect(screen.getByRole("img").innerHTML).toContain(path);
    rerender(<Avatar name="Alex Chen" status="away" aria-label="Project owner" />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Project owner");
  });

  it("namespaces every definition for repeated copies of the same avatar", () => {
    const { container } = render(<><Avatar seed="same" /><Avatar seed="same" /><Avatar seed="same" /></>);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const avatar of container.querySelectorAll("svg[data-generated-avatar]")) {
      const localIds = new Set([...avatar.querySelectorAll("[id]")].map((node) => node.id));
      const refs = [...avatar.innerHTML.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1]);
      expect(refs.length).toBeGreaterThan(0);
      for (const reference of refs) expect(localIds.has(reference)).toBe(true);
    }
  });

  it.each(Object.entries(AVATAR_SIZES))("supports the %s named size", (size, pixels) => {
    render(<Avatar size={size as keyof typeof AVATAR_SIZES} />);
    expect(screen.getByRole("img")).toHaveAttribute("width", String(pixels));
  });

  it("supports numeric sizes, handles invalid dimensions, and allows a shape override", () => {
    render(<Avatar size={96} shape="circle" config={generateAvatarConfig("round-profile")} />);
    expect(screen.getByRole("img")).toHaveAttribute("width", "96");
    expect(screen.getByRole("img")).toHaveAttribute("data-shape", "circle");
    expect(avatarSizePixels(NaN)).toBe(48);
    expect(avatarSizePixels(-1)).toBe(12);
    expect(avatarSizePixels(10000)).toBe(2048);
  });

  it.each(APPEARANCE_VALUES)("has an accessible %s appearance", async (appearance) => {
    const { container } = render(<Avatar seed="all-appearances" appearance={appearance} />);
    expect(screen.getByRole("img")).toHaveAttribute("data-appearance", appearance);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("renders on the server and hydrates with unchanged SVG and definition IDs", async () => {
    const tree = <><Avatar seed="hydrated" /><Avatar seed="hydrated" /></>;
    const markup = renderToString(tree);
    expect(markup).toContain("<svg");
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = markup;
    const before = host.innerHTML;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => { root = hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) }); });
    expect(errors).toEqual([]);
    expect(host.innerHTML).toBe(before);
    await act(async () => { root?.unmount(); });
    host.remove();
  });
});

describe("AvatarGroup", () => {
  it("renders the requested maximum, consistent size, and accessible remaining count", () => {
    render(<AvatarGroup label="Design team" avatars={["Maya", "Alex", "Nora", "Sam"]} max={2} size="lg" />);
    const group = screen.getByRole("group", { name: "Design team: 4 people" });
    expect(within(group).getAllByRole("img")).toHaveLength(3);
    expect(within(group).getByRole("img", { name: "Maya" })).toHaveAttribute("width", "72");
    expect(within(group).getByRole("img", { name: "2 more people" })).toHaveTextContent("+2");
  });

  it("supports object configs, zero visible members, and an empty group", () => {
    const { rerender } = render(<AvatarGroup avatars={[{ name: "Maya", config: generateAvatarConfig("saved") }]} />);
    expect(screen.getByRole("img", { name: "Maya" })).toBeInTheDocument();
    rerender(<AvatarGroup avatars={["Maya"]} max={0} />);
    expect(screen.getByRole("img", { name: "1 more person" })).toHaveTextContent("+1");
    expect(screen.queryByRole("img", { name: "Maya" })).toBeNull();
    rerender(<AvatarGroup avatars={[]} />);
    expect(screen.getByText("No people yet.")).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is server-renderable", () => {
    expect(renderToString(<AvatarGroup avatars={["First", "Second"]} max={1} />)).toContain("1 more person");
  });
});

describe("AvatarEditor", () => {
  it("emits normalized palette changes and waits for the controlled value to update", async () => {
    const user = userEvent.setup();
    const initial = generateAvatarConfig("controlled");
    const nextPalette = (initial.palette + 1) % avatarPalettes.length;
    const onChange = vi.fn();
    const { rerender } = render(<AvatarEditor value={initial} onChange={onChange} />);
    const next = screen.getByRole("radio", { name: avatarPalettes[nextPalette].name });
    await user.click(next);
    const changed = normalizeAvatarConfig({ ...initial, palette: nextPalette });
    expect(onChange).toHaveBeenLastCalledWith(changed);
    expect(next).not.toBeChecked();
    expect(screen.getByRole("radio", { name: avatarPalettes[initial.palette].name })).toBeChecked();
    rerender(<AvatarEditor value={changed} onChange={onChange} />);
    expect(next).toBeChecked();
  });

  it("emits glyph, angle, detail, and shape changes", async () => {
    const user = userEvent.setup();
    const initial = generateAvatarConfig("edit-fields");
    const nextGlyph = avatarGlyphs.find((glyph) => glyph.id !== initial.glyph)!;
    const onChange = vi.fn();
    render(<AvatarEditor value={initial} onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: nextGlyph.name }));
    expect(onChange).toHaveBeenLastCalledWith(normalizeAvatarConfig({ ...initial, glyph: nextGlyph.id }));
    fireEvent.change(screen.getByRole("slider", { name: "Gradient angle" }), { target: { value: "180" } });
    expect(onChange).toHaveBeenLastCalledWith(normalizeAvatarConfig({ ...initial, angle: 180 }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Detail" }), "grid");
    expect(onChange).toHaveBeenLastCalledWith(normalizeAvatarConfig({ ...initial, pattern: "grid" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Shape" }), "circle");
    expect(onChange).toHaveBeenLastCalledWith(normalizeAvatarConfig({ ...initial, shape: "circle" }));
  });

  it("shuffles without mutating the input and resets to the supplied seed default", async () => {
    const user = userEvent.setup();
    const initial = Object.freeze(normalizeAvatarConfig({ ...generateAvatarConfig("changed"), shape: "circle" }));
    const onChange = vi.fn();
    render(<AvatarEditor value={initial} onChange={onChange} seed="original" />);
    await user.click(screen.getByRole("button", { name: "Shuffle avatar" }));
    const shuffled = onChange.mock.lastCall![0] as AvatarConfig;
    expect(shuffled).not.toEqual(initial);
    expect(shuffled.shape).toBe("circle");
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(onChange).toHaveBeenLastCalledWith(generateAvatarConfig("original"));
  });

  it("has one tab stop per picker and supports native arrow-key selection", async () => {
    const user = userEvent.setup();
    const initial = normalizeAvatarConfig({ ...generateAvatarConfig("keyboard-user"), palette: 0, glyph: avatarGlyphs[0].id });
    render(<ControlledEditor initial={initial} />);
    await user.tab();
    expect(screen.getByRole("radio", { name: avatarPalettes[0].name })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: avatarPalettes[1].name })).toBeChecked();
    await user.tab();
    expect(screen.getByRole("radio", { name: avatarGlyphs[0].name })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: avatarGlyphs[1].name })).toBeChecked();
    await user.tab();
    expect(screen.getByRole("slider", { name: "Gradient angle" })).toHaveFocus();
  });

  it("has accessible controls without persisting profile data", async () => {
    const persist = vi.spyOn(Storage.prototype, "setItem");
    const { container } = render(<ControlledEditor />);
    expect(screen.getByRole("region", { name: "Customize your avatar" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Avatar preview" })).toBeInTheDocument();
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Shuffle avatar" }));
    expect(persist).not.toHaveBeenCalled();
  });
});
