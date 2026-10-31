import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "@/components/ui/appearance";
import { generateHelmetConfig, HELMET_PALETTES, type HelmetConfig } from "@/components/ui/helmet-art";
import * as exportTools from "@/components/ui/svg-export";
import { HelmetEditor } from "../components/ui/helmet-editor";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.spyOn(exportTools, "downloadArtwork").mockImplementation(() => {});
  vi.spyOn(exportTools, "svgToPng").mockResolvedValue(new Blob(["png"], { type: "image/png" }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function textFromBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

describe("HelmetEditor controlled configuration", () => {
  it("emits visor changes and waits for the parent to update saved configuration", async () => {
    const user = userEvent.setup();
    const initial = generateHelmetConfig("controlled");
    Object.freeze(initial.parts); Object.freeze(initial.colors); Object.freeze(initial);
    const change = vi.fn<(value: HelmetConfig) => void>();
    const view = render(<HelmetEditor value={initial} onChange={change} />);
    const visor = screen.getByRole("button", { name: /Motorsport helmet, number .*: open visor/ });
    await user.click(visor);
    expect(change).toHaveBeenLastCalledWith({ ...initial, parts: { ...initial.parts, visorOpen: true } });
    expect(visor).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("checkbox", { name: "Visor open" })).not.toBeChecked();
    const next = change.mock.calls.at(-1)![0];
    view.rerender(<HelmetEditor value={next} onChange={change} />);
    expect(screen.getByRole("button", { name: /Motorsport helmet, number .*: close visor/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("checkbox", { name: "Visor open" })).toBeChecked();
    expect(initial.parts.visorOpen).toBe(false);
  });

  it("offers every design field, preserves controlled ownership, and accepts the complete number range", async () => {
    const user = userEvent.setup();
    const initial = { ...generateHelmetConfig("fields"), number: "007" };
    const change = vi.fn<(value: HelmetConfig) => void>();
    render(<HelmetEditor value={initial} onChange={change} />);
    const pattern = initial.parts.pattern === "bands" ? "chevron" : "bands";
    const finish = initial.parts.finish === "chrome" ? "matte" : "chrome";
    await user.selectOptions(screen.getByRole("combobox", { name: "Pattern" }), pattern);
    expect(change.mock.calls.at(-1)![0].parts.pattern).toBe(pattern);
    expect(screen.getByRole("combobox", { name: "Pattern" })).toHaveValue(initial.parts.pattern);
    await user.selectOptions(screen.getByRole("combobox", { name: "Finish" }), finish);
    expect(change.mock.calls.at(-1)![0].parts.finish).toBe(finish);
    const number = screen.getByRole("slider", { name: "Fictional number" });
    expect(number).toHaveAttribute("min", "0");
    expect(number).toHaveAttribute("max", "999");
    expect(number).toHaveAttribute("aria-valuetext", "007");
    fireEvent.change(number, { target: { value: "0" } });
    expect(change.mock.calls.at(-1)![0].number).toBe("0");
    fireEvent.change(number, { target: { value: "999" } });
    expect(change.mock.calls.at(-1)![0].number).toBe("999");
    await user.click(screen.getByRole("checkbox", { name: "Vents" }));
    expect(change.mock.calls.at(-1)![0].parts.vents).toBe(false);
    await user.click(screen.getByRole("checkbox", { name: "Visor open" }));
    expect(change.mock.calls.at(-1)![0].parts.visorOpen).toBe(true);
    expect(initial.number).toBe("007");
  });

  it("edits all six colors and named palettes without dropping other saved fields", async () => {
    const user = userEvent.setup();
    const initial = generateHelmetConfig("color-fields");
    const change = vi.fn<(value: HelmetConfig) => void>();
    render(<HelmetEditor value={initial} onChange={change} />);
    await user.click(screen.getByRole("tab", { name: "Colors" }));
    for (const [key, label] of [["shell", "Shell"], ["stripe", "Primary stripe"], ["stripeAlt", "Alternate stripe"], ["visor", "Visor"], ["trim", "Trim"], ["eye", "Eye"]] as const) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: "#123456" } });
      expect(change).toHaveBeenLastCalledWith({ ...initial, colors: { ...initial.colors, [key]: "#123456" } });
    }
    await user.selectOptions(screen.getByRole("combobox", { name: "Helmet palette" }), "2");
    expect(change).toHaveBeenLastCalledWith({ ...initial, colors: { ...HELMET_PALETTES[2].colors } });
    expect(change.mock.calls.at(-1)![0].number).toBe(initial.number);
    expect(change.mock.calls.at(-1)![0].parts).toEqual(initial.parts);
  });

  it("keeps preview size, pointer, and blink preferences out of configuration edits", async () => {
    const user = userEvent.setup();
    const initial = generateHelmetConfig("motion-options");
    const change = vi.fn<(value: HelmetConfig) => void>();
    const { container } = render(<HelmetEditor value={initial} onChange={change} />);
    await user.click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.change(screen.getByRole("slider", { name: "Preview size" }), { target: { value: "160" } });
    await user.click(screen.getByRole("checkbox", { name: "Follow pointer" }));
    await user.click(screen.getByRole("checkbox", { name: "Blink" }));
    expect(container.querySelector(".helmet-svg")).toHaveAttribute("width", "160");
    expect(screen.getByRole("img", { name: /Motorsport helmet, number .*, visor closed/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Motorsport helmet, number / })).toBeNull();
    expect((container.querySelector(".helmet") as HTMLElement).style.getPropertyValue("--blink-scale")).toBe("1");
    expect(change).not.toHaveBeenCalled();
    expect(JSON.parse((screen.getByLabelText("Configuration JSON") as HTMLTextAreaElement).value)).toEqual(initial);
    await user.click(screen.getByRole("tab", { name: "Design" }));
    await user.click(screen.getByRole("tab", { name: "Motion" }));
    expect(screen.getByRole("slider", { name: "Preview size" })).toHaveValue("160");
    expect(screen.getByRole("checkbox", { name: "Follow pointer" })).not.toBeChecked();
  });

  it("uses current string or number seed for reset and randomize without resetting controlled value on prop changes", async () => {
    const user = userEvent.setup();
    const initial = generateHelmetConfig("persisted");
    const change = vi.fn<(value: HelmetConfig) => void>();
    const view = render(<HelmetEditor value={initial} onChange={change} seed={42} />);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(change).toHaveBeenLastCalledWith(generateHelmetConfig(42));
    await user.click(screen.getByRole("button", { name: "Randomize" }));
    expect(change).toHaveBeenLastCalledWith(generateHelmetConfig("42:random:1"));
    change.mockClear();
    view.rerender(<HelmetEditor value={initial} onChange={change} seed="next-seed" />);
    expect(change).not.toHaveBeenCalled();
    expect(JSON.parse((screen.getByLabelText("Configuration JSON") as HTMLTextAreaElement).value)).toEqual(initial);
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(change).toHaveBeenLastCalledWith(generateHelmetConfig("next-seed"));
  });
});

