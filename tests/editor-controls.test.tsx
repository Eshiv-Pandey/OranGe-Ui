import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EditorColor, EditorRange } from "../components/ui/editor-controls";

function RangeDemo() { const [value, setValue] = useState(.5); return <EditorRange label="Wind" value={value} min={0} max={2} step={.05} onChange={setValue} />; }
function ColorDemo() { const [value, setValue] = useState("#66aa22"); return <EditorColor label="Grass" value={value} onChange={setValue} />; }

describe("editable inspector values", () => {
  it("keeps slider and exact numeric changes connected and bounds committed values", () => {
    render(<RangeDemo />);
    const slider = screen.getByRole("slider", { name: "Wind" });
    const number = screen.getByRole("spinbutton", { name: "Wind value" });
    fireEvent.change(number, { target: { value: "1.25" } });
    expect(slider).toHaveValue("1.25");
    fireEvent.change(slider, { target: { value: "0.75" } });
    expect(number).toHaveValue(.75);
    fireEvent.change(number, { target: { value: "9" } });
    fireEvent.blur(number);
    expect(number).toHaveValue(2);
    expect(slider).toHaveValue("2");
  });

  it("allows a temporary empty number without turning the live prop into NaN", () => {
    render(<RangeDemo />);
    const number = screen.getByRole("spinbutton", { name: "Wind value" });
    fireEvent.change(number, { target: { value: "" } });
    expect(screen.getByRole("slider")).toHaveValue("0.5");
    fireEvent.blur(number);
    expect(number).toHaveValue(.5);
  });

  it("synchronizes the native color picker and hex field while rejecting unfinished colors", () => {
    render(<ColorDemo />);
    const picker = screen.getByLabelText("Grass", { exact: true });
    const hex = screen.getByRole("textbox", { name: "Grass hex" });
    fireEvent.change(hex, { target: { value: "#204060" } });
    expect(picker).toHaveValue("#204060");
    fireEvent.change(hex, { target: { value: "#badxx" } });
    fireEvent.blur(hex);
    expect(hex).toHaveValue("#204060");
    fireEvent.change(hex, { target: { value: "#abc" } });
    fireEvent.blur(hex);
    expect(picker).toHaveValue("#aabbcc");
    fireEvent.change(picker, { target: { value: "#102030" } });
    expect(hex).toHaveValue("#102030");
  });
});
