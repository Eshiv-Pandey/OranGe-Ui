import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { AuthPanel } from "../components/ui/blocks/auth";
import { PricingSection, IntegrationDirectory } from "../components/ui/blocks/marketing";
import { UploadSection, ContactSection, NewsletterSection } from "../components/ui/blocks/forms";
import { AppShell, WorkspaceOverview, SettingsPanel, NotificationInbox, FocusWidget } from "../components/ui/blocks/workspace";
afterEach(() => vi.useRealTimers());

it("requires application callbacks for service-backed actions", () => {
  render(<><AuthPanel /><ContactSection /><NewsletterSection /><UploadSection /><SettingsPanel /></>);
  for (const name of ["Sign in", "Send your message", "Count me in", "Upload your files", "Save preferences"]) {
    const buttons = screen.getAllByRole("button", { name });
    expect(buttons.some(button => button.hasAttribute("disabled"))).toBe(true);
  }
});
it("validates signup, prevents duplicate requests and handles callback failure", async () => {
  const user = userEvent.setup(); let reject!: (reason: Error) => void;
  const submit = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
  render(<AuthPanel initialMode="sign-up" onSubmit={submit} />);
  fireEvent.submit(screen.getByLabelText(/^Email address/).closest("form")!);
  expect(screen.getByText("Enter your name.")).toBeVisible();
  await user.type(screen.getByLabelText(/^Your name/), "Alex"); await user.type(screen.getByLabelText(/^Email address/), "alex@example.com"); await user.type(screen.getByLabelText(/^Password/), "long-enough");
  const form = screen.getByLabelText(/^Email address/).closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(submit).toHaveBeenCalledTimes(1); expect(submit).toHaveBeenCalledWith({ mode: "sign-up", name: "Alex", email: "alex@example.com", password: "long-enough" });
  await act(async () => reject(new Error("Email already registered.")));
  expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered.");
});
it("switches sign-in to recovery, then controlled verification without stale fields", async () => {
  const user = userEvent.setup(), submit = vi.fn();
  const { rerender } = render(<AuthPanel onSubmit={submit} />);
  await user.type(screen.getByLabelText(/^Password/), "secret");
  await user.click(screen.getByRole("button", { name: "Show password" })); expect(screen.getByLabelText(/^Password/)).toHaveAttribute("type", "text");
  await user.click(screen.getByRole("button", { name: "Forgot password?" }));
  expect(screen.queryByLabelText("Password", { exact: true })).not.toBeInTheDocument();
  await user.type(screen.getByLabelText(/^Email address/), "alex@example.com"); await user.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(submit).toHaveBeenLastCalledWith({ mode: "recover", email: "alex@example.com" });
  rerender(<AuthPanel mode="verify" onSubmit={submit} />);
  await user.type(screen.getByLabelText(/^Email address/), "alex@example.com"); await user.type(screen.getByLabelText(/^Verification code/), "123456"); await user.click(screen.getByRole("button", { name: "Verify code" }));
  expect(submit).toHaveBeenLastCalledWith({ mode: "verify", email: "alex@example.com", code: "123456" });
});
it("selects the displayed yearly plan and keeps billing state explicit", async () => {
  const user = userEvent.setup(), choose = vi.fn(); render(<PricingSection onChoose={choose} />);
  await user.click(screen.getByRole("button", { name: "Yearly" })); expect(screen.getByText("$120")).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Choose better together/ })); expect(choose).toHaveBeenCalledWith("team", "yearly");
});
it("preserves connection state after failure, then allows recovery", async () => {
  const user = userEvent.setup(), toggle = vi.fn().mockRejectedValueOnce(new Error("Try the connection again.")).mockResolvedValue(undefined);
  render(<IntegrationDirectory onToggle={toggle} />); await user.click(screen.getByRole("button", { name: "Connect Calendar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Try the connection again.");
  await user.click(screen.getByRole("button", { name: "Connect Calendar" })); expect(await screen.findByRole("button", { name: "Disconnect Calendar" })).toBeVisible();
});
it("checks file types, size and count before invoking storage", async () => {
  const user = userEvent.setup(), upload = vi.fn(); render(<UploadSection accept=".pdf" maxFiles={1} maxBytes={100} onUpload={upload} />);
  const input = screen.getByLabelText("Choose files to upload");
  fireEvent.change(input, { target: { files: [new File(["image"], "image.png", { type: "image/png" })] } }); expect(screen.getByRole("alert")).toHaveTextContent("Use .pdf files");
  fireEvent.change(input, { target: { files: [new File(["x".repeat(101)], "large.pdf", { type: "application/pdf" })] } }); expect(upload).not.toHaveBeenCalled();
  const file = new File(["pdf"], "note.pdf", { type: "application/pdf" }); fireEvent.change(input, { target: { files: [file] } });
  fireEvent.change(input, { target: { files: [file] } }); expect(screen.getByRole("alert")).toHaveTextContent("Choose up to 1 files");
  await user.click(screen.getByRole("button", { name: "Upload 1 file" })); expect(upload).toHaveBeenCalledWith([file]);
  await user.click(screen.getByRole("button", { name: "Remove note.pdf" })); expect(screen.queryByText("note.pdf")).not.toBeInTheDocument();
});
it("validates and submits contact data, and surfaces newsletter errors", async () => {
  const user = userEvent.setup(), submit = vi.fn(); const { unmount } = render(<ContactSection onSubmit={submit} />);
  await user.click(screen.getByRole("button", { name: "Send your message" })); expect(submit).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText(/^Your name/), "Alex"); await user.type(screen.getByLabelText(/^Email address/), "alex@example.com"); await user.type(screen.getByLabelText("What are you thinking?"), "Hello from the studio.");
  await user.click(screen.getByRole("button", { name: "Send your message" })); expect(submit).toHaveBeenCalledWith({ name: "Alex", email: "alex@example.com", message: "Hello from the studio." });
  unmount(); render(<NewsletterSection onSubscribe={async () => { throw new Error("Subscription unavailable. Try again."); }} />);
  await user.type(screen.getByLabelText(/^Email address/), "alex@example.com"); await user.click(screen.getByRole("button", { name: "Count me in" })); expect(await screen.findByRole("alert")).toHaveTextContent("Subscription unavailable");
});
it("saves actual profile and checkbox preferences and restores controls after failure", async () => {
  const user = userEvent.setup(), save = vi.fn().mockRejectedValueOnce(new Error("Save unavailable. Try again.")).mockResolvedValue(undefined);
  render(<SettingsPanel onSave={save} />); await user.clear(screen.getByLabelText(/^Your name/)); await user.type(screen.getByLabelText(/^Your name/), "Riley"); await user.click(screen.getByRole("checkbox", { name: /A weekly perspective/ }));
  await user.click(screen.getByRole("button", { name: "Save preferences" })); expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable");
  await user.click(screen.getByRole("button", { name: "Save preferences" })); await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save).toHaveBeenLastCalledWith({ name: "Riley", email: "alex@example.com", notifications: true, digest: true });
});
it("does not mark failed notifications read and empties the unread view after recovery", async () => {
  const user = userEvent.setup(), read = vi.fn().mockRejectedValueOnce(new Error("Could not save read state.")).mockResolvedValue(undefined);
  render(<NotificationInbox onRead={read} />); await user.click(screen.getByRole("button", { name: "Unread" })); await user.click(screen.getByRole("button", { name: "Mark all as read" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save"); expect(screen.getByText("A little hello from Riley")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Mark all as read" })); expect(await screen.findByText("All caught up.")).toBeVisible(); expect(read).toHaveBeenLastCalledWith(["welcome", "complete"]);
});
it("distinguishes day and project views and filters project ownership", async () => {
  const user = userEvent.setup(); const { unmount } = render(<AppShell />);
  expect(screen.getByRole("heading", { name: "Your day, Alex." })).toBeVisible(); await user.click(screen.getByRole("button", { name: "Projects" }));
  expect(screen.getByRole("heading", { name: "Hello, Alex." })).toBeVisible(); unmount(); render(<WorkspaceOverview />);
  await user.click(screen.getByRole("button", { name: "My projects" })); expect(screen.queryByText("The everyday journal")).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Search projects"), "unknown"); expect(screen.getByText("Try another project name.")).toBeVisible();
});
it("uses wall time, pauses, resets and completes only once", async () => {
  vi.useFakeTimers(); const complete = vi.fn(); render(<FocusWidget duration={3} onComplete={complete} />);
  fireEvent.click(screen.getByRole("button", { name: "Make a little progress" })); act(() => vi.advanceTimersByTime(1000)); expect(screen.getByRole("timer")).toHaveAccessibleName("0 minutes 2 seconds remaining");
  fireEvent.click(screen.getByRole("button", { name: "Take a pause" })); act(() => vi.advanceTimersByTime(10000)); expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Make a little progress" })); act(() => vi.advanceTimersByTime(5000)); expect(complete).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Reset focus timer" })); expect(screen.getByRole("timer")).toHaveAccessibleName("0 minutes 3 seconds remaining");
});
