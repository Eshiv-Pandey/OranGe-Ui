import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Label } from "../components/ui/label";
import { Kbd } from "../components/ui/kbd";
import { Form } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Combobox } from "../components/ui/combobox";
import { InputOTP } from "../components/ui/input-otp";
import { Calendar } from "../components/ui/calendar";
import { DatePicker } from "../components/ui/date-picker";
import { addCalendarDays, addCalendarMonths, calendarDays, isCalendarDate } from "../components/ui/calendar-date";
import { FileUpload, validateUploadFiles } from "../components/ui/file-upload";
import { Rating } from "../components/ui/rating";
import { Stepper } from "../components/ui/stepper";

const options = [{ value: "alpha", label: "Alpha", keywords: ["first"] }, { value: "beta", label: "Beta", disabled: true }, { value: "gamma", label: "Gamma", description: "Third option" }];
const steps = [{ id: "account", label: "Account" }, { id: "details", label: "Details", disabled: true }, { id: "review", label: "Review" }, { id: "finish", label: "Finish" }];

describe("form primitives", () => {
  it("associates native labels and preserves keyboard semantics", () => {
    render(<><Label htmlFor="name" required>Name</Label><input id="name" /><Kbd>Ctrl</Kbd></>);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute("id", "name");
    expect(screen.getByText("Ctrl").tagName).toBe("KBD");
  });

  it("validates, announces field errors and focuses after controls become enabled", async () => {
    const submit = vi.fn(), user = userEvent.setup();
    render(<Form defaultValues={{ email: "" }} schema={z.object({ email: z.email("Enter a valid email.") })} onSubmit={submit}>{({ field }) => <><Input label="Email" {...field("email")} /><button type="submit">Save</button></>}</Form>);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByLabelText("Email")).toHaveFocus());
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email.")).toHaveAttribute("role", "alert");
    expect(submit).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Email"), "hello@example.com");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ email: "hello@example.com" }));
  });

  it("binds numbers and checkboxes, resets, and prevents overlapping submissions", async () => {
    let resolve: (() => void) | undefined;
    const submit = vi.fn(() => new Promise<void>((done) => { resolve = done; })), user = userEvent.setup();
    const { container } = render(<Form defaultValues={{ quantity: 1, confirmed: false }} schema={z.object({ quantity: z.number().min(1), confirmed: z.boolean() })} onSubmit={submit}>{({ field }) => <><Input type="number" label="Quantity" {...field("quantity")} /><Input type="checkbox" label="Confirmed" {...field("confirmed")} /><button type="submit">Save</button><button type="reset">Reset</button></>}</Form>);
    await user.clear(screen.getByLabelText("Quantity")); await user.type(screen.getByLabelText("Quantity"), "4"); await user.click(screen.getByLabelText("Confirmed"));
    fireEvent.submit(container.querySelector("form")!); fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit).toHaveBeenCalledWith({ quantity: 4, confirmed: true });
    expect(screen.getByLabelText("Quantity")).toBeDisabled();
    await act(async () => { resolve?.(); });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Quantity")).toHaveValue(1); expect(screen.getByLabelText("Confirmed")).not.toBeChecked();
  });

  it("recovers from async submission errors", async () => {
    const user = userEvent.setup();
    render(<Form defaultValues={{ name: "Ada" }} schema={z.object({ name: z.string() })} onSubmit={async () => { throw new Error("Connection lost. Try again."); }}>{({ field }) => <><Input label="Name" {...field("name")} /><button type="submit">Save</button></>}</Form>);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Connection lost. Try again.");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});

describe("combobox", () => {
  it("uses arrow keys, skips disabled options and serializes the option value", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    const { container } = render(<form><Combobox label="Choice" name="choice" options={options} onValueChange={changed} /></form>);
    const input = screen.getByRole("combobox"); input.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(input).toHaveValue("Gamma"); expect(input).toHaveFocus();
    expect(changed).toHaveBeenCalledWith("gamma"); expect(new FormData(container.querySelector("form")!).get("choice")).toBe("gamma");
  });

  it("filters keywords and restores selected text on Escape without changing value", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    render(<Combobox label="Choice" options={options} defaultValue="gamma" onValueChange={changed} />);
    await user.click(screen.getByRole("combobox")); await user.type(screen.getByRole("combobox"), "first");
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument(); expect(screen.queryByRole("option", { name: "Gamma Third option" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}"); expect(screen.getByRole("combobox")).toHaveValue("Gamma"); expect(changed).not.toHaveBeenCalled();
  });

  it("requires an actual selection and clears through the labelled control", async () => {
    const user = userEvent.setup();
    render(<form><Combobox label="Choice" options={options} required /></form>);
    const input = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(input, "something else"); expect(input.checkValidity()).toBe(false); expect(screen.getByText("No matching options.")).toBeInTheDocument();
    await user.clear(input); await user.keyboard("{ArrowDown}{Enter}");
    expect(input.checkValidity()).toBe(true); await user.click(screen.getByRole("button", { name: "Clear choice" }));
    expect(input).toHaveValue(""); expect(input.checkValidity()).toBe(false);
  });

  it("honors controlled values and native reset", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    const { rerender } = render(<Combobox label="Choice" options={options} value="alpha" onValueChange={changed} />);
    await user.click(screen.getByRole("combobox")); await user.keyboard("{End}{Enter}");
    expect(changed).toHaveBeenCalledWith("gamma"); expect(screen.getByRole("combobox")).toHaveValue("Alpha");
    rerender(<form><Combobox label="Reset choice" options={options} defaultValue="alpha" /><button type="reset">Reset</button></form>);
    await user.click(screen.getByRole("combobox")); await user.keyboard("{End}{Enter}"); await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("Alpha"));
  });
});

