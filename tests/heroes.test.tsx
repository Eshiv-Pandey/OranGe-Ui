import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { OddkinHero, PlaygroundHero, WovenHero } from "../components/ui/blocks/hero-variants";

it("keeps supplied navigation and primary destinations and exposes one readable title", () => {
  render(<PlaygroundHero title={"Make\nsomething."} brand="Our studio" navigation={[{ label: "Work", href: "/work" }]} primaryAction={{ label: "Get in touch", href: "/contact" }} secondaryAction={{ label: "Our team", href: "/team" }} />);
  expect(screen.getByRole("heading", { level: 1, name: "Make something." })).toBeVisible();
  expect(screen.getByRole("navigation", { name: "Our studio navigation" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work");
  expect(screen.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "/contact");
  expect(screen.getByRole("link", { name: "Our team" })).toHaveAttribute("href", "/team");
});

it("preserves supplied artwork and content without inventing extra navigation", () => {
  const { container, rerender } = render(<WovenHero imageSrc="/our-material.webp" title="Our next chapter" primaryAction={{ label: "Read the story", href: "/story" }} />);
  expect(container.querySelector(".sb-woven-material")).toHaveAttribute("src", "/our-material.webp");
  expect(screen.getByRole("heading", { name: "Our next chapter" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Read the story" })).toHaveAttribute("href", "/story");
  rerender(<OddkinHero primaryAction={{ label: "Find us", href: "/visit" }} note="Every idea is welcome." />);
  expect(screen.getByRole("link", { name: "Find us" })).toHaveAttribute("href", "/visit");
  expect(screen.getByText("Every idea is welcome.")).toBeVisible();
});
