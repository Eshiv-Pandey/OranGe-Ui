"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, useSyncExternalStore, type SVGProps } from "react";
import type { Appearance } from "./appearance";
import { MORPH_NAVIGATION_ICONS } from "./morph-icons-navigation";
import { MORPH_MEDIA_ICONS } from "./morph-icons-media";
import { compileMorphPath, morphActivityFrame, morphEase, morphPathFrame } from "./morph-icon-motion";

const definitions = [...MORPH_NAVIGATION_ICONS, ...MORPH_MEDIA_ICONS] as const;
export type MorphIconName = typeof definitions[number]["name"];
export type { MorphIconCategory } from "./morph-icon-geometry";
export const MORPH_ICONS = definitions.map(({ name, title, category, states }) => ({ name, title, category, states }));
const compiled = new Map(definitions.map(definition => [definition.name, { ...definition, paths: definition.paths.map(compileMorphPath) }]));
export function getMorphIcon(name: MorphIconName) { return compiled.get(name) || compiled.get("menu")!; }
const readReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeReducedMotion = (notify: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
export function useMorphReducedMotion() { return useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false); }
const subscribeActivityVisibility = (notify: () => void) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const noSubscription = () => () => {};
const readActivityVisibility = () => typeof document === "undefined" || !document.hidden;

export type MorphIconProps = Omit<SVGProps<SVGSVGElement>, "name" | "children"> & {
  name: MorphIconName;
  active?: boolean;
  size?: number | string;
  duration?: number;
  reducedMotion?: boolean;
  animateActivity?: boolean;
  label?: string;
  decorative?: boolean;
  appearance?: Appearance;
};

function MorphGlyph({ name, active = false, size = 24, duration = 260, strokeWidth = 1.5, reducedMotion = false, animateActivity = true, label, decorative, appearance, style, ref, ...props }: MorphIconProps) {
  const definition = getMorphIcon(name), prefersReducedMotion = useMorphReducedMotion();
  const svg = useRef<SVGSVGElement>(null), nodes = useRef<(SVGPathElement | null)[]>([]), position = useRef(active ? 1 : 0), activityEpoch = useRef<number | null>(null);
  const [initialActive] = useState(active);
  const [onScreen, setOnScreen] = useState(true);
  const hasActivity = definition.paths.some(path => path.activity);
  const documentVisible = useSyncExternalStore(hasActivity ? subscribeActivityVisibility : noSubscription, readActivityVisibility, () => true);
  useImperativeHandle(ref, () => svg.current!, []);
  useEffect(() => {
    if (!hasActivity || !svg.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: .01 });
    observer.observe(svg.current);
    return () => observer.disconnect();
  }, [hasActivity]);
  const milliseconds = Number.isFinite(duration) ? Math.max(120, Math.min(1200, duration)) : 260;
  const stroke = typeof strokeWidth === "number" && Number.isFinite(strokeWidth) ? Math.max(.75, Math.min(3, strokeWidth)) : 1.5;
  const dimension = typeof size === "number" ? Number.isFinite(size) ? Math.max(12, Math.min(1024, size)) : 24 : size;
  const explicitHidden = props["aria-hidden"];
  const hidden = decorative ?? (explicitHidden !== undefined ? explicitHidden === true || explicitHidden === "true" : !(label || props["aria-label"] || props["aria-labelledby"]));
  const quiet = prefersReducedMotion || reducedMotion;

  useLayoutEffect(() => {
    let frame = 0;
    const target = active ? 1 : 0, start = position.current;
    const activityRunning = hasActivity && animateActivity && !quiet && onScreen && documentVisible;
    const paint = (progress: number, now?: number) => {
      position.current = progress;
      if (progress === 0 || !activityRunning) activityEpoch.current = null;
      if (progress > 0 && activityRunning && activityEpoch.current === null && now !== undefined) activityEpoch.current = now;
      const activityElapsed = now !== undefined && activityEpoch.current !== null ? now - activityEpoch.current : 0;
      definition.paths.forEach((path, index) => {
        const node = nodes.current[index]; if (!node) return;
        const value = morphPathFrame(path, progress);
        const feedback = activityRunning ? morphActivityFrame(path.activity, value.d, progress, activityElapsed) : { d: value.d, transform: undefined };
        const transform = [value.transform, feedback.transform].filter(Boolean).join(" ");
        node.setAttribute("d", feedback.d); node.setAttribute("opacity", String(value.opacity));
        if (transform) node.setAttribute("transform", transform); else node.removeAttribute("transform");
        if (value.draw !== undefined) {
          node.setAttribute("pathLength", "1"); node.setAttribute("stroke-dasharray", "1"); node.setAttribute("stroke-dashoffset", String(1 - value.draw));
        } else { node.removeAttribute("pathLength"); node.removeAttribute("stroke-dasharray"); node.removeAttribute("stroke-dashoffset"); }
      });
    };
    if (quiet || (!onScreen || !documentVisible) && hasActivity) { paint(target); return; }
    if (start === target && !(active && activityRunning)) { paint(target); return; }
    const begin = performance.now(), runtime = milliseconds * Math.abs(target - start);
    const step = (now: number) => {
      const elapsed = runtime === 0 ? 1 : Math.min(1, (now - begin) / runtime);
      paint(start + (target - start) * morphEase(elapsed), now);
      if (elapsed < 1 || active && activityRunning) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, definition, milliseconds, quiet, animateActivity, hasActivity, name, onScreen, documentVisible]);

  return <svg {...props} ref={svg} data-morph-icon={definition.name} data-state={active ? "active" : "idle"} data-appearance={appearance} viewBox="0 0 24 24" width={dimension} height={dimension} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" role={hidden ? undefined : props.role || "img"} aria-hidden={hidden || undefined} aria-label={hidden ? undefined : label || props["aria-label"] || (props["aria-labelledby"] ? undefined : `${definition.title}: ${definition.states[active ? 1 : 0]}`)} aria-labelledby={hidden ? undefined : props["aria-labelledby"]} focusable="false" style={{ display: "inline-block", flex: "none", verticalAlign: "middle", overflow: "visible", width: dimension, height: dimension, strokeWidth: stroke, ...style }}>
    {definition.paths.map((path, index) => { const initial = morphPathFrame(path, initialActive ? 1 : 0); return <path key={index} ref={node => { nodes.current[index] = node; }} d={initial.d} opacity={initial.opacity} transform={initial.transform} pathLength={initial.draw !== undefined ? 1 : undefined} strokeDasharray={initial.draw !== undefined ? 1 : undefined} strokeDashoffset={initial.draw !== undefined ? 1 - initial.draw : undefined} fill={path.filled ? "currentColor" : "none"} stroke={path.filled ? "none" : undefined} />; })}
  </svg>;
}

