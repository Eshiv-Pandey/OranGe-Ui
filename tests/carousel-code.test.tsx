import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { Carousel } from "../components/ui/carousel";
import { CodeBlock } from "../components/ui/code-block";
import { NavigationMenu } from "../components/ui/navigation-menu";
import { Navbar } from "../components/ui/navbar";
import { Sidebar } from "../components/ui/sidebar";
import { ContextMenu } from "../components/ui/context-menu";
import { HoverCard } from "../components/ui/hover-card";
import { ScrollArea } from "../components/ui/scroll-area";
import { navigationTestBrowser } from "./navigation-browser";

let browser: ReturnType<typeof navigationTestBrowser>;
beforeEach(() => { browser = navigationTestBrowser(); });
afterEach(() => { cleanup(); browser.restore(); });

const slides = [{ value: "first", label: "First", content: <a href="#first">First article</a> }, { value: "second", label: "Second", content: <input aria-label="Slide notes" /> }, { value: "third", label: "Third", content: <p>Third article</p> }];

describe("manual Carousel", () => {
  it("exposes named slides, keeps inactive slides inert, and controls the endpoints", async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel label="Featured articles" items={slides} />);
    expect(screen.getByRole("region", { name: "Featured articles" })).toHaveAttribute("aria-roledescription", "carousel");
    expect(screen.getByRole("group", { name: "First, 1 of 3" })).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    expect(container.querySelectorAll(".ui-carousel-slide")[1]).toHaveAttribute("inert");
    expect(screen.queryByRole("textbox", { name: "Slide notes" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByRole("textbox", { name: "Slide notes" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    await user.click(screen.getByRole("button", { name: "Go to slide 3: Third" }));
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to slide 3: Third" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps index controlled and handles a shrinking or empty item collection", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const view = render(<Carousel label="Gallery" items={slides} index={1} onIndexChange={change} />);
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(change).toHaveBeenCalledWith(2);
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    view.rerender(<Carousel label="Gallery" items={slides} index={2} onIndexChange={change} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 / 3");
    view.rerender(<Carousel label="Gallery" items={slides.slice(0, 1)} index={2} onIndexChange={change} />);
    expect(screen.getByRole("status")).toHaveTextContent("1 / 1");
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    view.rerender(<Carousel label="Gallery" items={[]} index={NaN} onIndexChange={change} />);
    expect(screen.getByText("No slides to display.")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(view.container.innerHTML).not.toContain("NaN");
  });

  it("supports arrows, Home, End, looping, and RTL without intercepting editing keys", () => {
    const view = render(<Carousel label="Gallery" items={slides} loop />);
    const carousel = screen.getByRole("region", { name: "Gallery" });
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByRole("status")).toHaveTextContent("3 / 3");
    fireEvent.keyDown(carousel, { key: "Home" });
    expect(screen.getByRole("status")).toHaveTextContent("1 / 3");
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Slide notes" }), { key: "ArrowRight" });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    fireEvent.keyDown(carousel, { key: "End" });
    expect(screen.getByRole("status")).toHaveTextContent("3 / 3");
    view.rerender(<Carousel label="Gallery" items={slides} loop dir="rtl" />);
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByRole("status")).toHaveTextContent("1 / 3");
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    expect(view.container.querySelector(".ui-carousel-track")).toHaveStyle({ "--carousel-offset": "100%" });
  });

  it("accepts horizontal touch swipes while preserving vertical scrolling and cancellation", () => {
    const { container } = render(<Carousel label="Touch gallery" items={slides} />);
    const viewport = container.querySelector(".ui-carousel-viewport")!;
    fireEvent.pointerDown(viewport, { pointerType: "touch", pointerId: 7, clientX: 220, clientY: 40 });
    fireEvent.pointerUp(viewport, { pointerType: "touch", pointerId: 7, clientX: 90, clientY: 48 });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    fireEvent.pointerDown(viewport, { pointerType: "touch", pointerId: 8, clientX: 200, clientY: 40 });
    fireEvent.pointerUp(viewport, { pointerType: "touch", pointerId: 8, clientX: 190, clientY: 180 });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    fireEvent.pointerDown(viewport, { pointerType: "touch", pointerId: 9, clientX: 200, clientY: 40 });
    fireEvent.pointerCancel(viewport, { pointerType: "touch", pointerId: 9 });
    fireEvent.pointerUp(viewport, { pointerType: "touch", pointerId: 9, clientX: 30, clientY: 40 });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
    const input = screen.getByRole("textbox", { name: "Slide notes" });
    fireEvent.pointerDown(input, { pointerType: "touch", pointerId: 10, clientX: 200, clientY: 40 });
    fireEvent.pointerUp(input, { pointerType: "touch", pointerId: 10, clientX: 30, clientY: 40 });
    expect(screen.getByRole("status")).toHaveTextContent("2 / 3");
  });
});

describe("CodeBlock and copy leaf", () => {
  it("renders code as escaped text, supports line numbers, and preserves exact copied source", async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const code = "<script>alert('example')</script>\n\tconst value = '&';\n";
    const { container } = render(<CodeBlock code={code} language="tsx" filename="example.tsx" showLineNumbers />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelectorAll(".ui-code-line")).toHaveLength(3);
    expect(container.querySelectorAll(".ui-code-line-number[aria-hidden=true]")).toHaveLength(3);
    expect(screen.getByRole("region", { name: "Source code" })).toHaveAttribute("tabindex", "0");
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(write).toHaveBeenCalledWith(code);
    expect(screen.getByRole("button", { name: "Copied" })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Code copied.");
  });

  it("provides focused selectable code when clipboard writes fail", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Clipboard denied"));
    const code = "const answer = 42;\nanswer;";
    render(<CodeBlock code={code} wrap />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    const fallback = await screen.findByRole("textbox", { name: "Code to copy" });
    expect(fallback).toHaveValue(code);
    expect(fallback).toHaveFocus();
    expect((fallback as HTMLTextAreaElement).selectionStart).toBe(0);
    expect((fallback as HTMLTextAreaElement).selectionEnd).toBe(code.length);
    expect(screen.getByText("Clipboard unavailable. Select and copy the code below.")).toBeVisible();
  });

  it("does not apply an old copy completion to a newly supplied code value", async () => {
    const user = userEvent.setup();
    let resolveCopy: () => void = () => {};
    vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve; }));
    const view = render(<CodeBlock code="old code" />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByRole("button", { name: "Copying..." })).toBeDisabled();
    view.rerender(<CodeBlock code="new code" />);
    await act(async () => resolveCopy());
    expect(screen.getByRole("button", { name: "Copy code" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Copied" })).toBeNull();
    expect(screen.getByRole("region", { name: "Source code" })).toHaveTextContent("new code");
  });

  it("can render a purely static snippet without the copy control", () => {
    const { container } = render(<CodeBlock code="" copy={false} maxHeight={240} wrap />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("data-wrap", "true");
    expect(screen.getByRole("region", { name: "Source code" })).toHaveStyle({ maxHeight: "240px" });
  });
});

describe("appearance and server rendering", () => {
  it.each(APPEARANCE_VALUES)("server-renders all surfaces in %s without browser globals", (appearance) => {
    const links = [{ value: "docs", label: "Docs", href: "/docs" }];
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const html = renderToStaticMarkup(<>
      <NavigationMenu items={links} appearance={appearance} />
      <Navbar brand="Orange studio" items={links} appearance={appearance} />
      <Sidebar sections={[{ value: "resources", links }]} appearance={appearance} />
      <ContextMenu trigger={<button>File</button>} items={[{ value: "open", label: "Open" }]} appearance={appearance} />
      <HoverCard trigger={<a href="/profile">Profile</a>} appearance={appearance}>Supplementary profile</HoverCard>
      <ScrollArea label="Output" appearance={appearance}>Build output</ScrollArea>
      <Carousel label="Gallery" items={slides} appearance={appearance} />
      <CodeBlock code="const answer = 42;" appearance={appearance} />
    </>);
    expect(html).toContain(`data-appearance="${appearance}"`);
    expect(html).toContain("const answer = 42;");
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Output"');
    expect(html).not.toContain("NaN");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    vi.unstubAllGlobals();
  });

  it.each(APPEARANCE_VALUES)("applies %s appearance to portaled contextual surfaces", async (appearance) => {
    const first = render(<ContextMenu trigger={<button>File</button>} items={[{ value: "open", label: "Open" }]} open appearance={appearance} />);
    expect(screen.getByRole("menu")).toHaveAttribute("data-appearance", appearance);
    first.unmount();
    render(<HoverCard trigger={<button>Profile</button>} open appearance={appearance}>Supplementary profile</HoverCard>);
    await waitFor(() => expect(screen.getByRole("note")).toHaveAttribute("data-appearance", appearance));
  });
});
