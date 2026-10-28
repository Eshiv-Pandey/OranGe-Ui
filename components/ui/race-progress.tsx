"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { uiClass, type Appearance, type AppearanceProps } from "./appearance";
import { observeRaceMotion } from "./race-motion";
import "../../styles/race-widgets.css";

export type RaceProgressVehicle = "car" | "bike";
export type RaceProgressColors = { base: string; accent: string };
export type RaceProgressProps = AppearanceProps & {
  label: string;
  value?: number;
  max?: number;
  showValue?: boolean;
  vehicle?: RaceProgressVehicle;
  colors?: Partial<RaceProgressColors>;
  renderVehicle?: (context: { vehicle: RaceProgressVehicle; progress: number; appearance: Appearance }) => ReactNode;
};

function color(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized && /^#(?:[\da-f]{3}|[\da-f]{6})$/.test(normalized) ? normalized : fallback;
}

/** Small original silhouettes keep determinate progress independent of vehicle physics. */
function ProgressVehicle({ vehicle }: { vehicle: RaceProgressVehicle }) {
  return <svg viewBox="0 0 100 46" className="race-progress-icon" aria-hidden="true" focusable="false">
    {vehicle === "car" ? <>
      <path d="M7 27H15L24 19H43L49 13H61L67 20L86 25H96V30H7Z" fill="var(--race-base)" />
      <path d="M16 20H28V24H13ZM39 20H55L62 24H34ZM78 23H94V26H78Z" fill="var(--race-accent)" />
      <path d="M43 19L49 13H57L61 20Z" fill="#292b33" />
      <path d="M8 15H12V27H8ZM5 13H24V17H5ZM85 26H97V31H85Z" fill="var(--race-base)" />
      <path d="M22 32H80" stroke="#292b33" strokeWidth="4" />
    </> : <>
      <path d="M23 33L39 18L66 19L78 33H57L42 25L35 33Z" fill="var(--race-base)" />
      <path d="M32 19L48 15L58 18L54 24L37 23ZM60 19L69 12L78 15L72 23Z" fill="var(--race-accent)" />
      <path d="M66 14L77 29M25 31L48 27L59 33" fill="none" stroke="#292b33" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 15L42 7L52 11L60 19L54 22L44 15L39 22L47 29L42 32L31 24Z" fill="#343641" />
      <path d="M56 5C56 0 66 0 67 6L66 12H57Z" fill="var(--race-accent)" /><path d="M59 6H67V9H59Z" fill="#292b33" />
      <path d="M68 12L78 11L82 18L75 18Z" fill="var(--race-base)" />
    </>}
    {[23, 78].map((x) => <g key={x}><circle cx={x} cy="33" r="10" fill="#25262d" stroke="#9ca0a5" strokeWidth="1" /><circle cx={x} cy="33" r="5" fill="#737984" /><circle cx={x} cy="33" r="2" fill="var(--race-accent)" /></g>)}
  </svg>;
}

export function RaceProgress({ label, value = 0, max = 100, showValue = true, vehicle = "car", colors, renderVehicle, appearance = "polished", className }: RaceProgressProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const maximum = Number.isFinite(max) && max > 0 ? max : 100;
  const current = Number.isFinite(value) ? Math.max(0, Math.min(maximum, value)) : 0;
  const progress = current / maximum;
  const percent = Math.round(progress * 100);
  const name = label.trim() || "Race progress";
  useEffect(() => {
    if (!ref.current) return;
    const observer = observeRaceMotion(ref.current);
    return () => observer.destroy();
  }, []);
  return <div ref={ref} className={uiClass("race-progress", className)} data-appearance={appearance} data-motion="paused" style={{ "--race-progress": progress, "--race-percent": `${progress * 100}%`, "--race-base": color(colors?.base, "#dc602d"), "--race-accent": color(colors?.accent, "#f4cf83") } as CSSProperties}>
    <div className="race-progress-label"><span id={id}>{name}</span>{showValue && <span>{percent}%</span>}</div>
    <div className="race-progress-stage" role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={current} aria-valuetext={`${percent}% complete`}>
      <div className="race-progress-track" aria-hidden="true"><span className="race-progress-fill" /><span className="race-progress-start" /><span className="race-progress-finish" /></div>
      <span className="race-progress-vehicle" data-vehicle={vehicle} aria-hidden="true"><span className="race-progress-vehicle-art">{renderVehicle ? renderVehicle({ vehicle, progress, appearance }) : <ProgressVehicle vehicle={vehicle} />}</span></span>
    </div>
  </div>;
}
