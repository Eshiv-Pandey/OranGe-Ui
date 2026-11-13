"use client";

/** Adapted from Unlumen UI's GitHub graph, MIT, Copyright (c) 2026 Léo Wicki. License travels in THIRD_PARTY_NOTICES.md. */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, observeCreativeVisibility, type CreativeTheme } from "./creative-surface";
import { buildContributionWeeks, contributionLabel, GITHUB_GRAPH_PALETTES, graphNumber, isContributionData, loadPublicGitHubContributions, normalizeGitHubAccount, type GitHubContribution, type GitHubContributionCell, type GitHubContributionLoader, type GitHubGraphAnimation, type GitHubGraphAmbientEffect, type GitHubGraphVariant } from "./github-graph-data";
import "../../styles/github-graph.css";

export { GITHUB_GRAPH_PALETTES, buildContributionWeeks, normalizeGitHubAccount } from "./github-graph-data";
export type { GitHubContribution, GitHubContributionCell, GitHubContributionLoader, GitHubGraphAnimation, GitHubGraphAmbientEffect, GitHubGraphVariant } from "./github-graph-data";
export type GitHubGraphProps = AppearanceProps & {
  account?: string; data?: readonly GitHubContribution[]; loadContributions?: GitHubContributionLoader;
  months?: number; variant?: GitHubGraphVariant; colors?: readonly [string, string, string, string, string];
  cellSize?: number; cellGap?: number; cellRadius?: number; autoFit?: boolean;
  animation?: GitHubGraphAnimation; animationSpeed?: number; ambientEffect?: GitHubGraphAmbientEffect; ambientIntensity?: number;
  paused?: boolean; showAccount?: boolean; showLegend?: boolean; showTotal?: boolean; locale?: string; theme?: CreativeTheme;
  onDayClick?: (day: GitHubContributionCell) => void;
};
type Resource = { account: string; status: "loading" | "ready" | "error"; data?: readonly GitHubContribution[]; error?: string };
type Anchor = { left: number; top: number; below: boolean };

