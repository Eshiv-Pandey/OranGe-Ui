import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpringDeck } from "../components/ui/spring-deck";
import { CascadeMenu } from "../components/ui/cascade-menu";
import { ChoiceDial } from "../components/ui/choice-dial";
import { ApertureGallery } from "../components/ui/aperture-gallery";
import { KineticImage } from "../components/ui/kinetic-elements";

const photos = [{ id: "lake", image: "/lake.jpg", alt: "A still lake", title: "Lake", description: "A quiet afternoon." }, { id: "forest", image: "/forest.jpg", alt: "A green forest", title: "Forest", description: "Off the clock." }, { id: "coast", image: "/coast.jpg", alt: "A blue coast", title: "Coast" }];
const choices = [{ id: "design", label: "Design" }, { id: "code", label: "Code", disabled: true }, { id: "photo", label: "Photography" }, { id: "writing", label: "Writing" }];
const links = [{ id: "work", label: "Work", href: "#work" }, { id: "about", label: "About", href: "#about" }];

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { callback(0); return 1; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => { vi.unstubAllGlobals(); document.body.style.overflow = ""; });

describe("original kinetic components", () => {
  it("renders useful initial content without a browser animation loop", () => {
    expect(renderToString(<SpringDeck items={photos} />)).toContain("A quiet afternoon.");
    expect(renderToString(<ChoiceDial options={choices} />)).toContain("aria-activedescendant");
    expect(renderToString(<ApertureGallery items={photos} />)).toContain("A still lake");
    expect(renderToString(<CascadeMenu items={links} />)).toContain("aria-expanded=\"false\"");
  });
  it("browses and focuses the photo hand with keys and respects its ends", () => {
    const change = vi.fn(); render(<SpringDeck items={photos} onValueChange={change} />);
    expect(screen.getByRole("button", { name: "Previous photo" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("button", { name: "Select Lake" }), { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Select Forest" })).toHaveFocus();
    expect(change).toHaveBeenLastCalledWith("forest");
    fireEvent.keyDown(screen.getByRole("button", { name: "Select Forest" }), { key: "End" });
    expect(screen.getByRole("button", { name: "Next photo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select Coast" })).toHaveAttribute("aria-pressed", "true");
  });
  it("reports requests without mutating controlled photo selection", () => {
    const change = vi.fn(), { rerender } = render(<SpringDeck items={photos} value="lake" onValueChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(change).toHaveBeenCalledWith("forest"); expect(screen.getByRole("button", { name: "Select Lake" })).toHaveAttribute("aria-pressed", "true");
    rerender(<SpringDeck items={photos.slice(1)} value="lake" onValueChange={change} />);
    expect(screen.getByRole("button", { name: "Select Forest" })).toHaveAttribute("aria-pressed", "true");
  });
  it("opens native navigation, closes on Escape and restores focus", async () => {
    const user = userEvent.setup(); render(<CascadeMenu items={links} />);
    const trigger = screen.getByRole("button", { name: "Explore" }); trigger.focus(); await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true"); expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
    await user.keyboard("{Escape}"); expect(trigger).toHaveAttribute("aria-expanded", "false"); expect(trigger).toHaveFocus();
  });
  it("traps full-screen focus and restores pre-existing page overflow", async () => {
    document.body.style.overflow = "clip";
    const user = userEvent.setup(), { unmount } = render(<CascadeMenu items={links} fullScreen />);
    await user.click(screen.getByRole("button", { name: "Explore" }));
    const dialog = screen.getByRole("dialog", { name: "Site navigation" }); expect(document.body.style.overflow).toBe("hidden");
    const close = within(dialog).getByRole("button", { name: "Close menu" });
    await user.keyboard("{Shift>}{Tab}{/Shift}"); expect(within(dialog).getByRole("link", { name: "About" })).toHaveFocus();
    await user.keyboard("{Tab}"); expect(close).toHaveFocus();
    unmount(); expect(document.body.style.overflow).toBe("clip");
  });
  it("reports a controlled menu-close request from native link activation", () => {
    const close = vi.fn(), navigate = vi.fn(); render(<CascadeMenu items={links} open onOpenChange={close} onNavigate={navigate} />);
    fireEvent.click(screen.getByRole("link", { name: "Work" }));
    expect(close).toHaveBeenCalledWith(false); expect(navigate).toHaveBeenCalledWith(links[0]);
    expect(screen.getByRole("button", { name: "Explore" })).toHaveAttribute("aria-expanded", "true");
  });
  it("skips disabled dial options and supports typeahead and boundary keys", () => {
    const change = vi.fn(); render(<ChoiceDial options={choices} onValueChange={change} />);
    const wheel = screen.getByRole("listbox");
    fireEvent.keyDown(wheel, { key: "ArrowDown" }); expect(change).toHaveBeenLastCalledWith("photo");
    fireEvent.keyDown(wheel, { key: "End" }); expect(screen.getByRole("option", { name: "Writing" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(wheel, { key: "d" }); expect(screen.getByRole("option", { name: "Design" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Previous option" })).toBeDisabled();
  });
  it("returns wheel scrolling to the page at a non-looping boundary", () => {
    render(<ChoiceDial options={choices} />); const wheel = screen.getByRole("listbox");
    const outward = new WheelEvent("wheel", { deltaY: -80, cancelable: true }); wheel.dispatchEvent(outward); expect(outward.defaultPrevented).toBe(false);
    const inward = new WheelEvent("wheel", { deltaY: 80, cancelable: true }); fireEvent(wheel, inward); expect(inward.defaultPrevented).toBe(true); expect(screen.getByRole("option", { name: "Photography" })).toHaveAttribute("aria-selected", "true");
  });
  it("enables wheel selection after options load or become available", () => {
    const change = vi.fn(), { rerender } = render(<ChoiceDial options={[]} onValueChange={change} />);
    rerender(<ChoiceDial options={choices} onValueChange={change} />);
    fireEvent.wheel(screen.getByRole("listbox"), { deltaY: 80 });
    expect(change).toHaveBeenLastCalledWith("photo");
    rerender(<ChoiceDial options={choices.map(option => ({ ...option, disabled: true }))} onValueChange={change} />);
    rerender(<ChoiceDial options={choices} onValueChange={change} />);
    fireEvent.wheel(screen.getByRole("listbox"), { deltaY: 80 });
    expect(change).toHaveBeenLastCalledWith("writing");
  });
  it("keeps dial selection controlled and removes its wheel listener on unmount", () => {
    const change = vi.fn(), { unmount } = render(<ChoiceDial options={choices} value="design" onValueChange={change} />);
    const wheel = screen.getByRole("listbox"), remove = vi.spyOn(wheel, "removeEventListener");
    fireEvent.keyDown(wheel, { key: "ArrowDown" }); expect(change).toHaveBeenCalledWith("photo"); expect(screen.getByRole("option", { name: "Design" })).toHaveAttribute("aria-selected", "true");
    unmount(); expect(remove).toHaveBeenCalledWith("wheel", expect.any(Function));
  });
  it("opens gallery panels and updates their caption with keyboard focus", () => {
    const change = vi.fn(); render(<ApertureGallery items={photos} onValueChange={change} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Show Lake" }), { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Show Forest" })).toHaveFocus(); expect(screen.getByRole("button", { name: "Show Forest" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Off the clock.")).toBeInTheDocument(); expect(change).toHaveBeenCalledWith("forest");
  });
  it("shows explicit empty states and recovers from unavailable images", () => {
    const { rerender } = render(<ChoiceDial options={choices.map(option => ({ ...option, disabled: true }))} />);
    expect(screen.getByText("No available options.")).toBeInTheDocument();
    rerender(<SpringDeck items={[]} />); expect(screen.getByText("Add photos to start your collection.")).toBeInTheDocument();
    rerender(<ApertureGallery items={[]} />); expect(screen.getByText("Add images to open your gallery.")).toBeInTheDocument();
    rerender(<KineticImage src="/missing.jpg" alt="A place" />); fireEvent.error(screen.getByRole("img")); expect(screen.getByRole("img", { name: "A place" })).toHaveTextContent("Image unavailable");
    rerender(<KineticImage src="/working.jpg" alt="A new place" />); expect(screen.getByRole("img", { name: "A new place" })).toHaveAttribute("src", "/working.jpg");
  });
});
