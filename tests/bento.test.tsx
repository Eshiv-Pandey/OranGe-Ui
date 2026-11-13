import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { RevenueBento, StudioBento, WildseedBento } from "../components/ui/blocks/bento-variants";

it("changes the actual trend, users and revenue together and handles replaced period data", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<RevenueBento periods={[
    { id: "week", label: "Weekly", revenue: 120, users: 45, growth: "+2%", series: [1, 4, 2] },
    { id: "year", label: "Yearly", revenue: 900, users: 1200, growth: "+9%", series: [5, 8, 13] },
  ]} />);
  expect(screen.getByRole("img", { name: "Weekly revenue trend: 1, 4, 2" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Yearly" }));
  expect(screen.getByRole("img", { name: "Yearly revenue trend: 5, 8, 13" })).toBeVisible();
  expect(screen.getByText("$900")).toBeVisible();
  expect(screen.getByText("1.2K")).toBeVisible();
  expect(screen.getByRole("button", { name: "Yearly" })).toHaveAttribute("aria-pressed", "true");
  rerender(<RevenueBento periods={[]} />);
  expect(screen.getByRole("img", { name: "No revenue trend: no data" })).toBeVisible();
  expect(screen.getByText("$0")).toBeVisible();
  expect(screen.queryByRole("group", { name: "Revenue period" })).not.toBeInTheDocument();
});

it("preserves real destinations and removes demonstration projects when given an empty list", () => {
  const { rerender } = render(<StudioBento projects={[{ name: "Our project", category: "Identity", href: "/work/our-project", art: "sun", color: "lime" }]} action={{ label: "Contact us", href: "/contact" }} />);
  expect(screen.getByRole("link", { name: /Our project/ })).toHaveAttribute("href", "/work/our-project");
  expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
  rerender(<StudioBento projects={[]} />);
  expect(screen.queryByRole("link", { name: /Our project/ })).not.toBeInTheDocument();
});

it("uses supplied branding, copy, photographs and primary destination", () => {
  render(<WildseedBento brand="Our garden" title="Room for growth" images={{ forest: "/forest.jpg" }} action={{ label: "Visit", href: "/visit" }} />);
  expect(screen.getByRole("heading", { name: "Our garden" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Room for growth" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Sunlight through a forest canopy" })).toHaveAttribute("src", "/forest.jpg");
  expect(screen.getByRole("link", { name: "Visit" })).toHaveAttribute("href", "/visit");
});