export function GitHubGraph({ account = "octocat", data, loadContributions = loadPublicGitHubContributions, months = 6, variant = "github", colors, cellSize = 18, cellGap = 4, cellRadius = 3, autoFit = false, animation = "wave", animationSpeed = 1.75, ambientEffect = "twinkle", ambientIntensity = 1.1, paused = false, showAccount = true, showLegend = false, showTotal = false, locale = "en", theme = "auto", onDayClick, appearance = "polished", className }: GitHubGraphProps) {
  const root = useRef<HTMLDivElement>(null), buttons = useRef(new Map<string, HTMLButtonElement>());
  const cache = useRef<{ account: string; loader: GitHubContributionLoader; data: readonly GitHubContribution[] } | null>(null);
  const [visible, setVisible] = useState(false), [width, setWidth] = useState(0), [retry, setRetry] = useState(0);
  const [resource, setResource] = useState<Resource>({ account: "", status: "loading" });
  const [focusDate, setFocusDate] = useState<string | null>(null), [spotlight, setSpotlight] = useState<string | null>(null), [anchor, setAnchor] = useState<Anchor | null>(null);
  const resolvedTheme = useCreativeTheme(theme), reduced = useReducedMotion(), id = useId().replace(/:/g, "");
  const normalizedAccount = normalizeGitHubAccount(account);
  useEffect(() => root.current ? observeCreativeVisibility(root.current, setVisible) : undefined, []);
  useEffect(() => {
    const element = root.current; if (!element || !autoFit) return;
    const update = () => setWidth(element.clientWidth); update();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null; observer?.observe(element);
    return () => observer?.disconnect();
  }, [autoFit]);
  useEffect(() => {
    if (data !== undefined || !normalizedAccount || !visible) return;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      if (cache.current?.account === normalizedAccount && cache.current.loader === loadContributions) {
        setResource({ account: normalizedAccount, status: "ready", data: cache.current.data }); return;
      }
      setResource({ account: normalizedAccount, status: "loading" });
      const days = await loadContributions(normalizedAccount, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!isContributionData(days)) throw new Error("The profile response contained invalid contribution data.");
      cache.current = { account: normalizedAccount, loader: loadContributions, data: days };
      setResource({ account: normalizedAccount, status: "ready", data: days });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setResource({ account: normalizedAccount, status: "error", error: error instanceof Error ? error.message : "Could not load contributions." });
    });
    return () => controller.abort();
  }, [data, normalizedAccount, visible, retry, loadContributions]);
  const days = data ?? (resource.account === normalizedAccount ? resource.data : undefined);
  const weeks = useMemo(() => buildContributionWeeks(days ?? [], months), [days, months]);
  const cells = useMemo(() => weeks.flat(), [weeks]), available = cells.filter(day => !day.outside);
  const activeDate = available.some(day => day.date === focusDate) ? focusDate : available[0]?.date;
  const hovered = cells.find(day => day.date === spotlight), hoveredIndex = cells.findIndex(day => day.date === spotlight);
  const palette = colors ?? GITHUB_GRAPH_PALETTES[variant] ?? GITHUB_GRAPH_PALETTES.github;
  const size = graphNumber(cellSize, 8, 40, 18), gap = graphNumber(cellGap, 0, 12, 4);
  const fitSize = autoFit && width && weeks.length ? Math.max(10, Math.min(size, (width - gap * (weeks.length - 1)) / weeks.length)) : size;
  const radius = appearance === "pixel" || appearance === "terminal" ? 0 : graphNumber(cellRadius, 0, fitSize / 2, 3);
  const speed = graphNumber(animationSpeed, .1, 4, 1.75), intensity = graphNumber(ambientIntensity, 0, 2, 1.1);
  const status = data !== undefined ? "ready" : !normalizedAccount ? "error" : resource.account !== normalizedAccount ? "loading" : resource.status;
  const position = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect(), below = rect.top < 64;
    const halfWidth = Math.min(window.innerWidth - 24, document.getElementById(`${id}-tooltip`)?.offsetWidth || 220) / 2;
    setAnchor({ left: Math.max(12 + halfWidth, Math.min(window.innerWidth - 12 - halfWidth, rect.left + rect.width / 2)), top: below ? rect.bottom + 10 : rect.top - 10, below });
  }, [id]);
  useEffect(() => {
    if (!spotlight) return;
    const update = () => { const element = buttons.current.get(spotlight); if (element) position(element); };
    window.addEventListener("scroll", update, true); window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [spotlight, position]);
  function reveal(element: HTMLButtonElement, day: GitHubContributionCell, keyboard = false) {
    if (keyboard) setFocusDate(day.date);
    setSpotlight(day.date); position(element);
  }
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const row = index % 7; let next = index;
    switch (event.key) {
      case "ArrowUp": next = row ? index - 1 : index; break;
      case "ArrowDown": next = row < 6 ? index + 1 : index; break;
      case "ArrowLeft": next = index >= 7 ? index - 7 : index; break;
      case "ArrowRight": next = index + 7 < cells.length ? index + 7 : index; break;
      case "Home": next = event.ctrlKey ? cells.findIndex(day => !day.outside) : row; while (cells[next]?.outside) next += 7; break;
      case "End": next = event.ctrlKey ? cells.length - 1 : (weeks.length - 1) * 7 + row; while (cells[next]?.outside) next -= event.ctrlKey ? 1 : 7; break;
      case "Escape": event.preventDefault(); setSpotlight(null); setAnchor(null); return;
      default: return;
    }
    event.preventDefault(); const day = cells[next];
    if (!day || day.outside) return;
    const element = buttons.current.get(day.date); element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  const style = { "--gh-size": `${fitSize}px`, "--gh-gap": `${gap}px`, "--gh-radius": `${radius}px`, "--gh-columns": Math.max(1, weeks.length), "--gh-intensity": intensity, "--gh-enter-duration": `${480 / speed}ms` } as CSSProperties;
  return <div ref={root} className={["github-graph creative-surface", className].filter(Boolean).join(" ")} style={style} data-theme={resolvedTheme} data-appearance={appearance} data-motion={reduced ? "reduced" : paused || !visible ? "paused" : "running"} data-animation={animation} data-ambient={ambientEffect} aria-busy={status === "loading"}>
    {(showAccount || showTotal) && <div className="github-graph-heading">{showAccount && <span className="github-graph-account">@{normalizedAccount ?? account}</span>}{showTotal && <span className="github-graph-total">{available.reduce((sum, day) => sum + day.count, 0).toLocaleString(locale)} contributions</span>}</div>}
    {status === "loading" && <div className="github-graph-loading" role="status"><span>Loading contributions...</span><div aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} />)}</div></div>}
    {status === "error" && <div className="github-graph-message" role="alert"><p>{normalizedAccount ? resource.error : "Enter a valid GitHub username."}</p>{normalizedAccount && <button type="button" className="creative-button" onClick={() => { cache.current = null; setRetry(value => value + 1); }}>Try again</button>}</div>}
    {status === "ready" && !available.length && <p className="github-graph-message" role="status">No contributions to display.</p>}
    {status === "ready" && available.length > 0 && <div className="github-graph-scroll"><div className="github-graph-grid" role="grid" aria-label={`Contributions for ${normalizedAccount ?? account}`} aria-rowcount={7} aria-colcount={weeks.length} onPointerLeave={() => {
      const element = document.activeElement as HTMLButtonElement | null, day = cells.find(day => day.date === element?.dataset.date);
      if (element && day && root.current?.contains(element)) reveal(element, day); else { setSpotlight(null); setAnchor(null); }
    }}>
      {Array.from({ length: 7 }, (_, row) => <div className="github-graph-row" role="row" aria-rowindex={row + 1} key={row}>{weeks.map((week, column) => {
        const day = week[row], index = column * 7 + row;
        const delay = reduced || animation === "none" ? 0 : (animation === "wave" ? column * .026 + row * .016 : animation === "scan" ? column * .03 : (column + row * 2) * .018) / speed;
        const seed = ((column * 17 + row * 31) % 11) / 10;
        const strength = Math.max(0, 1 - Math.hypot(column - Math.floor(hoveredIndex / 7), row - hoveredIndex % 7) / 3) * (hoveredIndex >= 0 ? 1 : 0);
        return <button ref={element => { if (element) buttons.current.set(day.date, element); else buttons.current.delete(day.date); }} key={day.date} type="button" role="gridcell" aria-colindex={column + 1} aria-label={day.outside ? "Outside displayed range" : contributionLabel(day, locale, true)} aria-describedby={spotlight === day.date && anchor ? `${id}-tooltip` : undefined} disabled={day.outside} tabIndex={!day.outside && day.date === activeDate ? 0 : -1} className="github-graph-cell" data-date={day.date} data-level={day.level} data-outside={day.outside} style={{ gridColumn: column + 1, gridRow: row + 1, "--gh-color": palette[day.level], "--gh-delay": `${delay}s`, "--gh-ambient-delay": `${delay + seed * .85 / speed}s`, "--gh-duration": `${(ambientEffect === "tide" ? 3.2 : ambientEffect === "drift" ? 3.8 + seed : 2 + seed * 1.4) / speed}s`, filter: `brightness(${1 + strength * .45}) saturate(${1 + strength * .2})` } as CSSProperties}
          onPointerEnter={event => reveal(event.currentTarget, day)} onFocus={event => reveal(event.currentTarget, day, true)} onBlur={event => { if (!root.current?.contains(event.relatedTarget)) { setSpotlight(null); setAnchor(null); } }} onKeyDown={event => move(event, index)} onClick={event => { reveal(event.currentTarget, day, true); onDayClick?.(day); }}><span aria-hidden="true" className="github-graph-cell-entrance"><span className="github-graph-cell-fill" /></span></button>;
      })}</div>)}
    </div></div>}
    {showLegend && status === "ready" && available.length > 0 && <div className="github-graph-legend" aria-label="Contribution intensity from less to more"><span>Less</span>{palette.map((fill, index) => <i key={index} style={{ backgroundColor: fill }} aria-hidden="true" />)}<span>More</span></div>}
    {typeof document !== "undefined" && createPortal(<AnimatePresence>{hovered && anchor && <motion.div id={`${id}-tooltip`} role="tooltip" className="github-graph-tooltip creative-surface" data-theme={resolvedTheme} style={{ left: anchor.left, top: anchor.top, translate: `-50% ${anchor.below ? "0" : "-100%"}` }} initial={reduced ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .15 }}>{contributionLabel(hovered, locale)}</motion.div>}</AnimatePresence>, document.body)}
  </div>;
}
