import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitHubGraph } from "../components/ui/github-graph";
import { buildContributionWeeks, contributionDate, contributionLabel, createSampleContributions, isContributionData, loadPublicGitHubContributions, normalizeGitHubAccount, type GitHubContribution } from "../components/ui/github-graph-data";

const days: GitHubContribution[] = [{ date: "2026-07-01", count: 3 }, { date: "2026-07-15", count: 9, level: 4 }];
beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

it("defaults to calmer intensity and coordinated entrance and ambient timing", () => {
  const view = render(<GitHubGraph data={days} />);
  const graph = view.container.querySelector<HTMLElement>(".github-graph")!;
  const cell = view.container.querySelector<HTMLElement>(".github-graph-cell")!;
  expect(graph.style.getPropertyValue("--gh-intensity")).toBe("1.1");
  expect(graph.style.getPropertyValue("--gh-enter-duration")).toBe(`${480 / 1.75}ms`);
  const fastDuration = parseFloat(cell.style.getPropertyValue("--gh-duration"));
  view.rerender(<GitHubGraph data={days} animationSpeed={1} ambientIntensity={.65} />);
  expect(parseFloat(cell.style.getPropertyValue("--gh-duration"))).toBeCloseTo(fastDuration * 1.75);
});

describe("contribution calendar data", () => {
  it("validates UTC dates, including leap days and impossible dates", () => {
    expect(contributionDate("2024-02-29")?.toISOString()).toBe("2024-02-29T00:00:00.000Z");
    for (const date of ["2026-02-29", "2026-13-01", "2026-02-30", "2026-1-1", "invalid"]) expect(contributionDate(date)).toBeNull();
    expect(contributionLabel(days[0], "en", true)).toBe("3 contributions on July 1, 2026");
  });
  it("keeps seven Sunday-first rows, fills missing days, and blanks edge padding", () => {
    const weeks = buildContributionWeeks(days), cells = weeks.flat();
    expect(weeks.every(week => week.length === 7 && contributionDate(week[0].date)?.getUTCDay() === 0)).toBe(true);
    expect(cells.find(day => day.date === "2026-07-02")).toMatchObject({ count: 0, level: 0, outside: false });
    expect(cells[0]).toMatchObject({ date: "2026-06-28", outside: true });
    expect(cells.at(-1)).toMatchObject({ date: "2026-07-18", outside: true });
  });
  it("deduplicates by date, skips invalid records, clamps counts, and bounds history", () => {
    const cells = buildContributionWeeks([...days, { date: "2026-07-01", count: 7 }, { date: "broken", count: 1 }, { date: "2026-07-02", count: -5 }]).flat();
    expect(cells.find(day => day.date === "2026-07-01")?.count).toBe(7);
    expect(cells.find(day => day.date === "2026-07-02")?.count).toBe(0);
    const history = Array.from({ length: 1500 }, (_, index) => ({ date: new Date(Date.UTC(2022, 0, 1 + index)).toISOString().slice(0, 10), count: 1 }));
    expect(buildContributionWeeks(history, 100).flat().length).toBeLessThanOrEqual(378);
    expect(buildContributionWeeks(history, Number.NaN).flat().length).toBeLessThanOrEqual(196);
    expect(buildContributionWeeks([], 12)).toEqual([]);
  });
  it("handles month ends without rolling into the next month", () => {
    const cells = buildContributionWeeks([{ date: "2026-01-01", count: 1 }, { date: "2026-02-28", count: 1 }, { date: "2026-03-31", count: 1 }], 1).flat();
    expect(cells.find(day => day.date === "2026-02-28")?.outside).toBe(false);
    expect(cells.find(day => day.date === "2026-02-27")?.outside).toBe(true);
  });
  it("normalizes handles without allowing paths or invalid GitHub names", () => {
    expect(normalizeGitHubAccount(" @octocat ")).toBe("octocat");
    for (const name of ["", "-name", "name-", "two--hyphens", "a/b", "a_b", "a".repeat(40)]) expect(normalizeGitHubAccount(name)).toBeNull();
    expect(normalizeGitHubAccount("a".repeat(39))).not.toBeNull();
  });
  it("produces reproducible labeled sample data and validates network records", () => {
    expect(createSampleContributions(9)).toEqual(createSampleContributions(9));
    expect(createSampleContributions(9)).not.toEqual(createSampleContributions(10));
    expect(isContributionData(days)).toBe(true); expect(isContributionData([])).toBe(true);
    expect(isContributionData([{ date: "2026-02-30", count: 4 }])).toBe(false);
    expect(isContributionData([{ date: "2026-02-28", count: "4" }])).toBe(false);
  });
  it("loads the public endpoint with cancellation and rejects malformed responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ contributions: days }) });
    vi.stubGlobal("fetch", fetcher); const signal = new AbortController().signal;
    await expect(loadPublicGitHubContributions("octocat", { signal })).resolves.toEqual(days);
    expect(fetcher).toHaveBeenCalledWith("https://github-contributions-api.jogruber.de/v4/octocat?y=last", { signal });
    fetcher.mockResolvedValue({ ok: true, json: async () => ({ contributions: [{}] }) });
    await expect(loadPublicGitHubContributions("octocat", { signal })).rejects.toThrow("invalid contribution data");
    fetcher.mockResolvedValue({ ok: false, status: 404 });
    await expect(loadPublicGitHubContributions("octocat", { signal })).rejects.toThrow("profile not found");
  });
});