describe("one-time code", () => {
  it("normalizes pasted codes, uses one native field and announces completion once", () => {
    const complete = vi.fn(), { container } = render(<form><InputOTP name="code" length={6} onComplete={complete} /></form>);
    const input = screen.getByLabelText("Verification code");
    fireEvent.paste(input, { clipboardData: { getData: () => "12-34 56" } });
    expect(input).toHaveValue("123456"); expect(complete).toHaveBeenCalledWith("123456");
    fireEvent.paste(input, { clipboardData: { getData: () => "123456" } }); expect(complete).toHaveBeenCalledTimes(1);
    expect(new FormData(container.querySelector("form")!).get("code")).toBe("123456");
    expect(container.querySelectorAll("input")).toHaveLength(1);
  });

  it("supports ordinary backspace, alphanumeric entry and length validation", async () => {
    const user = userEvent.setup();
    render(<InputOTP label="Access code" length={4} mode="alphanumeric" required />);
    const input = screen.getByRole("textbox", { name: "Access code" });
    await user.type(input, "a2b3"); expect(input).toHaveValue("A2B3"); expect((input as HTMLInputElement).checkValidity()).toBe(true);
    await user.keyboard("{Backspace}"); expect(input).toHaveValue("A2B"); expect((input as HTMLInputElement).checkValidity()).toBe(false);
  });

  it("preserves a read-only code when the user pastes another code", () => {
    const changed = vi.fn(), complete = vi.fn();
    render(<InputOTP defaultValue="246810" readOnly onValueChange={changed} onComplete={complete} />);
    const input = screen.getByRole("textbox", { name: "Verification code" });
    expect(input).toHaveProperty("readOnly", true);
    fireEvent.paste(input, { clipboardData: { getData: () => "12-34 56" } });
    expect(input).toHaveValue("246810"); expect(changed).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
  });
});

