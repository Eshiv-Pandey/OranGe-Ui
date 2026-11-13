import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DotStats, PulseStats, PosterStats } from "../components/ui/blocks/stats-variants";
import { PosterAnnouncement, ReminderAnnouncement, SceneAnnouncement } from "../components/ui/blocks/announcement-variants";
import { EditorialContact, ChannelContact, SignalContact, PosterContact } from "../components/ui/blocks/contact-variants";
import { CharacterTeam, CollageTeam, FlipTeam, PosterTeam } from "../components/ui/blocks/team-variants";
import { blocks } from "../lib/blocks";

beforeEach(() => vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))));
afterEach(() => vi.unstubAllGlobals());
it("bounds the dot percentage and switches the complete statistics dataset", async () => {
  const user = userEvent.setup(); const { rerender } = render(<DotStats value={150} />);
  expect(screen.getByText("100%")).toBeVisible();
  rerender(<PulseStats />); await user.click(screen.getByRole("button", { name: "This month" }));
  expect(screen.getByText("96K")).toBeVisible(); expect(screen.getByText("$4,160")).toBeVisible();
  expect(screen.getByRole("img", { name: /Work distribution/ })).toHaveAttribute("aria-label", expect.stringContaining("Create: 48%"));
});
it.each([EditorialContact, ChannelContact, SignalContact, PosterContact])("validates contact fields, preserves data on failure and recovers without duplicate submissions", async Component => {
  const user = userEvent.setup(); let reject!: (reason: Error) => void;
  const submit = vi.fn().mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
  render(<Component onSubmit={submit} />);
  const form = screen.getByRole("button", { name: "Send your message" }).closest("form")!;
  fireEvent.submit(form); expect(screen.getByText("Enter your name.")).toBeVisible(); expect(screen.getByLabelText("Your name")).toHaveFocus();
  await user.type(screen.getByLabelText("Your name"), "  Avery  "); await user.type(screen.getByLabelText("Email address"), "avery@example.com"); await user.type(screen.getByLabelText("What are you thinking?"), "  A thoughtful new project.  ");
  fireEvent.submit(form); fireEvent.submit(form); expect(submit).toHaveBeenCalledTimes(1);
  expect(submit).toHaveBeenCalledWith({ name: "Avery", email: "avery@example.com", message: "A thoughtful new project." });
  expect(screen.getByLabelText("Your name")).toBeDisabled(); await act(async () => reject(new Error("Please try again.")));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please try again.");
  expect(screen.getByLabelText("Your name")).toHaveValue("  Avery  ");
  await user.click(screen.getByRole("button", { name: "Send your message" })); expect(await screen.findByRole("status")).toHaveTextContent("Your message is sent.");
});
it.each([PosterAnnouncement, ReminderAnnouncement, SceneAnnouncement])("keeps announcement callbacks owned and handles success", async Component => {
  const user = userEvent.setup(), action = vi.fn(); const { container, rerender } = render(<Component actionLabel="Save my place" />);
  expect(screen.getByRole("button", { name: "Save my place" })).toBeDisabled();
  rerender(<Component onAction={action} actionLabel="Save my place" />); await user.click(screen.getByRole("button", { name: "Save my place" }));
  expect(action).toHaveBeenCalledTimes(1); expect(await screen.findByRole("status")).toHaveTextContent("Your request is complete.");
  expect(container.querySelector("a")).toBeNull();
});
it("lets touch and keyboard users persist a role flip", async () => {
  const user = userEvent.setup(); render(<FlipTeam members={[{ name: "Avery", role: "Designer", bio: "Builds thoughtful things." }]} />);
  const card = screen.getByRole("button", { name: /Avery, Designer/ }); await user.click(card); expect(card).toHaveAttribute("aria-pressed", "true");
  await user.keyboard(" "); expect(card).toHaveAttribute("aria-pressed", "false");
});
it("keeps empty data collections explicit", () => {
  render(<><PulseStats periods={[]} /><PosterStats metrics={[]} />{[CollageTeam, FlipTeam, CharacterTeam, PosterTeam].map((Component, index) => <Component key={index} members={[]} />)}</>);
  expect(screen.getAllByText("No statistics to show yet.")).toHaveLength(2); expect(screen.getAllByText("No team members to show yet.")).toHaveLength(4);
});
it("places every new layout ahead of its incumbent and includes one neobrutalist variant", () => {
  for (const [category, incumbent, expected] of [["Stats", "stats", 4], ["Announcement", "announcement", 4], ["Contact", "contact", 5], ["Team", "team", 5]] as const) {
    const entries = blocks.filter(block => block.category === category); expect(entries).toHaveLength(expected); expect(entries.at(-1)?.slug).toBe(incumbent); expect(entries.some(entry => entry.slug.startsWith("poster-"))).toBe(true);
  }
});
