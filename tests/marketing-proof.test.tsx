import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StackedTestimonials, PortraitTestimonials, InfiniteTestimonials, CollageTestimonials } from "../components/ui/blocks/testimonial-variants";
import { GlassPricing, TicketPricing } from "../components/ui/blocks/pricing-variants";
import { AccordionFaq, FolderFaq, BubbleFaq, PosterFaq } from "../components/ui/blocks/faq-variants";
import { blocks } from "../lib/blocks";
import { components, findComponent } from "../lib/components";

const stories = [{ name: "First Person", role: "Designer", quote: "First story." }, { name: "Second Person", role: "Developer", quote: "Second story." }];
beforeEach(() => vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))));
afterEach(() => vi.unstubAllGlobals());
it.each([StackedTestimonials, PortraitTestimonials])("navigates stories, wraps and handles a shrinking data set", async Component => {
  const user = userEvent.setup(); const { rerender } = render(<Component testimonials={stories} />);
  await user.click(screen.getByRole("button", { name: "Previous testimonial" }));
  expect(screen.getByText("Second story.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next testimonial" }));
  expect(screen.getByText("First story.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Next testimonial" }));
  rerender(<Component testimonials={stories.slice(0, 1)} />);
  expect(screen.getByText("First story.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Next testimonial" })).not.toBeInTheDocument();
});
it("keeps only original stories in the four-row reading tree and exposes pause", async () => {
  const user = userEvent.setup(); const { container, rerender } = render(<InfiniteTestimonials testimonials={stories} />);
  expect([...container.querySelectorAll(".mt-stream-row")].map(row => row.getAttribute("data-direction"))).toEqual(["left", "right", "left", "right"]);
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Pause motion" }));
  expect(screen.getByRole("button", { name: "Resume motion" })).toHaveAttribute("aria-pressed", "true");
  rerender(<InfiniteTestimonials testimonials={stories} animate={false} />);
  expect(screen.queryByRole("button", { name: /motion/ })).not.toBeInTheDocument();
  expect(container.querySelector(".mt-stream-root")).toHaveAttribute("data-animate", "false");
});
it("renders empty testimonial and FAQ collections without invented fallback content", () => {
  render(<>{[StackedTestimonials, CollageTestimonials, PortraitTestimonials, InfiniteTestimonials].map((Component, index) => <Component key={index} testimonials={[]} />)}{[FolderFaq, BubbleFaq, PosterFaq, AccordionFaq].map((Component, index) => <Component key={index} questions={[]} />)}</>);
  expect(screen.getAllByText("No stories to show yet.")).toHaveLength(4);
  expect(screen.getAllByText("No questions to show yet.")).toHaveLength(4);
});
it("selects yearly totals, blocks duplicate requests and recovers from pricing failure", async () => {
  const user = userEvent.setup(); let reject!: (error: Error) => void;
  const choose = vi.fn().mockImplementationOnce(() => new Promise<void>((_, fail) => { reject = fail; })).mockResolvedValue(undefined);
  render(<GlassPricing onChoose={choose} />);
  await user.click(screen.getByRole("button", { name: "Yearly" }));
  expect(screen.getByText("$90.00")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Choose Studio" }));
  expect(choose).toHaveBeenCalledWith("studio", "yearly");
  expect(screen.getByRole("button", { name: "Monthly" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Choose Studio" }));
  expect(choose).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error("Please retry.")));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please retry.");
  await user.click(screen.getByRole("button", { name: "Choose Studio" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Studio selected with yearly billing.");
});
it("keeps services callback-owned and passes the group ticket ID", async () => {
  const user = userEvent.setup(); const choose = vi.fn(); const { rerender } = render(<TicketPricing />);
  expect(screen.getByRole("button", { name: "Choose One hour" })).toBeDisabled();
  rerender(<TicketPricing onChoose={choose} />);
  await user.click(screen.getByRole("button", { name: "Choose Good company" }));
  expect(choose).toHaveBeenCalledWith("team");
  expect(await screen.findByRole("status")).toHaveTextContent("Good company selected.");
});
it("preserves accordion keyboard navigation in its new FAQ section", async () => {
  const user = userEvent.setup(); render(<AccordionFaq defaultOpen={null} />);
  const first = screen.getByRole("button", { name: "Where should I begin?" });
  first.focus(); await user.keyboard("{Enter}"); expect(first).toHaveAttribute("aria-expanded", "true");
  await user.keyboard("{ArrowDown}"); expect(screen.getByRole("button", { name: "Can I bring my team?" })).toHaveFocus();
});
it("orders new blocks before incumbents and keeps legacy accordion source lookup", () => {
  expect(blocks.filter(block => block.category === "Testimonials").map(block => block.slug)).toEqual(["stacked-testimonials", "collage-testimonials", "portrait-testimonials", "infinite-testimonials", "testimonials"]);
  expect(blocks.filter(block => block.category === "Pricing").map(block => block.slug)).toEqual(["glass-pricing", "ticket-pricing", "pricing-section"]);
  expect(blocks.filter(block => block.category === "FAQ").map(block => block.slug)).toEqual(["folder-faq", "bubble-faq", "poster-faq", "accordion-faq", "faq"]);
  expect(components.some(component => component.slug === "accordion")).toBe(false);
  expect(findComponent("accordion")?.file).toBe("components/ui/accordion.tsx");
});
