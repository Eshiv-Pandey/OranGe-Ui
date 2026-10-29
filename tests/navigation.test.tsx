import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavigationMenu, type NavigationMenuItem } from "../components/ui/navigation-menu";
import { Navbar } from "../components/ui/navbar";
import { Sidebar } from "../components/ui/sidebar";
import { ContextMenu } from "../components/ui/context-menu";
import { HoverCard } from "../components/ui/hover-card";
import { ScrollArea } from "../components/ui/scroll-area";
import { navigationTestBrowser } from "./navigation-browser";

let browser: ReturnType<typeof navigationTestBrowser>;
beforeEach(() => { browser = navigationTestBrowser(); });
afterEach(() => { cleanup(); browser.restore(); });

const links = [{ value: "overview", label: "Overview", href: "#overview" }, { value: "settings", label: "Settings", href: "#settings" }, { value: "locked", label: "Restricted", href: "#restricted", disabled: true }];
const items: NavigationMenuItem[] = [{ value: "resources", label: "Resources", links }, { value: "updates", label: "Updates", href: "#updates" }];
const sections = [{ value: "workspace", label: "Workspace", links }];

describe("NavigationMenu", () => {
  it("opens from the keyboard, traverses links, and restores trigger focus with Escape", async () => {
    const user = userEvent.setup();
    render(<NavigationMenu items={items} activationMode="manual" activeValue="overview" />);
    const trigger = screen.getByRole("button", { name: "Resources" });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus());
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps menu value controlled and preserves router link adapters and disabled links", async () => {
    const user = userEvent.setup(), change = vi.fn(), navigate = vi.fn();
    const renderLink = vi.fn((link, props) => <a {...props} data-router={link.value} />);
    const view = render(<NavigationMenu items={items} value="" onValueChange={change} activationMode="manual" renderLink={renderLink} onNavigate={navigate} />);
    await user.click(screen.getByRole("button", { name: "Resources" }));
    expect(change).toHaveBeenCalledWith("resources");
    expect(screen.queryByRole("link", { name: "Overview" })).toBeNull();
    view.rerender(<NavigationMenu items={items} value="resources" onValueChange={change} activationMode="manual" renderLink={renderLink} onNavigate={navigate} />);
    const overview = screen.getByRole("link", { name: "Overview" });
    expect(overview).toHaveAttribute("data-router", "overview");
    const disabled = screen.getByRole("link", { name: "Restricted" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(disabled).not.toHaveAttribute("href");
    await user.click(overview);
    expect(navigate).toHaveBeenLastCalledWith(links[0]);
  });
});

describe("responsive navigation shells", () => {
  it("opens Navbar's named mobile Sheet, closes on selection, and restores focus", async () => {
    const user = userEvent.setup(), navigate = vi.fn();
    const view = render(<Navbar brand={<a href="#home">Orange studio</a>} items={items} actions={<button>Account</button>} onNavigate={navigate} label="Studio navigation" />);
    const trigger = screen.getByRole("button", { name: "Open studio navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Studio navigation" });
    expect(within(dialog).getByRole("navigation", { name: "Studio navigation mobile" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Account" })).toBeVisible();
    expect(view.container.inert).toBe(true);
    await user.click(within(dialog).getByRole("link", { name: "Settings" }));
    expect(navigate).toHaveBeenCalledWith(links[1]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(view.container.inert).not.toBe(true);
  });

  it("preserves controlled mobile ownership and requests closure when resizing to desktop", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const view = render(<Navbar brand="Orange studio" items={items} mobileOpen={false} onMobileOpenChange={change} />);
    await user.click(screen.getByRole("button", { name: "Open main navigation" }));
    expect(change).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    view.rerender(<Navbar brand="Orange studio" items={items} mobileOpen onMobileOpenChange={change} />);
    expect(screen.getByRole("dialog")).toBeVisible();
    act(() => browser.desktop(true));
    expect(change).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("dialog")).toBeVisible();
    view.rerender(<Navbar brand="Orange studio" items={items} mobileOpen={false} onMobileOpenChange={change} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("supports controlled Sidebar collapse while preserving named links and active state", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const view = render(<Sidebar sections={sections} header={<a href="#home">Workspace home</a>} collapsed={false} onCollapsedChange={change} activeValue="settings" />);
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(change).toHaveBeenCalledWith(true);
    expect(view.container.firstElementChild).toHaveAttribute("data-collapsed", "false");
    view.rerender(<Sidebar sections={sections} header={<a href="#home">Workspace home</a>} collapsed onCollapsedChange={change} activeValue="settings" />);
    expect(screen.queryByRole("link", { name: "Workspace home" })).toBeNull();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("title", "Overview");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Sidebar collapsed");
  });

  it("provides expanded Sidebar links in the mobile Sheet and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<Sidebar sections={sections} defaultCollapsed footer={<button>Sign out</button>} />);
    const trigger = screen.getByRole("button", { name: "Navigation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Workspace navigation" });
    expect(within(dialog).getByRole("link", { name: "Overview" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Sign out" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

describe("ContextMenu", () => {
  const actions = [{ value: "edit", label: "Edit" }, { value: "locked", label: "Locked", disabled: true }, { value: "remove", label: "Remove", destructive: true, separatorBefore: true }];

  it("opens with Shift+F10, skips disabled actions, selects by keyboard, and returns focus", async () => {
    const user = userEvent.setup(), action = vi.fn();
    const view = render(<ContextMenu label="File actions" trigger={<button>Report file</button>} items={actions} onAction={action} />);
    const trigger = screen.getByRole("button", { name: "Report file" });
    await user.tab();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(await screen.findByRole("menu", { name: "File actions" })).toBeVisible();
    expect(view.container.inert).toBe(true);
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Remove" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(action).toHaveBeenCalledWith("remove");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("menu")).toBeNull();
    expect(view.container.inert).not.toBe(true);
  });

  it("opens at the context pointer and respects controlled open and disabled triggers", () => {
    const change = vi.fn();
    const view = render(<ContextMenu trigger={<button>Card</button>} items={actions} open={false} onOpenChange={change} />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "Card" }), { clientX: 90, clientY: 120 });
    expect(change).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).toBeNull();
    view.rerender(<ContextMenu trigger={<button>Card</button>} items={actions} open onOpenChange={change} appearance="terminal" />);
    expect(screen.getByRole("menu")).toHaveAttribute("data-appearance", "terminal");
    view.rerender(<ContextMenu trigger={<button>Card</button>} items={actions} disabled onOpenChange={change} />);
    change.mockClear();
    fireEvent.contextMenu(screen.getByRole("button", { name: "Card" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Card" }), { key: "ContextMenu" });
    expect(change).not.toHaveBeenCalled();
  });
});

describe("HoverCard and ScrollArea", () => {
  it("opens supplementary content on focus, merges descriptions, and dismisses with Escape", async () => {
    const user = userEvent.setup();
    render(<><span id="profile-hint">Open profile</span><HoverCard openDelay={0} closeDelay={0} trigger={<a href="#profile" aria-describedby="profile-hint">River profile</a>}><p>Design systems contributor.</p></HoverCard></>);
    const trigger = screen.getByRole("link", { name: "River profile" });
    await user.tab();
    const card = await screen.findByRole("note");
    expect(card).toHaveTextContent("Design systems contributor");
    expect(trigger.getAttribute("aria-describedby")?.split(" ")).toEqual(["profile-hint", card.id]);
    expect(trigger).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("note")).toBeNull());
    expect(trigger).toHaveAttribute("aria-describedby", "profile-hint");
  });

  it("keeps HoverCard open state controlled", async () => {
    const user = userEvent.setup(), change = vi.fn();
    const view = render(<HoverCard open={false} onOpenChange={change} openDelay={0} trigger={<button>Preview</button>}>Context</HoverCard>);
    await user.tab();
    await waitFor(() => expect(change).toHaveBeenCalledWith(true));
    expect(screen.queryByRole("note")).toBeNull();
    view.rerender(<HoverCard open onOpenChange={change} trigger={<button>Preview</button>}>Context</HoverCard>);
    expect(screen.getByRole("note")).toBeVisible();
  });

  it("exposes a named keyboard focusable viewport and both native scroll axes", async () => {
    const user = userEvent.setup();
    const { container } = render(<ScrollArea label="Build output" orientation="both" type="always" style={{ height: 180 }}><pre>{"Line\n".repeat(40)}</pre></ScrollArea>);
    const viewport = screen.getByRole("region", { name: "Build output" });
    await user.tab();
    expect(viewport).toHaveFocus();
    expect(container.firstElementChild).toHaveStyle({ height: "180px" });
    expect(container.querySelectorAll('.ui-scroll-bar[data-orientation="vertical"]')).toHaveLength(1);
    expect(container.querySelectorAll('.ui-scroll-bar[data-orientation="horizontal"]')).toHaveLength(1);
  });
});
