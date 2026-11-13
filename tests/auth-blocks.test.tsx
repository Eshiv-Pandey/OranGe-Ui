import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AuthPanel, type AuthMode } from "../components/ui/blocks/auth";
import { ContrastAuth, PlayfulAuth, QuietAuth, StudioAuth } from "../components/ui/blocks/auth-variants";

function authForm() {
  return screen.getByLabelText(/^Email address/).closest("form")!;
}

function fill(fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
  }
}

const layouts = [
  { name: "AuthPanel", Component: AuthPanel, initial: "Good to have you back.", next: "Make room for good work.", signup: false },
  { name: "QuietAuth", Component: QuietAuth, initial: "Welcome to your space.", next: "A fresh beginning.", signup: false },
  { name: "StudioAuth", Component: StudioAuth, initial: "Start something good.", next: "Your next chapter starts here.", signup: false },
  { name: "ContrastAuth", Component: ContrastAuth, initial: "Find your flow.", next: "Make it your own.", signup: false },
  { name: "PlayfulAuth", Component: PlayfulAuth, initial: "Good to meet you.", next: "Come on in.", signup: true },
];

it.each(layouts)("$name uses its own entry copy and switches local account mode", async ({ Component, initial, next, signup }) => {
  const user = userEvent.setup();
  render(<Component />);
  expect(screen.getByRole("heading", { level: 1, name: initial })).toBeVisible();
  expect(Boolean(screen.queryByLabelText(/^Your name/))).toBe(signup);
  const accountActions = within(screen.getByRole("group", { name: "Account action" }));
  expect(accountActions.getByRole("button", { name: signup ? "Create account" : "Sign in" })).toHaveAttribute("aria-pressed", "true");
  await user.click(accountActions.getByRole("button", { name: signup ? "Sign in" : "Create account" }));
  expect(screen.getByRole("heading", { level: 1, name: next })).toBeVisible();
  expect(Boolean(screen.queryByLabelText(/^Your name/))).toBe(!signup);
});

