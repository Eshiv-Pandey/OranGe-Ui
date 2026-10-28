import { useState } from "react";
import { renderToString } from "react-dom/server";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArtworkCustomizer, CustomizerColor, CustomizerRange, CustomizerSelect, CustomizerToggle } from "../components/ui/artwork-customizer";
import { downloadArtwork, escapeSvgText, normalizeSvgColor, prepareSvgExport, stableConfigJson, svgToPng } from "../components/ui/svg-export";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><rect width="240" height="120" fill="#ff7700"/></svg>';

describe("portable SVG export helpers", () => {
  it("normalizes opaque colors and escapes editable text", () => {
    expect(normalizeSvgColor(" #Fa0 ")).toBe("#ffaa00");
    expect(normalizeSvgColor('url("bad")', "#ABC")).toBe("#aabbcc");
    expect(normalizeSvgColor("#11223344", "invalid")).toBe("#ff7700");
    expect(escapeSvgText('<a "x">&\u0001')).toBe("&lt;a &quot;x&quot;&gt;&amp;");
    expect(escapeSvgText("long label", 4)).toBe("long");
  });

  it("resolves explicit variables and fallback colors into self-contained SVG", () => {
    const source = svg.replace('fill="#ff7700"', 'fill="var(--body, #f70)" stroke="currentColor"');
    expect(prepareSvgExport(source, { variables: { "--body": "#AbC" }, foreground: "#234" })).toContain('fill="#aabbcc" stroke="#223344"');
    expect(prepareSvgExport(source)).toContain('fill="#ff7700"');
    expect(prepareSvgExport(svg.replace('fill="#ff7700"', 'fill="url(#paint)"'))).toContain("url(#paint)");
    expect(prepareSvgExport(svg.replace('fill="#ff7700"', "fill=\"url('#paint')\""))).toContain("url('#paint')");
  });

  it.each([
    '<g/>', svg.replace('fill="#ff7700"', 'fill="var(--missing)"'),
    svg.replace("<rect", '<image href="https://example.test/a.png"/><rect'),
    svg.replace("<rect", '<script>alert(1)</script><rect'),
    svg.replace("<rect", '<animate attributeName="x"/><rect'),
    svg.replace("<rect", '<rect onload="alert(1)"/><rect'),
    svg.replace('fill="#ff7700"', 'fill="url(https://example.test/paint)"'),
    svg.replace('fill="#ff7700"', 'fill="url(\'https://example.test/paint\')"'),
    svg.replace('xmlns="http://www.w3.org/2000/svg"', ""),
    svg.replace("/></svg>", "></svg>"),
  ])("rejects unresolved, active, external, or invalid SVG: %s", (source) => {
    expect(() => prepareSvgExport(source)).toThrow();
  });

  it("copies equivalent normalized objects with deterministic key order", () => {
    expect(stableConfigJson({ z: 3, nested: { b: 2, a: 1 }, list: [3, 2, 1] })).toBe(stableConfigJson({ list: [3, 2, 1], nested: { a: 1, b: 2 }, z: 3 }));
  });

  it("supports server SVG preparation and rejects browser-only PNG conversion clearly", async () => {
    vi.stubGlobal("window", undefined); vi.stubGlobal("document", undefined); vi.stubGlobal("DOMParser", undefined);
    expect(prepareSvgExport(svg)).toBe(svg);
    await expect(svgToPng(svg)).rejects.toThrow("PNG export requires a browser");
  });

  it("preserves aspect ratio, exports a transparent PNG, and releases the source URL", async () => {
    const output = new Blob(["png"], { type: "image/png" });
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage, fillRect }), toBlob: (callback: BlobCallback) => callback(output) };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:source", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class { onload?: () => void; set src(_value: string) { this.onload?.(); } });
    await expect(svgToPng(svg, { width: 600 })).resolves.toBe(output);
    expect(canvas.width).toBe(600); expect(canvas.height).toBe(300);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 600, 300);
    expect(fillRect).not.toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:source");
  });

  it("releases the source URL when PNG image decoding fails", async () => {
    const canvas = { getContext: () => ({ drawImage: vi.fn() }) };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:source", revokeObjectURL: revoke });
    vi.stubGlobal("Image", class { onerror?: () => void; set src(_value: string) { this.onerror?.(); } });
    await expect(svgToPng(svg)).rejects.toThrow("could not be decoded");
    expect(revoke).toHaveBeenCalledWith("blob:source");
  });

  it("downloads with a bounded safe filename and releases the temporary URL", () => {
    vi.useFakeTimers();
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:download", revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("..-helmet.svg");
      expect(this.isConnected).toBe(true);
    });
    downloadArtwork(new Blob([svg]), "../helmet.svg");
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[href="blob:download"]')).toBeNull();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:download");
  });
});

