import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Command } from "../components/ui/command";
import { Pagination } from "../components/ui/pagination";
import { Progress } from "../components/ui/progress";
import { Table } from "../components/ui/table";
import { Alert } from "../components/ui/alert";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";

describe("library state boundaries", () => {
  // Radix observes the hidden native input's size; these tests exercise form state, not layout.
  beforeAll(() => vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} }));
  afterAll(() => vi.unstubAllGlobals());
  it.each(["polished", "pixel"] as const)("preserves external field descriptions and native form values in %s", async (appearance) => {
    const user = userEvent.setup();
    render(<form aria-label="Preferences"><p id="privacy-note">Your choice stays private.</p>
      <Checkbox appearance={appearance} name="updates" label="Product updates" description="A monthly note." aria-describedby="privacy-note" defaultChecked />
      <Switch appearance={appearance} name="quiet" label="Quiet hours" description="Mute notifications." aria-describedby="privacy-note" defaultChecked />
      <Checkbox appearance={appearance} name="unavailable" label="Unavailable option" disabled defaultChecked />
      <button type="reset">Reset preferences</button>
    </form>);
    const checkbox = screen.getByRole("checkbox", { name: "Product updates" });
    const quiet = screen.getByRole("switch", { name: "Quiet hours" });
    const form = screen.getByRole("form") as HTMLFormElement;
    expect(checkbox).toHaveAccessibleDescription("Your choice stays private. A monthly note.");
    expect(quiet).toHaveAccessibleDescription("Your choice stays private. Mute notifications.");
    expect(Object.fromEntries(new FormData(form))).toEqual({ updates: "on", quiet: "on" });
    await user.click(checkbox); await user.click(quiet);
    expect(Object.fromEntries(new FormData(form))).toEqual({});
    await user.click(screen.getByRole("button", { name: "Reset preferences" }));
    expect(checkbox).toBeChecked(); expect(quiet).toBeChecked();
    expect(Object.fromEntries(new FormData(form))).toEqual({ updates: "on", quiet: "on" });
  });
  it("keeps controlled selection owned by the caller and blocks disabled changes", async () => {
    const user = userEvent.setup(); const change = vi.fn();
    const { rerender } = render(<Checkbox label="Updates" checked={false} onCheckedChange={change} />);
    await user.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    rerender(<Checkbox label="Updates" checked disabled onCheckedChange={change} />);
    await user.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
  it("command filters keywords, skips disabled commands, and handles empty results", async () => {
    const user = userEvent.setup(); const choose = vi.fn();
    render(<Command onSelect={choose} items={[{ value: "a", label: "Alpha", keywords: ["first"] }, { value: "b", label: "Beta", disabled: true }, { value: "c", label: "Charlie" }]} />);
    const input = screen.getByRole("combobox"); await user.click(input); await user.keyboard("{ArrowDown}{Enter}"); expect(choose).toHaveBeenLastCalledWith("c");
    await user.type(input, "first"); expect(screen.getAllByRole("option")).toHaveLength(1); await user.keyboard("{Enter}"); expect(choose).toHaveBeenLastCalledWith("a");
    await user.clear(input); await user.type(input, "missing"); expect(screen.getByText("No results found.")).toBeVisible(); await user.keyboard("{Enter}"); expect(choose).toHaveBeenCalledTimes(2);
    await user.keyboard("{Escape}{End}{Enter}"); expect(choose).toHaveBeenLastCalledWith("c");
  });
  it("command gives arbitrary values valid active IDs and reveals keyboard choices", async () => {
    const user = userEvent.setup(); const choose = vi.fn();
    const items = Array.from({ length: 20 }, (_, index) => ({ value: `project ${index + 1}`, label: `Project ${index + 1}` }));
    render(<Command items={items} onSelect={choose} />);
    const input = screen.getByRole("combobox");
    const last = screen.getByRole("option", { name: "Project 20" });
    const reveal = vi.fn(); last.scrollIntoView = reveal;
    await user.click(input); await user.keyboard("{End}");
    const activeId = input.getAttribute("aria-activedescendant")!;
    expect(activeId).not.toMatch(/\s/);
    expect(document.getElementById(activeId)).toBe(last);
    expect(reveal).toHaveBeenCalled();
    await user.keyboard("{Enter}"); expect(choose).toHaveBeenLastCalledWith("project 20");
    await user.type(input, "missing"); expect(screen.getByRole("status")).toHaveTextContent("0 results.");
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });
  it("pagination clamps invalid pages and respects controlled and disabled state", async () => {
    const user = userEvent.setup(); const change = vi.fn(); const { rerender } = render(<Pagination totalPages={8} defaultPage={-4} onPageChange={change} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled(); await user.click(screen.getByRole("button", { name: "Page 8" })); expect(change).toHaveBeenLastCalledWith(8); expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    rerender(<Pagination totalPages={3} page={99} onPageChange={change} />); expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    rerender(<Pagination totalPages={3} page={2} disabled onPageChange={change} />); for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
  it("pagination uses whole finite page numbers for caller-provided values", async () => {
    const user = userEvent.setup(); const change = vi.fn();
    const { rerender } = render(<Pagination totalPages={8.8} page={3.7} onPageChange={change} />);
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(change).toHaveBeenLastCalledWith(4);
    rerender(<Pagination totalPages={8} page={NaN} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    rerender(<Pagination totalPages={Infinity} page={Infinity} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
  it("progress exposes bounded values and valid indeterminate semantics", () => {
    const { rerender } = render(<Progress label="Upload" max={0} value={140} />); expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    rerender(<Progress label="Upload" value={-5} />); expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    rerender(<Progress label="Upload" value={NaN} />); expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });
  it("table sorts numbers, resets pagination, and recovers from removed rows", async () => {
    const user = userEvent.setup(); const rows = [{ id: "1", name: "Zed", count: 12 }, { id: "2", name: "Amy", count: 2 }, { id: "3", name: "Max", count: 5 }];
    const columns = [{ key: "name" as const, header: "Name", sortable: true }, { key: "count" as const, header: "Count", sortable: true }];
    const { rerender } = render(<Table caption="Projects" rows={rows} columns={columns} pageSize={1} />);
    await user.click(screen.getByRole("button", { name: "Next page" })); expect(screen.getByRole("cell", { name: "Amy" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Count" })); expect(screen.getByRole("cell", { name: "2" })).toBeVisible(); expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Count" })); expect(screen.getByRole("cell", { name: "12" })).toBeVisible();
    rerender(<Table caption="Projects" rows={[]} columns={columns} pageSize={1} />); expect(screen.getByText("No records yet.")).toBeVisible(); expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
  it("alert calls dismissal once and removes its contents", () => {
    const dismiss = vi.fn(); render(<Alert title="Saved" dismissible onDismiss={dismiss}>A small win</Alert>); fireEvent.click(screen.getByRole("button", { name: "Dismiss alert" })); expect(dismiss).toHaveBeenCalledOnce(); expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });
});
