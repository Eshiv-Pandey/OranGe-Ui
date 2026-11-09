"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Portable React components use native anchors. */

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import "../../styles/neon-sign-404.css";

export type NeonFlickerOptions = {
  enabled?: boolean;
  flickerInterval?: readonly [number, number];
  startup?: boolean;
  sound?: boolean;
  active?: boolean;
  element?: RefObject<HTMLElement | null>;
};

/** One pausable timeout chain. A sequence can only darken its selected tube. */
export function useNeonFlicker(count: number, options: NeonFlickerOptions = {}) {
  const { enabled = true, startup = true, sound = false, active = true, element } = options;
  const minimum = Math.max(300, options.flickerInterval?.[0] ?? 3000);
  const maximum = Math.max(minimum, options.flickerInterval?.[1] ?? 8000);
  const [off, setOff] = useState<readonly number[]>([]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = !element?.current || typeof IntersectionObserver !== "function";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let due = 0, remaining = 60, destroyed = false;
    let next = () => boot(0);
    let audio: AudioContext | undefined;
    const oscillators = new Set<OscillatorNode>();
    const canRun = () => enabled && active && count > 0 && !media.matches && visible && document.visibilityState !== "hidden";
    function click() {
      if (!sound || audio?.state !== "running") return;
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = "square"; oscillator.frequency.value = 92;
      gain.gain.setValueAtTime(.012, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .035);
      oscillator.connect(gain); gain.connect(audio.destination); oscillators.add(oscillator);
      oscillator.onended = () => { oscillators.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(); oscillator.stop(audio.currentTime + .04);
    }
    function light(index: number, dark: boolean) { if (!destroyed) { setOff(dark ? [index] : []); click(); } }
    function arm() {
      if (!canRun() || destroyed || timer !== undefined) return;
      due = performance.now() + remaining;
      timer = setTimeout(() => { timer = undefined; next(); }, remaining);
    }
    function schedule(delay: number, callback: () => void) { remaining = delay; next = callback; arm(); }
    function idle() { light(0, false); schedule(minimum + Math.random() * (maximum - minimum), outage); }
    function sequence(index: number, steps: readonly [boolean, number][], done: () => void, step = 0) {
      if (step >= steps.length) { done(); return; }
      light(index, steps[step][0]); schedule(steps[step][1], () => sequence(index, steps, done, step + 1));
    }
    function outage() {
      const index = Math.floor(Math.random() * count);
      const quick = Math.random() < 1 / 6;
      sequence(index, quick ? [[true, 65], [false, 80]] : [[true, 65], [false, 85], [true, 95], [false, 60], [true, 400 + Math.random() * 1100], [false, 75], [true, 55], [false, 105]], idle);
    }
    function boot(index: number) {
      if (!startup || index >= count) { idle(); return; }
      sequence(index, [[true, 60], [false, 65], [true, 45], [false, 130]], () => boot(index + 1));
    }
    function synchronize() {
      if (!canRun() && timer !== undefined) { clearTimeout(timer); timer = undefined; remaining = Math.max(0, due - performance.now()); }
      if (media.matches || !enabled || !active) setOff([]);
      arm();
    }
    function unlock() {
      if (!sound) return;
      audio ??= new AudioContext();
      void audio.resume().catch(() => {});
    }
    const observer = element?.current && typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); synchronize(); }) : null;
    if (element?.current) observer?.observe(element.current);
    document.addEventListener("visibilitychange", synchronize); media.addEventListener("change", synchronize);
    if (sound) { document.addEventListener("pointerdown", unlock); document.addEventListener("keydown", unlock); }
    synchronize();
    return () => {
      destroyed = true; if (timer !== undefined) clearTimeout(timer); observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize); media.removeEventListener("change", synchronize);
      document.removeEventListener("pointerdown", unlock); document.removeEventListener("keydown", unlock);
      oscillators.forEach(oscillator => oscillator.stop()); void audio?.close().catch(() => {});
    };
  }, [count, enabled, startup, sound, active, element, minimum, maximum]);
  return enabled && active ? off.filter(index => index < count) : [];
}

