import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BlueHourFooter } from "../components/ui/blocks/landscape-footers";
import { blocks } from "../lib/blocks";
import { blockRegistryItem, blockSource } from "../lib/block-source";

afterEach(cleanup);

it("keeps all five reference footers first and the original simple footer last", () => {
  expect(blocks.filter(block => block.category === "Footer").map(block => block.slug)).toEqual([
    "blue-hour-footer", "studio-footer", "colony-footer", "hillside-footer", "skyline-footer", "pavilion-footer", "site-footer",
  ]);
});

it("validates newsletter input, prevents duplicate submissions and recovers after rejection", async () => {
  let release: (() => void) | undefined;
  const subscribe = vi.fn().mockRejectedValueOnce(new Error("Please try again.")).mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
  const view = render(<BlueHourFooter />);
  expect(screen.getByRole("button", { name: "Subscribe to studio newsletter" })).toBeDisabled();
  view.rerender(<BlueHourFooter onSubscribe={subscribe} successMessage="Saved." />);
  fireEvent.submit(screen.getByRole("form", { name: "Studio newsletter" }));
  expect(subscribe).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "hello@example.com" } });
  fireEvent.submit(screen.getByRole("form", { name: "Studio newsletter" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Please try again."));
  fireEvent.submit(screen.getByRole("form", { name: "Studio newsletter" }));
  fireEvent.submit(screen.getByRole("form", { name: "Studio newsletter" }));
  expect(subscribe).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Subscribing" })).toBeDisabled();
  release?.();
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved."));
});

it("includes original artwork and font notices in ZIP source and embeds assets in registry transport", async () => {
  for (const slug of ["blue-hour-footer", "studio-footer", "colony-footer", "hillside-footer", "skyline-footer"]) {
    const entry = blocks.find(block => block.slug === slug)!;
    const source = await blockSource(entry);
    expect(source.files["styles/library-base.css"]).toBeDefined();
    const registry = await blockRegistryItem(entry);
    const text = registry.files.map(file => file.content).join("\n");
    expect(text).toContain("data:image/webp;base64,");
    expect(text).toContain("data:font/woff2;base64,");
    expect(text).not.toMatch(/["']\/art\/footer\/|url\(["']?\/fonts\//);
    if (slug === "skyline-footer") expect(source.files["public/portfolio/NOTICE.md"]).toBeDefined();
    else {
      expect(source.files["public/art/footer/NOTICE.md"]).toBeDefined();
      expect(source.files["public/fonts/footer/OFL-cormorant-garamond.txt"]).toBeDefined();
      expect(source.files["public/fonts/footer/OFL-pacifico.txt"]).toBeDefined();
      expect(registry.files.some(file => file.target.endsWith("licenses/FOOTER_ARTWORK.md"))).toBe(true);
    }
  }
}, 30000);
