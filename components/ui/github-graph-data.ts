/** Calendar normalization and palettes adapted from Unlumen UI, MIT, Copyright (c) 2026 Léo Wicki. See THIRD_PARTY_NOTICES.md. */
export type GitHubContribution = { date: string; count: number; level?: number };
export type GitHubContributionCell = GitHubContribution & { level: number; outside: boolean };
export type GitHubGraphVariant = "github" | "graphite" | "ocean" | "violet";
export type GitHubGraphAnimation = "none" | "wave" | "scan" | "cascade";
export type GitHubGraphAmbientEffect = "none" | "tide" | "drift" | "twinkle";
export type GitHubContributionLoader = (account: string, options: { signal: AbortSignal }) => Promise<readonly GitHubContribution[]>;

export const GITHUB_GRAPH_PALETTES: Record<GitHubGraphVariant, readonly [string, string, string, string, string]> = {
  github: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  graphite: ["#eeeeee", "#cccccc", "#969696", "#5f5f5f", "#171717"],
  ocean: ["#e6f5ff", "#b4e2ff", "#62bdf5", "#2585d8", "#124e93"],
  violet: ["#f2eaff", "#dcc5ff", "#b486ff", "#8355df", "#52269c"],
};
export function normalizeGitHubAccount(account: string): string | null {
  const value = account.trim().replace(/^@+/, "");
  return /^(?!.*--)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value) ? value : null;
}
export function contributionDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}
export function graphNumber(value: number, min: number, max: number, fallback: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
}
export function isContributionData(value: unknown): value is GitHubContribution[] {
  return Array.isArray(value) && value.every(day => day && typeof day.date === "string" && contributionDate(day.date) && Number.isSafeInteger(day.count) && day.count >= 0);
}
/** Sunday-first columns, at most twelve months, with UTC dates and blank edge padding. */
export function buildContributionWeeks(data: readonly GitHubContribution[], months = 6): GitHubContributionCell[][] {
  const byDate = new Map<string, GitHubContribution>();
  for (const day of data) if (day && typeof day.date === "string" && contributionDate(day.date) && Number.isFinite(day.count)) byDate.set(day.date, day);
  const ordered = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (!ordered.length) return [];
  const last = contributionDate(ordered.at(-1)!.date)!;
  const first = new Date(last), monthCount = Math.round(graphNumber(months, 1, 12, 6));
  const dayOfMonth = first.getUTCDate(); first.setUTCDate(1); first.setUTCMonth(first.getUTCMonth() - monthCount);
  const lastDayOfMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));
  const selected = ordered.filter(day => contributionDate(day.date)! >= first);
  const start = contributionDate(selected[0].date)!, end = new Date(last);
  const firstKey = selected[0].date, lastKey = selected.at(-1)!.date;
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); end.setUTCDate(end.getUTCDate() + 6 - end.getUTCDay());
  const maxCount = Math.max(0, ...selected.map(day => day.count));
  const cells: GitHubContributionCell[] = [];
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = date.toISOString().slice(0, 10), day = byDate.get(key), count = Math.max(0, Math.floor(day?.count ?? 0));
    const level = count === 0 ? 0 : Number.isInteger(day?.level) && day!.level! >= 1 && day!.level! <= 4 ? day!.level! : Math.min(4, Math.max(1, Math.ceil(count / maxCount * 4)));
    cells.push({ date: key, count, level, outside: key < firstKey || key > lastKey });
  }
  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}
export function contributionLabel(day: GitHubContribution, locale = "en", full = false): string {
  const date = new Intl.DateTimeFormat(locale, { month: full ? "long" : "short", day: "numeric", ...(full ? { year: "numeric" as const } : {}), timeZone: "UTC" }).format(contributionDate(day.date)!);
  return `${day.count} ${day.count === 1 ? "contribution" : "contributions"} ${full ? "on" : "·"} ${date}`;
}
export const loadPublicGitHubContributions: GitHubContributionLoader = async (account, { signal }) => {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(account)}?y=last`, { signal });
  if (!response.ok) throw new Error(response.status === 404 ? "GitHub profile not found. Check the username." : "Contributions are unavailable. Try again in a moment.");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("contributions" in payload) || !isContributionData(payload.contributions)) throw new Error("The profile response contained invalid contribution data.");
  return payload.contributions;
};
/** Deterministic demonstration data, never presented as a real profile's activity. */
export function createSampleContributions(seed = 1): GitHubContribution[] {
  let state = Math.round(graphNumber(seed, 1, 2147483646, 1));
  return Array.from({ length: 365 }, (_, index) => {
    state = state * 16807 % 2147483647;
    const date = new Date(Date.UTC(2026, 0, 1 + index)), level = state % 7 < 2 ? 0 : state % 4 + 1;
    return { date: date.toISOString().slice(0, 10), level, count: level ? level * 3 + state % 5 : 0 };
  });
}
export const GITHUB_GRAPH_SAMPLE = createSampleContributions();