/** A controlled icon. Place it inside a native button to give its state an action. */
export function MorphIcon(props: MorphIconProps) { return <MorphGlyph key={props.name} {...props} />; }
export type NamedMorphIconProps = Omit<MorphIconProps, "name">;
function named(name: MorphIconName) {
  function NamedMorphIcon(props: NamedMorphIconProps) { return <MorphIcon name={name} {...props} />; }
  NamedMorphIcon.displayName = getMorphIcon(name).title.replace(/[^a-zA-Z0-9]/g, "") + "MorphIcon";
  return NamedMorphIcon;
}
export const MenuMorphIcon = named("menu"), ChevronMorphIcon = named("chevron"), ArrowMorphIcon = named("arrow"), FullscreenMorphIcon = named("fullscreen"), SidebarMorphIcon = named("sidebar"), LayoutMorphIcon = named("layout"), SortMorphIcon = named("sort"), FilterMorphIcon = named("filter"), FolderMorphIcon = named("folder"), LockMorphIcon = named("lock"), SearchMorphIcon = named("search"), SettingsMorphIcon = named("settings"), ThemeMorphIcon = named("sun-moon"), VisibilityMorphIcon = named("eye"), LinkMorphIcon = named("link"), BookmarkMorphIcon = named("bookmark"), PinMorphIcon = named("pin"), CalendarMorphIcon = named("calendar"), EditMorphIcon = named("edit"), TrashMorphIcon = named("trash");
export const PlayPauseMorphIcon = named("play-pause"), VolumeMorphIcon = named("volume"), MicrophoneMorphIcon = named("microphone"), CameraMorphIcon = named("camera"), RecordMorphIcon = named("record"), RepeatMorphIcon = named("repeat"), ShuffleMorphIcon = named("shuffle"), HeartMorphIcon = named("heart"), StarMorphIcon = named("star"), CheckMorphIcon = named("check"), PlusMorphIcon = named("plus"), CopyMorphIcon = named("copy"), SendMorphIcon = named("send"), DownloadMorphIcon = named("download"), UploadMorphIcon = named("upload"), CloudMorphIcon = named("cloud"), NotificationMorphIcon = named("notification"), MailMorphIcon = named("mail"), MessageMorphIcon = named("message"), UserMorphIcon = named("user");

const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
/** The selected state as a portable SVG, without script, font or network dependencies. */
export function morphIconSvg(name: MorphIconName, active = false, size = 128, strokeWidth = 1.5): string {
  const definition = getMorphIcon(name), dimension = Number.isFinite(size) ? Math.max(12, Math.min(2048, size)) : 128;
  const stroke = Number.isFinite(strokeWidth) ? Math.max(.75, Math.min(3, strokeWidth)) : 1.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${dimension}" height="${dimension}" fill="none" stroke="currentColor" color="#171717" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${escapeXml(definition.title + ": " + definition.states[active ? 1 : 0])}">${definition.paths.map(path => { const value = morphPathFrame(path, active ? 1 : 0); return `<path d="${value.d}" opacity="${value.opacity}"${value.transform ? ` transform="${value.transform}"` : ""}${value.draw !== undefined ? ` pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - value.draw}"` : ""} fill="${path.filled ? "currentColor" : "none"}"${path.filled ? ' stroke="none"' : ""}/>`; }).join("")}</svg>`;
}