type Config = { color: string; speed: number; finish: "gloss" | "matte"; interactive: boolean };
function generate(seed: string): Config { return { color: seed.includes(":random:") ? "#22aa77" : "#ff7700", speed: 0.5, finish: "gloss", interactive: true }; }
function normalize(value: unknown): Config {
  const input = value as Partial<Config>;
  return { color: normalizeSvgColor(input.color), speed: Math.min(1, Math.max(0, input.speed ?? 0)), finish: input.finish === "matte" ? "matte" : "gloss", interactive: input.interactive !== false };
}
function Preview({ current }: { current: Config }) { return <svg role="img" aria-label={`Artwork ${current.color}`} />; }
const tabs = [
  { id: "colors", label: "Colors", render: ({ value, update }: { value: Config; update: (patch: Partial<Config>) => void }) => <CustomizerColor label="Body color" value={value.color} onChange={(color) => update({ color })} /> },
  { id: "motion", label: "Motion", render: ({ value, update }: { value: Config; update: (patch: Partial<Config>) => void }) => <><CustomizerRange label="Speed" value={value.speed} onChange={(speed) => update({ speed })} /><CustomizerToggle label="Interactive" checked={value.interactive} onChange={(interactive) => update({ interactive })} /></> },
  { id: "parts", label: "Parts", render: ({ value, update }: { value: Config; update: (patch: Partial<Config>) => void }) => <CustomizerSelect label="Finish" value={value.finish} options={[{ value: "gloss", label: "Gloss" }, { value: "matte", label: "Matte" }]} onChange={(finish) => update({ finish })} /> },
];
function Editor({ onChange, configToSvg = () => svg }: { onChange?: (value: Config) => void; configToSvg?: () => string }) {
  const [value, setValue] = useState(generate("default"));
  return <ArtworkCustomizer value={value} onChange={(next) => { onChange?.(next); setValue(next); }} normalizeConfig={normalize} generateConfig={generate} seed="default" label="Customize artwork" renderPreview={(current) => <Preview current={current} />} tabs={tabs} configToSvg={configToSvg} />;
}

describe("artwork customizer", () => {
  it("keeps configuration controlled and applies normalized native control changes", async () => {
    const onChange = vi.fn(); render(<Editor onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Body color"), { target: { value: "#112233" } });
    expect(onChange).toHaveBeenLastCalledWith({ ...generate("default"), color: "#112233" });
    await userEvent.setup().click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.change(screen.getByRole("slider", { name: "Speed" }), { target: { value: "0.8" } });
    expect(onChange.mock.lastCall?.[0].speed).toBe(0.8);
    await userEvent.setup().click(screen.getByRole("checkbox", { name: "Interactive" }));
    expect(onChange.mock.lastCall?.[0].interactive).toBe(false);
  });

  it("supports arrow, Home, and End navigation with a single tab-list focus stop", async () => {
    const user = userEvent.setup(); render(<Editor />);
    screen.getByRole("tab", { name: "Colors" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Motion" })).toHaveFocus();
    expect(screen.getByRole("slider", { name: "Speed" })).toBeVisible();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Parts" })).toHaveFocus();
    await user.selectOptions(screen.getByRole("combobox", { name: "Finish" }), "matte");
    expect(screen.getByRole("combobox")).toHaveValue("matte");
    screen.getByRole("tab", { name: "Parts" }).focus(); await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Colors" })).toHaveFocus();
    expect(screen.getAllByRole("tab").filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
  });

  it("randomizes and resets deterministically without ambient randomness", async () => {
    const user = userEvent.setup(); const onChange = vi.fn(); render(<Editor onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Randomize" }));
    const first = onChange.mock.lastCall?.[0];
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange).toHaveBeenLastCalledWith(generate("default"));
    await user.click(screen.getByRole("button", { name: "Randomize" }));
    expect(onChange).toHaveBeenLastCalledWith(first);
  });

  it("copies normalized configuration and exposes a usable fallback if clipboard access fails", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("unavailable"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<Editor />); await user.click(screen.getByRole("button", { name: "Copy config" }));
    expect(writeText).toHaveBeenCalledWith(stableConfigJson(generate("default")));
    expect(screen.getByRole("alert")).toHaveTextContent("Clipboard unavailable");
    expect(screen.getByRole("textbox", { name: "Configuration JSON" })).toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue(stableConfigJson(generate("default")));
  });

  it("reports SVG renderer failures instead of pretending an export succeeded", async () => {
    render(<Editor configToSvg={() => '<svg fill="var(--unresolved)"></svg>'} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Export SVG" }));
    expect(screen.getByRole("alert")).toHaveTextContent("explicit export color");
    expect(screen.getByRole("button", { name: "Export SVG" })).toBeEnabled();
  });

  it("renders preview artwork and controls in server HTML", () => {
    vi.stubGlobal("window", undefined); vi.stubGlobal("document", undefined);
    const markup = renderToString(<Editor />);
    expect(markup).toContain("data-main-preview");
    expect(markup).toContain('aria-label="Artwork #ff7700"');
    expect(markup).toContain("Body color");
  });
});