describe("calendar dates", () => {
  it("rejects impossible dates and preserves leap years and month boundaries", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true); expect(isCalendarDate("2025-02-29")).toBe(false); expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(addCalendarDays("2024-02-28", 1)).toBe("2024-02-29"); expect(addCalendarDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addCalendarMonths("2024-01-31", 1)).toBe("2024-02-29"); expect(addCalendarMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(calendarDays("2026-10-01", 1)[0]).toBe("2026-09-28");
  });

  it("moves across months by keyboard, skips disabled dates and keeps one tab stop", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    const { container } = render(<Calendar defaultValue="2026-10-31" isDateDisabled={(date) => date === "2026-11-01"} onValueChange={changed} />);
    screen.getByRole("button", { name: "Saturday, October 31, 2026" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Monday, November 2, 2026" })).toHaveFocus();
    expect(screen.getByRole("heading")).toHaveTextContent("November 2026");
    expect(container.querySelectorAll(".ui-calendar-grid button[tabindex='0']")).toHaveLength(1);
    await user.keyboard("{Enter}"); expect(changed).toHaveBeenCalledWith("2026-11-02");
  });

  it("limits navigation and supports PageUp, Home and End", async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue="2026-10-20" min="2026-10-10" max="2026-11-22" weekStartsOn={1} />);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    screen.getByRole("button", { name: "Tuesday, October 20, 2026" }).focus();
    await user.keyboard("{PageDown}"); expect(screen.getByRole("button", { name: "Friday, November 20, 2026" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    await user.keyboard("{Home}"); expect(screen.getByRole("button", { name: "Monday, November 16, 2026" })).toHaveFocus();
    await user.keyboard("{End}"); expect(screen.getByRole("button", { name: "Sunday, November 22, 2026" })).toHaveFocus();
    await user.keyboard("{ArrowRight}"); expect(screen.getByRole("button", { name: "Sunday, November 22, 2026" })).toHaveFocus();
  });

  it("renders deterministic server markup and no selectable dates when disabled", () => {
    expect(renderToString(<Calendar defaultMonth="2026-10-01" />)).toContain("October 2026");
    expect(renderToString(<Calendar />)).toContain("Loading calendar...");
    render(<Calendar defaultMonth="2026-10-01" disabled />);
    expect(screen.getByText("No dates available this month.")).toBeInTheDocument();
    expect(screen.getAllByRole("button").every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
  });

  it("opens date picker on the selected date, serializes ISO and restores trigger focus", async () => {
    const user = userEvent.setup(), { container } = render(<form><DatePicker label="Arrival" name="arrival" defaultValue="2026-10-20" /></form>);
    const trigger = screen.getByRole("button", { name: "Arrival October 20, 2026" });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("button", { name: "Tuesday, October 20, 2026" })).toHaveFocus());
    await user.keyboard("{ArrowRight}{Enter}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(new FormData(container.querySelector("form")!).get("arrival")).toBe("2026-10-21");
    await user.click(trigger); await user.keyboard("{Escape}"); expect(trigger).toHaveFocus();
  });

  it("requires a date and rejects an unavailable controlled value", () => {
    const { container, rerender } = render(<DatePicker label="Arrival" required />);
    const native = container.querySelector<HTMLInputElement>("input")!;
    expect(native.validity.valid).toBe(false);
    rerender(<DatePicker label="Arrival" value="2026-10-05" min="2026-10-10" />);
    expect(native.validity.valid).toBe(false); expect(native).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Arrival October 5, 2026" })).toHaveAttribute("data-invalid", "true");
    expect(screen.getByRole("button", { name: "Arrival October 5, 2026" })).toHaveAccessibleDescription("Choose an available date.");
  });

  it("honors a cancelled form reset and restores its default on an allowed reset", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<form onReset={(event) => event.preventDefault()}><DatePicker label="Arrival" defaultValue="2026-11-12" /><button type="reset">Reset</button></form>);
    await user.click(screen.getByRole("button", { name: "Arrival November 12, 2026" }));
    await user.click(screen.getByRole("button", { name: "Friday, November 13, 2026" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("button", { name: "Arrival November 13, 2026" })).toBeInTheDocument();
    rerender(<form><DatePicker label="Arrival" defaultValue="2026-11-12" /><button type="reset">Reset</button></form>);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Arrival November 12, 2026" })).toBeInTheDocument());
  });
});

describe("file selection", () => {
  it("reports type, size, duplicate and count rejections without discarding valid files", () => {
    const first = new File(["ok"], "first.png", { type: "image/png", lastModified: 1 });
    const second = new File(["ok"], "second.PNG", { type: "image/png", lastModified: 1 });
    const third = new File(["ok"], "third.png", { type: "image/png" });
    const large = new File(["long"], "large.png", { type: "image/png" });
    const wrong = new File(["ok"], "other.txt", { type: "text/plain" });
    const result = validateUploadFiles([wrong, large, first, second, third], [first], { accept: ".png", maxBytes: 3, maxFiles: 2 });
    expect(result.accepted).toEqual([second]); expect(result.rejected.map((item) => item.code)).toEqual(["type", "size", "duplicate", "count"]);
  });

  it("chooses files, announces rejection, removes files and returns to required state", async () => {
    const user = userEvent.setup({ applyAccept: false }), changed = vi.fn();
    render(<FileUpload label="Images" accept="image/*" required maxBytes={3} onFilesChange={changed} />);
    const input = screen.getByLabelText(/^Images/) as HTMLInputElement;
    const file = new File(["ok"], "photo.png", { type: "image/png" });
    await user.upload(input, file); expect(screen.getByText("photo.png")).toBeInTheDocument(); expect(changed).toHaveBeenLastCalledWith([file]);
    await user.upload(input, new File(["too big"], "large.png", { type: "image/png" }));
    expect(screen.getByRole("alert")).toHaveTextContent("large.png: the file exceeds 3 B."); expect(screen.getByText("photo.png")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove photo.png" }));
    expect(changed).toHaveBeenLastCalledWith([]); expect(input.required).toBe(true); expect(screen.queryByText("photo.png")).not.toBeInTheDocument();
  });

  it("accepts drag and drop with the same rules, and blocks disabled selection", () => {
    const changed = vi.fn(), file = new File(["ok"], "note.txt", { type: "text/plain" });
    const { container, rerender } = render(<FileUpload onFilesChange={changed} />);
    const zone = container.querySelector(".ui-upload-zone")!;
    fireEvent.drop(zone, { dataTransfer: { files: [file] } }); expect(changed).toHaveBeenCalledWith([file]);
    rerender(<FileUpload onFilesChange={changed} disabled />);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } }); expect(changed).toHaveBeenCalledTimes(1);
  });
});