describe("GitHubGraph interactions and lifecycle", () => {
  it("uses supplied data without a request and exposes one keyboard entry point", async () => {
    const loader = vi.fn(); render(<GitHubGraph data={days} loadContributions={loader} />);
    await act(async () => {}); expect(loader).not.toHaveBeenCalled();
    expect(screen.getAllByRole("row")).toHaveLength(7);
    expect(screen.getAllByRole("gridcell").filter(cell => cell.tabIndex === 0)).toHaveLength(1);
  });
  it("moves across dates and weeks, closes the tooltip, and calls the day callback", () => {
    const callback = vi.fn(); render(<GitHubGraph data={days} onDayClick={callback} />);
    const first = screen.getByRole("gridcell", { name: "3 contributions on July 1, 2026" });
    act(() => first.focus()); expect(screen.getByRole("tooltip")).toHaveTextContent("3 contributions");
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-08");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-09");
    fireEvent.keyDown(document.activeElement!, { key: "Home", ctrlKey: true });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "End", ctrlKey: true });
    expect(document.activeElement).toHaveAttribute("data-date", "2026-07-15");
    fireEvent.click(document.activeElement!); expect(callback).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-07-15", count: 9, outside: false }));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" }); expect(document.activeElement).not.toHaveAttribute("aria-describedby");
  });
  it("supports empty data and rejects an invalid account without loading", async () => {
    const loader = vi.fn(), { rerender } = render(<GitHubGraph data={[]} loadContributions={loader} />);
    expect(screen.getByRole("status")).toHaveTextContent("No contributions");
    rerender(<GitHubGraph account="bad/name" loadContributions={loader} />);
    expect(screen.getByRole("alert")).toHaveTextContent("valid GitHub username");
    await act(async () => {}); expect(loader).not.toHaveBeenCalled();
  });
  it("shows recoverable loader errors and retries", async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error("Service is offline")).mockResolvedValue(days);
    render(<GitHubGraph account="@octocat" loadContributions={loader} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Service is offline");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("grid"); expect(loader).toHaveBeenCalledTimes(2);
    expect(loader.mock.calls[0][0]).toBe("octocat");
  });
  it("rejects malformed custom-loader data", async () => {
    render(<GitHubGraph loadContributions={vi.fn().mockResolvedValue([{}])} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid contribution data");
  });
  it("aborts stale requests and ignores late results after account changes", async () => {
    let resolveFirst!: (data: GitHubContribution[]) => void;
    const loader = vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; })).mockResolvedValue(days);
    const { rerender, unmount } = render(<GitHubGraph account="first" loadContributions={loader} />);
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1)); const signal = loader.mock.calls[0][1].signal;
    rerender(<GitHubGraph account="second" loadContributions={loader} />);
    expect(signal.aborted).toBe(true); await screen.findByRole("grid");
    await act(async () => resolveFirst([{ date: "2026-07-01", count: 999 }]));
    expect(screen.getByRole("grid")).toHaveAccessibleName("Contributions for second");
    expect(screen.queryByRole("gridcell", { name: /999 contributions/ })).toBeNull();
    const latestSignal = loader.mock.calls[1][1].signal; unmount(); expect(latestSignal.aborted).toBe(true);
  });
  it("retains a successful profile while moving offscreen", async () => {
    const loader = vi.fn().mockResolvedValue(days);
    render(<GitHubGraph loadContributions={loader} />); await screen.findByRole("grid");
    const visibility = vi.spyOn(document, "visibilityState", "get");
    visibility.mockReturnValue("hidden"); fireEvent(document, new Event("visibilitychange"));
    visibility.mockReturnValue("visible"); fireEvent(document, new Event("visibilitychange"));
    await act(async () => {}); expect(loader).toHaveBeenCalledTimes(1);
  });
});
