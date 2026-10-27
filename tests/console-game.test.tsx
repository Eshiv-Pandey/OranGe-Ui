import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HandheldConsole } from "../components/landing/handheld-console";

describe("Pocket console", () => {
  it("starts, pauses without moving, resumes, and resets via keyboard", async () => {
    const user = userEvent.setup();
    render(<HandheldConsole />);
    const console = screen.getByRole("group", { name: "Interactive handheld console" });
    expect(screen.getByRole("button", { name: "Console right" })).toBeDisabled();
    console.focus();
    await user.keyboard("{Enter}{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("column 4, row 2");
    await user.click(screen.getByRole("button", { name: "Pause console demo" }));
    fireEvent.keyDown(console, { key: "ArrowRight" });
    expect(screen.getByRole("status")).toHaveTextContent("Press Play to resume");
    await user.click(screen.getByRole("button", { name: "Play console demo" }));
    expect(screen.getByRole("status")).toHaveTextContent("column 4, row 2");
    fireEvent.keyDown(console, { key: "Escape" });
    expect(screen.getByRole("status")).toHaveTextContent("Four little stars");
  });

  it("clamps movement at the edge and lets the player collect all four stars", async () => {
    render(<HandheldConsole />);
    const console = screen.getByRole("group", { name: "Interactive handheld console" });
    await userEvent.click(screen.getByRole("button", { name: "Play console demo" }));
    for (const key of ["ArrowRight", "ArrowRight", "ArrowRight"]) fireEvent.keyDown(console, { key });
    expect(screen.getByRole("status")).toHaveTextContent("column 5, row 2");
    for (const key of ["ArrowUp", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowLeft", "ArrowDown", "ArrowDown"]) fireEvent.keyDown(console, { key });
    expect(screen.getByRole("status")).toHaveTextContent("All four found");
    expect(screen.getByRole("button", { name: "Console right" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Play console demo" }));
    expect(screen.getByRole("status")).toHaveTextContent("column 3, row 2");
    await userEvent.click(screen.getByRole("button", { name: "Reset game" }));
    expect(screen.getByRole("status")).toHaveTextContent("Four little stars");
  });
});