describe("rating and stepper", () => {
  it("uses native radio keyboard behavior and submits the selected rating", async () => {
    const user = userEvent.setup(), { container } = render(<form><Rating label="Experience" name="rating" /></form>);
    const one = screen.getByRole("radio", { name: "1 star" }); one.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
    expect(new FormData(container.querySelector("form")!).get("rating")).toBe("3");
  });

  it("clears optional ratings and exposes a read-only score without active controls", async () => {
    const user = userEvent.setup(), { rerender } = render(<Rating defaultValue={4} clearable />);
    await user.click(screen.getByRole("button", { name: "Clear" })); expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    rerender(<Rating value={4} readOnly />); expect(screen.getByRole("img", { name: "4 of 5 stars" })).toBeInTheDocument(); expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("links rating errors to the supported radio group and each native choice", () => {
    render(<Rating label="Experience" required error="Choose a rating." />);
    const group = screen.getByRole("radiogroup", { name: "Experience" });
    expect(group).toHaveAttribute("aria-invalid", "true"); expect(group).toHaveAttribute("aria-required", "true");
    expect(group).toHaveAccessibleDescription("Choose a rating.");
    expect(screen.getByRole("radio", { name: "3 stars" })).toHaveAccessibleDescription("Choose a rating.");
  });

  it("moves step focus past disabled and locked steps before explicit activation", async () => {
    const user = userEvent.setup(), changed = vi.fn();
    render(<Stepper steps={steps} interactive maxUnlockedStep={2} onValueChange={changed} />);
    const nav = screen.getByRole("navigation", { name: "Progress" });
    const account = within(nav).getByRole("button", { name: /Account/ }); account.focus();
    await user.keyboard("{ArrowRight}"); expect(within(nav).getByRole("button", { name: /Review/ })).toHaveFocus(); expect(changed).not.toHaveBeenCalled();
    await user.keyboard("{Enter}"); expect(changed).toHaveBeenCalledWith(2); expect(within(nav).getByRole("button", { name: /Review/ })).toHaveAttribute("aria-current", "step");
    expect(within(nav).getByRole("button", { name: /Finish/ })).toBeDisabled();
    await user.keyboard("{Home}"); expect(account).toHaveFocus();
  });

  it("renders static progress as a list without interactive controls", () => {
    const { container } = render(<Stepper steps={steps} value={2} orientation="vertical" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(4); expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-current="step"]')).toHaveTextContent("Review"); expect(screen.getAllByText(", completed")).toHaveLength(2);
  });
});