describe("HelmetEditor exports", () => {
  it.each(APPEARANCE_VALUES)("exports the saved visor and colors to 512px square SVG and PNG in %s", async (appearance) => {
    const user = userEvent.setup();
    const generated = generateHelmetConfig("export");
    const config = { ...generated, number: "007", colors: { ...generated.colors, shell: "#123456" }, parts: { ...generated.parts, visorOpen: true } };
    const change = vi.fn();
    render(<HelmetEditor value={config} onChange={change} appearance={appearance} />);
    await user.click(screen.getByRole("button", { name: "Export SVG" }));
    const [svgBlob, svgFilename] = vi.mocked(exportTools.downloadArtwork).mock.calls.at(-1)!;
    expect(svgFilename).toBe("helmet.svg");
    const source = await textFromBlob(svgBlob);
    const svg = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(svg.querySelector("parsererror")).toBeNull();
    expect(svg.documentElement.getAttribute("width")).toBe("512");
    expect(svg.documentElement.getAttribute("height")).toBe("512");
    expect(svg.documentElement.getAttribute("viewBox")).toBe("0 0 240 240");
    expect(source).toContain("#123456");
    expect(source).toContain(">007</text>");
    expect(svg.querySelector(".helmet-visor-lift")?.getAttribute("transform")).toBe("rotate(30 178 111)");
    expect(source).not.toMatch(/var\(|<animate|<script|<image/);
    expect(svg.documentElement.getAttribute("shape-rendering")).toBe(appearance === "pixel" ? "crispEdges" : "auto");
    await user.click(screen.getByRole("button", { name: "Export PNG" }));
    expect(exportTools.svgToPng).toHaveBeenLastCalledWith(source, { width: 512 });
    expect(exportTools.downloadArtwork).toHaveBeenLastCalledWith(expect.any(Blob), "helmet.png");
    expect(change).not.toHaveBeenCalled();
  });

  it("shows export errors and restores the export controls without changing identity", async () => {
    const user = userEvent.setup();
    vi.mocked(exportTools.svgToPng).mockRejectedValueOnce(new Error("PNG encoding unavailable"));
    const change = vi.fn();
    render(<HelmetEditor value={generateHelmetConfig("failure")} onChange={change} />);
    await user.click(screen.getByRole("button", { name: "Export PNG" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("PNG encoding unavailable");
    await waitFor(() => expect(screen.getByRole("button", { name: "Export PNG" })).toBeEnabled());
    expect(exportTools.downloadArtwork).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });

  it("server-renders the complete controlled editor without browser globals", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const markup = renderToStaticMarkup(<HelmetEditor value={generateHelmetConfig("server")} onChange={() => {}} seed={17} appearance="terminal" />);
    expect(markup).toContain("Customize your helmet");
    expect(markup).toContain("Export SVG");
    expect(markup).toContain('data-motion="paused"');
    expect(markup).toContain('data-appearance="terminal"');
    expect(markup).toContain('aria-label="Customize your helmet options"');
    expect(markup).not.toMatch(/NaN|Infinity/);
    vi.unstubAllGlobals();
  });
});
