import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonPropsSchema } from "../components/ui/button";
import { Input, inputPropsSchema } from "../components/ui/input";

describe("Button", () => {
  it("defaults to a non-submitting button and activates from the keyboard", async () => {
    const click = vi.fn();
    render(<Button onClick={click}>Get started</Button>);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: "Get started" })).toHaveFocus();
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    await user.keyboard("{Enter}");
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("keeps its accessible name while loading and prevents repeated actions", async () => {
    const click = vi.fn();
    render(<Button loading onClick={click}>Save changes</Button>);
    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(click).not.toHaveBeenCalled();
  });

  it("renders an actual navigation link with Slot and prevents a disabled link", async () => {
    const click = vi.fn();
    render(<Button asChild disabled onClick={click}><a href="#components">Browse components</a></Button>);
    const link = screen.getByRole("link", { name: "Browse components" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    await userEvent.click(link);
    expect(click).not.toHaveBeenCalled();
  });

  it.each([{ disabled: true }, { loading: true }])("blocks child handlers and overrides child availability props for %o", async (state) => {
    const click = vi.fn();
    const capture = vi.fn();
    const key = vi.fn();
    render(<Button asChild {...state}><a href="#components" aria-disabled={false} tabIndex={0} onClick={click} onClickCapture={capture} onKeyDown={key}>Browse components</a></Button>);
    const link = screen.getByRole("link", { name: "Browse components" });
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabindex", "-1");
    await userEvent.click(link);
    fireEvent.keyDown(link, { key: "Enter" });
    expect(click).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    expect(key).not.toHaveBeenCalled();
  });

  it("preserves child cancellation and non-submitting behavior with Slot", async () => {
    const parentClick = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={submit}><Button asChild onClick={parentClick}><button onClick={(event) => event.preventDefault()}>Compose action</button></Button></form>);
    const button = screen.getByRole("button", { name: "Compose action" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(parentClick).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  it("supports native button refs and disabled slotted buttons", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<><Button ref={ref}>Native</Button><Button asChild disabled><button disabled={false}>Slotted</button></Button></>);
    ref.current?.focus();
    expect(screen.getByRole("button", { name: "Native" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Slotted" })).toBeDisabled();
  });

  it("has no accessibility violations across variants and loading states", async () => {
    const { container } = render(<main>{(["primary", "secondary", "ghost"] as const).map((variant) => <div key={variant}>
      <Button variant={variant}>{variant} action</Button>
      <Button variant={variant} disabled>Unavailable</Button>
      <Button variant={variant} loading>Saving changes</Button>
    </div>)}</main>);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("validates the supported variants", () => {
    expect(buttonPropsSchema.safeParse({ variant: "primary", loading: true }).success).toBe(true);
    expect(buttonPropsSchema.safeParse({ variant: "danger" }).success).toBe(false);
    expect(buttonPropsSchema.safeParse({ children: ["Valid", { invalid: true }] }).success).toBe(false);
  });
});

describe("Input", () => {
  it("associates its label, description, error, and required state", () => {
    render(<Input label="Email" type="email" description="Your contact address." error="Enter a valid address." required />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Your contact address. Enter a valid address.");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid address.");
  });

  it("generates unique identifiers and preserves caller descriptions", () => {
    render(<><span id="extra">Additional context.</span><Input label="First" aria-describedby="extra" description="First field." /><Input label="Second" /></>);
    const first = screen.getByRole("textbox", { name: "First" });
    const second = screen.getByRole("textbox", { name: "Second" });
    expect(first.id).not.toBe(second.id);
    expect(first).toHaveAccessibleDescription("Additional context. First field.");
  });

  it("supports typing, read only values, and disabled controls", async () => {
    const onChange = vi.fn();
    render(<><Input label="Name" onChange={onChange} /><Input label="Fixed" value="oRangeUi" readOnly /><Input label="Unavailable" disabled /></>);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Orange");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Orange");
    expect(onChange).toHaveBeenCalledTimes(6);
    expect(screen.getByRole("textbox", { name: "Unavailable" })).toBeDisabled();
  });

  it("supports native input refs and visually hidden labels", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Search components" hideLabel placeholder="Search components..." />);
    ref.current?.focus();
    expect(screen.getByRole("textbox", { name: "Search components" })).toHaveFocus();
  });

  it("has no accessibility violations across field states", async () => {
    const { container } = render(<main>
      <Input label="Name" />
      <Input label="Search" icon={<svg viewBox="0 0 16 16"><rect width="8" height="8" /></svg>} />
      <Input label="Email" error="Enter a valid address." />
      <Input label="Unavailable" disabled />
      <Input label="Loading search" loading />
    </main>);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("validates text and callback props", () => {
    expect(inputPropsSchema.safeParse({ label: "Email", value: "hello", onChange: () => {} }).success).toBe(true);
    expect(inputPropsSchema.safeParse({ error: 2 }).success).toBe(false);
  });
});