it("leaves controlled navigation to the application and submits recovery without stale credentials", async () => {
  const user = userEvent.setup(), submit = vi.fn(), changeMode = vi.fn();
  const { rerender } = render(<ContrastAuth mode="sign-in" onModeChange={changeMode} onSubmit={submit} />);
  fill({ "Email address": "old@example.com", Password: "old-password" });
  await user.click(screen.getByRole("button", { name: "Show password" }));
  await user.click(screen.getByRole("button", { name: "Forgot password?" }));
  expect(changeMode).toHaveBeenLastCalledWith("recover");
  expect(screen.getByRole("heading", { level: 1, name: "Find your flow." })).toBeVisible();
  expect(screen.getByLabelText(/^Password/)).toHaveValue("old-password");

  rerender(<ContrastAuth mode="recover" onModeChange={changeMode} onSubmit={submit} />);
  expect(screen.getByLabelText(/^Email address/)).toHaveValue("");
  expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();
  fill({ "Email address": "riley@example.com" });
  await user.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(submit).toHaveBeenCalledExactlyOnceWith({ mode: "recover", email: "riley@example.com" });
  expect(await screen.findByRole("status")).toHaveTextContent("Your request is complete.");

  await user.click(screen.getByRole("button", { name: "Back to sign in" }));
  expect(changeMode).toHaveBeenLastCalledWith("sign-in");
  expect(screen.getByRole("button", { name: "Send reset link" })).toBeVisible();
  rerender(<ContrastAuth mode="sign-in" onModeChange={changeMode} onSubmit={submit} />);
  expect(screen.getByLabelText(/^Password/)).toHaveAttribute("type", "password");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("rejects invalid values in every auth mode before calling the application", async () => {
  const submit = vi.fn();
  const { rerender } = render(<AuthPanel mode="sign-in" onSubmit={submit} />);
  const invalid: { mode: AuthMode; fields: Record<string, string>; errors: string[] }[] = [
    { mode: "sign-in", fields: { "Email address": "bad-email" }, errors: ["Enter a valid email address.", "Enter your password."] },
    { mode: "sign-up", fields: { "Your name": "   ", "Email address": "riley@example.com", Password: "short" }, errors: ["Enter your name.", "Use at least 8 characters."] },
    { mode: "recover", fields: { "Email address": "riley@" }, errors: ["Enter a valid email address."] },
    { mode: "verify", fields: { "Email address": "riley@example.com", "Verification code": "12ab34" }, errors: ["Enter the six-digit code."] },
  ];
  for (const entry of invalid) {
    rerender(<AuthPanel mode={entry.mode} onSubmit={submit} />);
    fill(entry.fields);
    fireEvent.submit(authForm());
    for (const message of entry.errors) expect(screen.getByText(message)).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  }
  fill({ "Verification code": "123456" });
  fireEvent.submit(authForm());
  expect(submit).toHaveBeenCalledExactlyOnceWith({ mode: "verify", email: "riley@example.com", code: "123456" });
  expect(await screen.findByRole("status")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("requires separate application callbacks for credentials and providers", async () => {
  const user = userEvent.setup(), provider = vi.fn(), submit = vi.fn();
  const providers = [{ id: "acme", label: "Continue with Acme" }];
  const { rerender } = render(<QuietAuth providers={providers} />);
  const submitButton = within(authForm()).getByRole("button", { name: "Sign in" });
  expect(submitButton).toBeDisabled();
  expect(screen.getByRole("button", { name: "Continue with Acme" })).toBeDisabled();
  fill({ "Email address": "riley@example.com", Password: "secret" });
  fireEvent.submit(authForm());
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  rerender(<QuietAuth providers={providers} onProvider={provider} />);
  expect(submitButton).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Continue with Acme" }));
  expect(provider).toHaveBeenCalledExactlyOnceWith("acme");
  expect(await screen.findByRole("status")).toBeVisible();
  rerender(<QuietAuth providers={providers} onSubmit={submit} />);
  expect(submitButton).toBeEnabled();
  expect(screen.getByRole("button", { name: "Continue with Acme" })).toBeDisabled();
});

it("blocks duplicate and provider requests while pending, then permits retry after rejection", async () => {
  const user = userEvent.setup();
  let reject!: (reason: Error) => void;
  const submit = vi.fn().mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
  const provider = vi.fn();
  render(<StudioAuth onSubmit={submit} providers={[{ id: "acme", label: "Continue with Acme" }]} onProvider={provider} successMessage="Welcome back." />);
  fill({ "Email address": "riley@example.com", Password: "secret" });
  const form = authForm(), button = within(form).getByRole("button", { name: "Sign in" });
  act(() => { fireEvent.submit(form); fireEvent.submit(form); });
  expect(submit).toHaveBeenCalledExactlyOnceWith({ mode: "sign-in", email: "riley@example.com", password: "secret" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(screen.getByLabelText(/^Email address/)).toBeDisabled();
  expect(screen.getByLabelText(/^Password/)).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Continue with Acme" }));
  expect(provider).not.toHaveBeenCalled();

  await act(async () => reject(new Error("Sign in is temporarily unavailable.")));
  expect(screen.getByRole("alert")).toHaveTextContent("Sign in is temporarily unavailable.");
  expect(button).toBeEnabled();
  expect(screen.getByLabelText(/^Email address/)).toBeEnabled();
  expect(screen.getByRole("button", { name: "Continue with Acme" })).toBeEnabled();
  await user.click(button);
  expect(submit).toHaveBeenCalledTimes(2);
  expect(await screen.findByRole("status")).toHaveTextContent("Welcome back.");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("ignores a stale provider failure after changing mode and completing a new request", async () => {
  const user = userEvent.setup();
  let reject!: (reason: Error) => void;
  const provider = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; })), submit = vi.fn();
  render(<PlayfulAuth onSubmit={submit} providers={[{ id: "acme", label: "Continue with Acme" }]} onProvider={provider} />);
  const providerButton = screen.getByRole("button", { name: "Continue with Acme" });
  await user.click(providerButton);
  fireEvent.click(providerButton);
  fireEvent.submit(authForm());
  expect(provider).toHaveBeenCalledExactlyOnceWith("acme");
  expect(submit).not.toHaveBeenCalled();
  expect(providerButton).toBeDisabled();
  await user.click(within(screen.getByRole("group", { name: "Account action" })).getByRole("button", { name: "Sign in" }));
  expect(screen.queryByLabelText(/^Your name/)).not.toBeInTheDocument();
  fill({ "Email address": "riley@example.com", Password: "secret" });
  await user.click(within(authForm()).getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Your request is complete.");
  await act(async () => reject(new Error("An old provider request failed.")));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Your request is complete.");
  expect(screen.getByRole("button", { name: "Continue with Acme" })).toBeEnabled();
});
