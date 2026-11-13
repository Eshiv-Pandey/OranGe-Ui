import { fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HumanAvatar } from "../components/ui/human-avatar";
import { BloomTrail } from "../components/ui/bloom-trail";
import { BubbleWrap } from "../components/ui/bubble-wrap";
import { JournalStack } from "../components/ui/journal-stack";
import { PhotoGarland } from "../components/ui/photo-garland";
import { FilmStrip } from "../components/ui/film-strip";
import { FocusCards } from "../components/ui/focus-cards";
import { DraggableCards } from "../components/ui/draggable-cards";
import { CipherText } from "../components/ui/cipher-text";
import { WiggleText } from "../components/ui/wiggle-text";
import { FlipBoard } from "../components/ui/flip-board";
import { HaloButton } from "../components/ui/halo-button";
import { FloatingDock } from "../components/ui/floating-dock";
import { MorphInput } from "../components/ui/morph-input";
import { FluidColorPicker } from "../components/ui/fluid-color-picker";
import { fluidColorToHex, hexToFluidColor } from "../components/ui/fluid-color";
import { KEEPSAKE_PHOTOS } from "../components/ui/keepsake-photos";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({ matches: query.includes("reduced-motion"), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { vi.unstubAllGlobals(); delete document.documentElement.dataset.theme; });

describe("reference collection", () => {
  it("renders deterministic human artwork on the server and keeps its overrides independent", () => {
    expect(renderToString(<HumanAvatar seed="friend" />)).toBe(renderToString(<HumanAvatar seed="friend" />));
    expect(renderToString(<HumanAvatar seed="friend" />)).not.toBe(renderToString(<HumanAvatar seed="another-person" />));
    const { rerender } = render(<HumanAvatar hair="wave" expression="happy" skinTone="#c58d66" />);
    const svg = screen.getByRole("img"); expect(svg.querySelector('[fill="#c58d66"]')).not.toBeNull();
    rerender(<HumanAvatar hair="bob" expression="wink" skinTone="#f1d6c2" />);
    expect(screen.getByRole("img")).toBe(svg); expect(svg).toHaveAttribute("data-expression", "wink");
    expect(svg.querySelector('[fill="#f1d6c2"]')).not.toBeNull();
  });

  it("plants and clears flowers through keyboard-equivalent controls", () => {
    const onBloom = vi.fn(), { container } = render(<BloomTrail density={2} onBloom={onBloom} />);
    expect(container.querySelectorAll(".bloom-trail-art > g")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Plant a flower" })); expect(onBloom).toHaveBeenLastCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Clear flowers" })); expect(container.querySelectorAll(".bloom-trail-art > g")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Plant a flower" })); expect(onBloom).toHaveBeenLastCalledWith(1);
  });

  it("pops once per cell, navigates the sheet, and resets without starting audio", () => {
    const onPop = vi.fn(), onReset = vi.fn(), audio = vi.fn(); vi.stubGlobal("AudioContext", audio);
    render(<BubbleWrap rows={2} columns={3} onPop={onPop} onReset={onReset} sound={false} />);
    const first = screen.getByRole("button", { name: "Bubble 1" });
    fireEvent.click(first); fireEvent.click(first); expect(onPop).toHaveBeenCalledTimes(1); expect(onPop).toHaveBeenCalledWith(0, 1);
    fireEvent.keyDown(first, { key: "ArrowDown" }); expect(screen.getByRole("button", { name: "Bubble 4" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("1 / 6 popped");
    fireEvent.click(screen.getByRole("button", { name: "Reset bubble wrap" })); expect(onReset).toHaveBeenCalledOnce(); expect(first).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(first); expect(onPop).toHaveBeenCalledTimes(2); expect(audio).not.toHaveBeenCalled();
  });

  it("keeps a controlled journal selection under caller ownership and handles empty pages", () => {
    const change = vi.fn(), { rerender } = render(<JournalStack photos={KEEPSAKE_PHOTOS.slice(0, 3)} value={1} onValueChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Next journal page" })); expect(change).toHaveBeenCalledWith(2); expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    rerender(<JournalStack photos={KEEPSAKE_PHOTOS.slice(0, 3)} value={2} onValueChange={change} />); expect(screen.getByRole("button", { name: "Next journal page" })).toBeDisabled();
    rerender(<JournalStack photos={[]} />); expect(screen.getByText("Add a photograph to start your journal.")).toBeVisible();
  });

  it.each(["The air felt different up here.", undefined, ""])("names journal pages from visible captions with note %s", (note) => {
    const photo = { ...KEEPSAKE_PHOTOS[0], note };
    render(<JournalStack photos={[photo]} />);
    const caption = [photo.title, note ?? "A moment worth keeping.", "1", "A day to remember", "01", "2"].filter(Boolean).join(" ");
    const page = screen.getByRole("button", { name: caption });
    expect(page).toHaveAccessibleDescription(`Page 1 of 1. Use Left and Right arrow keys to change pages. ${photo.alt}`);
    expect(within(page).getByRole("img", { name: photo.alt })).toBeVisible();
    expect(page).toHaveTextContent(photo.title); if (note !== "") expect(page).toHaveTextContent(note ?? "A moment worth keeping."); expect(page).toHaveTextContent("01");
  });

  it("selects real photo captions in the garland and film strip", () => {
    const selected = vi.fn(), { unmount } = render(<PhotoGarland onSelect={selected} />);
    fireEvent.click(screen.getByRole("button", { name: "View Blue, everywhere" })); expect(selected).toHaveBeenCalledWith(KEEPSAKE_PHOTOS[3]); expect(screen.getByRole("status")).toHaveTextContent("An afternoon worth keeping.");
    unmount(); render(<FilmStrip />); fireEvent.click(screen.getByRole("button", { name: /^Select Off the clock,/ })); expect(screen.getByRole("status")).toHaveTextContent("Somewhere the signal disappears.");
  });

  it("gives focus cards equivalent focus, pointer and pinned selection behavior", () => {
    const { container } = render(<FocusCards />), cards = screen.getAllByRole("button");
    fireEvent.focus(cards[0]); expect(container.querySelectorAll('[data-muted="true"]')).toHaveLength(2);
    fireEvent.blur(cards[0]); expect(container.querySelectorAll('[data-muted="true"]')).toHaveLength(0);
    fireEvent.click(cards[1]); expect(cards[1]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(cards[1]); expect(cards[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("moves and resets draggable cards through the keyboard without leaving their bounds", () => {
    const change = vi.fn(), { container } = render(<DraggableCards items={KEEPSAKE_PHOTOS.slice(0, 2)} onPositionChange={change} />);
    const stage = container.querySelector(".draggable-cards-stage")!, card = screen.getByRole("button", { name: /^A little further/ });
    Object.defineProperties(stage, { clientWidth: { value: 500 }, clientHeight: { value: 400 } }); Object.defineProperties(card, { offsetWidth: { value: 170 }, offsetHeight: { value: 230 } });
    const initial = card.style.left; fireEvent.keyDown(card, { key: "ArrowRight" }); expect(card.style.left).not.toBe(initial); expect(change.mock.lastCall?.[1].x).toBeLessThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Reset card positions" })); expect(card.style.left).toBe(initial);
  });

  it.each(["The air felt different up here.", undefined, ""])("names draggable cards from visible captions with note %s", (note) => {
    const photo = { ...KEEPSAKE_PHOTOS[0], note };
    render(<DraggableCards items={[photo]} />);
    const card = screen.getByRole("button", { name: [photo.title, note].filter(Boolean).join(" ") });
    expect(card).toHaveAccessibleDescription(`Drag a card. Arrow keys move it. Escape puts it back. ${photo.alt}`);
    expect(within(card).getByRole("img", { name: photo.alt })).toBeVisible();
    expect(card.textContent).toBe(`${photo.title} ${note ?? ""}`);
  });

  it("preserves Unicode and completes reduced-motion reveals after text changes", () => {
    const done = vi.fn(), { container, rerender } = render(<CipherText text="नमस्ते 👩🏽‍💻" onComplete={done} />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("नमस्ते 👩🏽‍💻"); expect(done).toHaveBeenCalledOnce();
    rerender(<CipherText text="A new idea" onComplete={done} />); expect(done).toHaveBeenCalledTimes(2); expect(container).toHaveTextContent("A new idea");
  });

  it("isolates SVG displacement definitions between instances and disables them with reduced motion", () => {
    const { container } = render(<><WiggleText>One</WiggleText><WiggleText>Two</WiggleText></>);
    const ids = Array.from(container.querySelectorAll("filter")).map((filter) => filter.id); expect(ids).toHaveLength(10); expect(new Set(ids).size).toBe(10);
    expect(screen.getByText("One")).toHaveStyle({ filter: "none" });
  });

  it("advances a split-flap message manually and reports the complete text", () => {
    const change = vi.fn(); render(<FlipBoard phrases={["HELLO", "WORLD"]} onPhraseChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Next message" })); expect(screen.getByRole("status")).toHaveTextContent("WORLD"); expect(change).toHaveBeenCalledWith("WORLD", 1);
    fireEvent.click(screen.getByRole("button", { name: "Next message" })); expect(screen.getByRole("status")).toHaveTextContent("HELLO");
  });

  it("blocks activation of a disabled or loading halo button", () => {
    const click = vi.fn(), { rerender } = render(<HaloButton onClick={click}>Create</HaloButton>);
    fireEvent.click(screen.getByRole("button")); expect(click).toHaveBeenCalledOnce();
    rerender(<HaloButton loading onClick={click}>Create</HaloButton>); fireEvent.click(screen.getByRole("button")); expect(click).toHaveBeenCalledOnce(); expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("navigates enabled dock items and respects controlled selection", () => {
    const change = vi.fn(); render(<FloatingDock value="a" onValueChange={change} items={[{ id: "a", label: "First", icon: "A" }, { id: "b", label: "Disabled", icon: "B", disabled: true }, { id: "c", label: "Last", icon: "C" }]} />);
    const first = screen.getByRole("button", { name: "First" }), last = screen.getByRole("button", { name: "Last" });
    first.focus(); fireEvent.keyDown(first, { key: "ArrowRight" }); expect(last).toHaveFocus(); fireEvent.click(last); expect(change).toHaveBeenCalledWith("c"); expect(first).toHaveAttribute("aria-pressed", "true");
  });

  it("expands, submits trimmed search text and returns focus on Escape", () => {
    const submit = vi.fn(); render(<MorphInput onSubmit={submit} />);
    fireEvent.click(screen.getByRole("button", { name: "Open search" })); const input = screen.getByRole("searchbox"); expect(input).toHaveFocus(); expect(screen.getByRole("button", { name: "Submit search" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "  cards  " } }); fireEvent.submit(input.closest("form")!); expect(submit).toHaveBeenCalledWith("cards");
    fireEvent.keyDown(input, { key: "Escape" }); expect(screen.getByRole("button", { name: "Open search" })).toHaveFocus(); expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("validates hex input, edits alpha and restores focus when the color picker closes", () => {
    const change = vi.fn(); render(<FluidColorPicker defaultOpen onValueChange={change} />);
    const panel = screen.getByRole("group", { name: "Color controls" }), input = within(panel).getByRole("textbox", { name: "Hex" });
    fireEvent.change(input, { target: { value: "invalid" } }); fireEvent.keyDown(input, { key: "Enter" }); expect(screen.getByRole("alert")).toHaveTextContent("hex digits"); expect(change).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "#00ff0080" } }); fireEvent.keyDown(input, { key: "Enter" }); expect(change.mock.lastCall?.[0]).toBe("#00ff0080");
    fireEvent.change(screen.getByRole("slider", { name: "Opacity" }), { target: { value: "100" } }); expect(change.mock.lastCall?.[0]).toBe("#00ff00");
    fireEvent.keyDown(panel, { key: "Escape" }); expect(screen.getByRole("button", { name: "Find your color" })).toHaveFocus(); expect(screen.queryByRole("group", { name: "Color controls" })).toBeNull();
  });

  it("keeps controlled colors owned by the parent and discards stale hex drafts on slider edits", () => {
    const change = vi.fn(), { rerender } = render(<FluidColorPicker value="#ff8040" defaultOpen onValueChange={change} />);
    const input = screen.getByRole("textbox", { name: "Hex" });
    fireEvent.focus(input); fireEvent.change(input, { target: { value: "#123" } });
    fireEvent.change(screen.getByRole("slider", { name: "Hue" }), { target: { value: "120" } });
    expect(change.mock.lastCall?.[1].h).toBe(120);
    expect(input).toHaveValue("#FF8040");
    rerender(<FluidColorPicker value="#00ff00" defaultOpen onValueChange={change} />);
    expect(input).toHaveValue("#00FF00");
  });

  it("normalizes preset selection and alpha visibility without allowing disabled edits", () => {
    const change = vi.fn(), { rerender } = render(<FluidColorPicker defaultValue="#abc8" swatches={["#aabbcc88", "invalid"]} defaultOpen onValueChange={change} />);
    expect(screen.getByRole("button", { name: "Use #AABBCC88" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Use INVALID" })).toBeNull();
    rerender(<FluidColorPicker value="#aabbcc88" swatches={["#abc8"]} alpha={false} disabled defaultOpen onValueChange={change} />);
    expect(screen.queryByRole("slider", { name: "Opacity" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "Hex" })).toHaveValue("#AABBCC");
    fireEvent.keyDown(screen.getByRole("slider", { name: "Saturation and brightness" }), { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("button", { name: "Use #ABC8" }));
    expect(change).not.toHaveBeenCalled();
  });
});

describe("color conversion", () => {
  it.each(["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000", "#c385f480", "#12ab3400"])("round-trips %s including opacity", (hex) => { expect(fluidColorToHex(hexToFluidColor(hex)!)).toBe(hex); });
  it("expands short colors, rejects malformed values and retains hue at black", () => {
    expect(fluidColorToHex(hexToFluidColor("#f808")!)).toBe("#ff880088"); expect(hexToFluidColor("#gggggg")).toBeNull(); expect(hexToFluidColor("#12")).toBeNull(); expect(hexToFluidColor("#000", 217)?.h).toBe(217); expect(hexToFluidColor("#00ff00")?.h).toBe(120);
  });
});
