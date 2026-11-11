import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StickerSocialIcons, SOCIAL_STICKER_PRESETS } from "../components/ui/sticker-social-icons";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
const profiles = SOCIAL_STICKER_PRESETS.map(preset => ({ ...preset, href: `https://example.com/${preset.appearance}` }));

it("provides 25 distinct usable platform stickers, including Substack", () => {
  const { container } = render(<StickerSocialIcons profiles={profiles} />);
  expect(new Set(SOCIAL_STICKER_PRESETS.map(preset => preset.appearance)).size).toBe(25);
  expect(screen.getAllByRole("link")).toHaveLength(25);
  const substack = screen.getByRole("link", { name: "Substack profile" });
  expect(substack).toHaveAttribute("href", "https://example.com/substack");
  expect(substack).toHaveAttribute("rel", "noopener noreferrer");
  expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(50);
});

it("keeps accessible link names when visible platform labels are hidden", () => {
  render(<StickerSocialIcons profiles={profiles} showLabels={false} />);
  expect(screen.getByRole("link", { name: "Substack profile" })).toBeVisible();
  expect(screen.queryByText("Substack")).toBeNull();
  expect(screen.queryByText("Sample profile")).toBeNull();
});

it("opens the optional profile card on keyboard focus and supplies an initials avatar", async () => {
  const user = userEvent.setup();
  render(<StickerSocialIcons profiles={[{ ...profiles.find(profile => profile.appearance === "substack")!, hoverCard: { name: "Sample Studio", handle: "@sample.studio", bio: "A sample notebook.", platform: "Substack", badge: "Sample profile", stats: [{ value: "12", label: "Notes" }] } }]} />);
  await user.tab();
  expect(await screen.findByRole("heading", { name: "Sample Studio" })).toBeVisible();
  expect(screen.getByText("SS")).toBeVisible();
  expect(screen.getByText("Sample profile")).toBeVisible();
  await user.tab();
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Sample Studio" })).toBeNull());
});
