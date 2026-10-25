import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { StatCard, statCardPropsSchema, type StatCardProps } from "../components/ui/stat-card";

const props: StatCardProps = { accent: "lime", counter: "01 / 05", art: <svg viewBox="0 0 8 8"><rect width="8" height="8" /></svg>, title: "Button", subtitle: "A small solid foundation", stats: [{ label: "Variants", value: 3 }, { label: "States", value: 6 }], footer: "Ready to use" };

describe("StatCard", () => {
  it.each(["lime", "mint", "amber", "sky", "coral"] as const)("has accessible %s content", async (accent) => {
    const { container } = render(<StatCard {...props} accent={accent} />);
    expect(screen.getByRole("heading", { name: "Button" })).toBeVisible();
    expect(screen.getAllByRole("term")).toHaveLength(2);
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
  it("creates a single keyboard accessible whole-card link", async () => {
    const user = userEvent.setup();
    const { container } = render(<StatCard {...props} href="#button" />);
    await user.tab();
    const link = screen.getByRole("link");
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute("href", "#button");
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
  it("requires exactly two statistics and safe link destinations", () => {
    expect(statCardPropsSchema.safeParse(props).success).toBe(true);
    expect(statCardPropsSchema.safeParse({ ...props, stats: props.stats.slice(0, 1) }).success).toBe(false);
    expect(statCardPropsSchema.safeParse({ ...props, stats: [...props.stats, props.stats[0]] }).success).toBe(false);
    expect(statCardPropsSchema.safeParse({ ...props, href: "javascript:alert(1)" }).success).toBe(false);
    expect(statCardPropsSchema.safeParse({ ...props, art: () => null }).success).toBe(false);
  });
});