const tubes: Record<string, string> = {
  "4": "M70 10 18 78Q14 84 23 84H85M70 10V128Q70 139 61 136Q53 134 60 127",
  "0": "M53 12C18 12 17 33 17 71V101C17 136 81 138 81 102V46C81 20 76 12 53 12Q43 12 46 21Q49 28 55 22",
  "1": "M29 31 52 12V130H75M27 130H52Q59 131 56 138",
  "2": "M18 35C20 3 80 2 80 36C80 61 16 86 16 127H82Q91 128 85 137",
  "3": "M18 18H75L46 66C99 54 95 136 42 131Q14 128 18 110M46 66Q39 66 42 72",
  "5": "M81 14H20V66C90 41 100 135 46 132Q15 133 17 113M81 14Q91 14 85 23",
  "6": "M78 20C27 -9 15 56 16 99C17 145 83 143 83 97C83 61 16 61 16 99",
  "7": "M17 14H83L34 133Q31 139 26 133",
  "8": "M51 68C3 65 4 10 51 10C95 10 96 65 51 68C-2 71 4 134 51 134C98 134 104 71 51 68",
  "9": "M82 46C82 -4 17 1 17 46C17 91 82 89 82 46V91C82 133 58 143 27 124",
  O: "M51 12C20 12 16 30 16 72S20 133 51 133 85 114 85 72 82 12 51 12",
  P: "M20 133V14H54C99 14 99 71 54 71H20Q12 71 16 79",
  E: "M81 14H20V132H81M20 71H69Q77 71 74 79",
  N: "M18 132V14L83 132V14Q83 6 75 11",
  A: "M13 133 46 14Q51 6 56 14L89 133M27 86H75",
  B: "M18 132V14H52C93 14 93 67 52 67H18M52 67C101 67 101 132 52 132H18",
  C: "M83 27C60 -4 16 11 16 70S58 149 83 118",
  D: "M19 132V14H43C96 14 96 132 43 132H19",
  F: "M81 14H20V132M20 68H69",
  G: "M83 28C54 -3 16 11 16 71S79 153 83 99V76H53",
  H: "M18 14V133M83 14V133M18 72H83",
  I: "M23 14H78M51 14V133M23 133H78",
  J: "M23 14H82M66 14V107C66 145 16 140 16 110",
  K: "M19 14V133M81 14 19 75 85 133",
  L: "M20 14V132H81Q89 132 84 140",
  M: "M14 133V14L50 75 86 14V133",
  Q: "M51 12C20 12 16 30 16 72S20 133 51 133 85 114 85 72 82 12 51 12M59 109 91 140",
  R: "M20 133V14H54C99 14 99 71 54 71H20M52 71 87 133",
  S: "M80 25C54 -2 17 12 17 42C17 75 84 67 84 102C84 140 41 146 17 120",
  T: "M12 14H89M51 14V132Q51 141 43 135",
  U: "M18 14V103C18 144 83 144 83 103V14",
  V: "M14 14 50 133 86 14",
  W: "M10 14 26 133 50 71 74 133 90 14",
  X: "M15 14 85 133M85 14 15 133",
  Y: "M14 14 50 72 86 14M50 72V133",
  Z: "M17 14H85L15 133H85",
};
const pixels: Record<string, string[]> = {
  "4": ["10010","10010","10010","11111","00010","00010","00010"], "0": ["01110","10001","10011","10101","11001","10001","01110"],
  O: ["01110","10001","10001","10001","10001","10001","01110"], P: ["11110","10001","10001","11110","10000","10000","10000"],
  E: ["11111","10000","10000","11110","10000","10000","11111"], N: ["10001","11001","11001","10101","10011","10011","10001"],
  A: ["01110","10001","10001","11111","10001","10001","10001"], B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01111","10000","10000","10000","10000","10000","01111"], D: ["11110","10001","10001","10001","10001","10001","11110"],
  F: ["11111","10000","10000","11110","10000","10000","10000"], G: ["01111","10000","10000","10111","10001","10001","01111"],
  H: ["10001","10001","10001","11111","10001","10001","10001"], I: ["11111","00100","00100","00100","00100","00100","11111"],
  J: ["00111","00010","00010","00010","00010","10010","01100"], K: ["10001","10010","10100","11000","10100","10010","10001"],
  L: ["10000","10000","10000","10000","10000","10000","11111"], M: ["10001","11011","10101","10101","10001","10001","10001"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"], R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"], T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"], V: ["10001","10001","10001","10001","10001","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"], X: ["10001","10001","01010","00100","01010","10001","10001"],
  Y: ["10001","10001","01010","00100","00100","00100","00100"], Z: ["11111","00001","00010","00100","01000","10000","11111"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"], "2": ["01110","10001","00001","00010","00100","01000","11111"],
  "3": ["11110","00001","00001","01110","00001","00001","11110"], "5": ["11111","10000","10000","11110","00001","00001","11110"],
  "6": ["01110","10000","10000","11110","10001","10001","01110"], "7": ["11111","00001","00010","00100","01000","01000","01000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"], "9": ["01110","10001","10001","01111","00001","00001","01110"],
};
export type NeonSign404Props = {
  digits?: string; color?: string; borderColor?: string; glow?: number; flicker?: boolean;
  flickerInterval?: readonly [number, number]; size?: "sm" | "md" | "lg" | number;
  sound?: boolean; pixelated?: boolean; appearance?: Appearance; className?: string; style?: CSSProperties;
};

export function NeonSign404({ digits = "404", color, borderColor, glow = .8, flicker = true, flickerInterval, size = "md", sound = false, pixelated = false, appearance, className, style }: NeonSign404Props) {
  const characters = Array.from(digits.toUpperCase()).slice(0, 8);
  const root = useRef<HTMLDivElement>(null), id = useId().replaceAll(":", "");
  const off = useNeonFlicker(characters.length, { enabled: flicker, flickerInterval, sound, element: root });
  const height = Math.max(1, characters.length) * 154 + 94, pixel = pixelated || appearance === "pixel";
  const strength = Math.max(0, Math.min(1, glow)), width = typeof size === "number" ? Math.max(100, Math.min(700, size)) : { sm: 180, md: 260, lg: 340 }[size];
  const variables = { "--neon-strength": strength, "--neon-width": `${width}px`, ...(color ? { "--neon-color": color } : {}), ...(borderColor ? { "--neon-border-color": borderColor } : {}), ...style } as CSSProperties;
  const border = `M174 32H111L96 47V${height - 40}L110 ${height - 25}H174Q185 ${height - 25} 178 ${height - 34}Q169 ${height - 45} 167 ${height - 37}M190 ${height - 25}H245L260 ${height - 40}V47L245 32H190Q179 32 187 42Q195 52 199 43M174 32Q184 32 176 42Q168 52 164 43M190 ${height - 25}Q179 ${height - 25} 187 ${height - 34}Q195 ${height - 45} 199 ${height - 37}`;
  return <div ref={root} className={cn("neon-sign", className)} style={variables} data-off-count={off.length} data-pixel={pixel}>
    <span className="sr-only">{digits} neon sign</span>
    <svg viewBox={`0 0 320 ${height}`} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-bloom`} x="-150%" y="-80%" width="400%" height="260%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={pixel ? 3 : 12} result="wide" /><feGaussianBlur in="SourceGraphic" stdDeviation={pixel ? 1 : 3} result="tight" /><feMerge><feMergeNode in="wide" /><feMergeNode in="tight" /></feMerge></filter>
        <linearGradient id={`${id}-panel`} x2="1" y2="1"><stop stopColor="#202329" /><stop offset=".45" stopColor="#0b0e10" /><stop offset="1" stopColor="#161419" /></linearGradient>
        <radialGradient id={`${id}-spill`}><stop stopColor="var(--neon-tube)" stopOpacity=".2" /><stop offset="1" stopColor="var(--neon-tube)" stopOpacity="0" /></radialGradient>
        <pattern id={`${id}-brick`} width="66" height="46" patternUnits="userSpaceOnUse"><rect width="66" height="46" fill="#14100e" /><path d="M0 0H66M0 23H66M0 46H66M32 0V23M0 23V46M66 23V46" stroke="#050505" strokeWidth="3" /></pattern>
      </defs>
      <rect width="70" height={height} fill={`url(#${id}-brick)`} /><ellipse className="neon-sign-spill" cx="144" cy={height / 2} rx="145" ry={height / 2} fill={`url(#${id}-spill)`} style={{ opacity: strength * (1 - off.length / Math.max(1, characters.length) * .55) }} />
      <path d="M52 72H103V86H52ZM51 78V130H62V84M52 365H100V378H52Z" fill="#17191c" />
      <path d={`M112 24H246L271 49V${height - 39}L247 ${height - 15}H111L85 ${height - 40}V49Z`} fill="#000" transform="translate(5 7)" />
      <path d={`M112 24H246L271 49V${height - 39}L247 ${height - 15}H111L85 ${height - 40}V49Z`} fill={`url(#${id}-panel)`} />
      <path d={border} className="neon-sign-border-glow" filter={`url(#${id}-bloom)`} /><path d={border} className="neon-sign-border" /><path d={border} className="neon-sign-border-core" />
      {characters.map((character, index) => {
        const path = tubes[character], mask = pixels[character], isOff = off.includes(index);
        const artwork = pixel && mask ? mask.flatMap((row, y) => Array.from(row).map((bit, x) => bit === "1" ? <rect key={`${x}-${y}`} x={12 + x * 16} y={12 + y * 17} width="14" height="15" /> : null)) : path ? <path d={path} /> : <text x="50" y="104" textAnchor="middle" fontSize="100">{character}</text>;
        return <g key={`${index}-${character}`} transform={`translate(129 ${62 + index * 154})`} className="neon-sign-digit" data-off={isOff}>
          <g className="neon-sign-glow" filter={`url(#${id}-bloom)`}>{artwork}</g>
          <g className="neon-sign-glass">{artwork}</g><g className="neon-sign-core">{artwork}</g>
        </g>;
      })}
      <circle cx="105" cy="56" r="2" fill="#717171" /><circle cx="249" cy={height - 50} r="2" fill="#717171" />
    </svg>
  </div>;
}

export function NeonNotFound({ reportHref = "https://github.com/Eshiv-Pandey/OranGe-Ui/issues", ...props }: NeonSign404Props & { reportHref?: string }) {
  return <main className="neon-recovery"><NeonSign404 {...props} /><div className="neon-recovery-copy"><h1>This page is closed for the night.</h1><p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p><a className="neon-home" href="/">Take me home <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></a><a className="neon-report" href={reportHref}>Report a broken link</a></div></main>;
}
