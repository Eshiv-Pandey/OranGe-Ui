import { render, screen, waitFor } from "@testing-library/react";
import { createPortal } from "react-dom";
import { expect, it, vi } from "vitest";
import { useModalBackground } from "../components/ui/modal-background";
import { Select } from "../components/ui/select";

function Layer({ name, modal = true }: { name: string; modal?: boolean }) {
  const ref = useModalBackground(modal);
  return createPortal(<section ref={ref} data-testid={name}><button>{name}</button></section>, document.body);
}

it("restores native background interaction as nested modal portals close", () => {
  const preexisting = document.createElement("div");
  preexisting.inert = true;
  document.body.append(preexisting);
  const view = render(<Layer name="outer" />);
  expect(view.container.inert).toBe(true);
  view.rerender(<><Layer name="outer" /><Layer name="inner" /></>);
  expect(screen.getByTestId("outer").inert).toBe(true);
  expect(screen.getByTestId("inner").inert).not.toBe(true);
  view.rerender(<Layer name="outer" />);
  expect(screen.getByTestId("outer").inert).not.toBe(true);
  expect(view.container.inert).toBe(true);
  view.unmount();
  expect(view.container.inert).not.toBe(true);
  expect(preexisting.inert).toBe(true);
  preexisting.remove();
});

it("keeps nonmodal popovers and backdrop dismissal interactive", () => {
  const backdrop = document.createElement("div");
  backdrop.className = "ui-overlay";
  document.body.append(backdrop);
  const view = render(<Layer name="popover" modal={false} />);
  expect(view.container.inert).not.toBe(true);
  view.rerender(<Layer name="popover" modal />);
  expect(view.container.inert).toBe(true);
  expect(backdrop.inert).not.toBe(true);
  view.unmount();
  expect(view.container.inert).not.toBe(true);
  backdrop.remove();
});

it("restores the background when Select replaces its popup with detached options", async () => {
  const scrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  const options = [{ value: "studio", label: "Orange studio" }, { value: "personal", label: "Personal space" }];
  const view = render(<Select label="Workspace" options={options} open />);
  try {
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(view.container.inert).toBe(true);
    view.rerender(<Select label="Workspace" options={options} open={false} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(view.container.inert).not.toBe(true);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
    view.rerender(<Select label="Workspace" options={options} open />);
    expect(view.container.inert).toBe(true);
    view.rerender(<Select label="Workspace" options={options} open={false} />);
    expect(view.container.inert).not.toBe(true);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  } finally {
    view.unmount();
    if (scrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollIntoView);
    else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
});
