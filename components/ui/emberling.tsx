"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { clamp, useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { elementalShape } from "./elemental-shape";
import { ShaderCanvas } from "./shader-canvas";
import { elementalOrb } from "./shader-canvas/elemental-orb";
import "../../styles/emberling.css";

export type EmberlingVariant = "ember" | "water" | "aqua" | "custom" | "prism";
export const ELEMENTAL_EXPRESSIONS = ["happy", "calm", "excited", "wink", "surprised", "grumpy"] as const;
export type EmberlingExpression = typeof ELEMENTAL_EXPRESSIONS[number];
export type EmberlingProps = {
  size?: number; variant?: EmberlingVariant; color?: string; eyeColor?: string;
  colors?: readonly string[]; interactive?: boolean; blink?: boolean; expression?: EmberlingExpression;
  shape?: "character" | "orb"; speed?: number; animate?: boolean;
  theme?: CreativeTheme; appearance?: Appearance; className?: string;
};
const ORB_MODULES = [elementalOrb];

/** Living fire and water friends. The full face and silhouette also render without JavaScript. */
export function Emberling({ size = 220, variant = "ember", color = "#ef6d50", eyeColor, colors = ["#9075ea", "#77d9df", "#f1a2cf"], interactive = true, blink = true, expression = "happy", shape = "character", speed = 1, animate = true, theme = "auto", appearance = "polished", className }: EmberlingProps) {
  const id = useId().replace(/:/g, ""), resolved = useCreativeTheme(theme);
  const root = useRef<HTMLDivElement>(null), face = useRef<SVGGElement>(null), character = useRef<SVGGElement>(null);
  const shell = useRef<SVGPathElement>(null), core = useRef<SVGPathElement>(null), clip = useRef<SVGPathElement>(null);
  const gaze = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, at: -10000 });
  const water = variant === "water" || variant === "aqua", simple = variant === "aqua", orb = shape === "orb";
  const body = variant === "custom" ? color : variant === "prism" ? colors[0] || "#9075ea" : water ? simple ? "#159cdb" : "#58cdec" : "#f24450";
  const inner = variant === "custom" ? color : variant === "prism" ? colors[1] || "#77d9df" : water ? simple ? "#45d9ee" : "#0a86b9" : "#ffd52c";
  const center = variant === "prism" ? colors[2] || "#f1a2cf" : water ? simple ? "#59e1ea" : "#0474a5" : "#ffac19";
  const feet = water ? simple ? "#159bdb" : "#62cce5" : variant === "ember" ? "#fff1a1" : inner;
  const ink = eyeColor ?? (simple || variant === "prism" ? "#272340" : water ? "#ffffff" : "#942e39");
  const name = water ? simple ? "Aqua" : "Water" : variant === "ember" ? "Fire" : variant === "prism" ? "Prism" : "Custom";

  useEffect(() => {
    if (!interactive) return;
    const move = (event: PointerEvent) => {
      const element = root.current;
      if (!element || element.dataset.motion !== "running") return;
      const box = element.getBoundingClientRect();
      gaze.current.targetX = clamp((event.clientX - box.x - box.width / 2) / Math.max(1, box.width), -1, 1) * 8;
      gaze.current.targetY = clamp((event.clientY - box.y - box.height / 2) / Math.max(1, box.height), -1, 1) * 5;
      gaze.current.at = performance.now();
    };
    const settle = () => { gaze.current.at = -10000; };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", settle);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", settle); };
  }, [interactive]);

  function draw(time: number, delta: number, still = false) {
    const t = time / 1000 * clamp(speed, .1, 3), outline = elementalShape(t, water, orb);
    shell.current?.setAttribute("d", outline); clip.current?.setAttribute("d", outline);
    core.current?.setAttribute("d", elementalShape(t + .7, water, orb));
    const look = gaze.current, steering = !still && interactive && performance.now() - look.at < 2800;
    const x = still ? 0 : steering ? look.targetX : Math.sin(t * .63) * 3.5;
    const y = still ? 0 : steering ? look.targetY : Math.sin(t * .46 + 1) * 1.8;
    const ease = still ? 1 : 1 - Math.exp(-delta / 95);
    look.x += (x - look.x) * ease; look.y += (y - look.y) * ease;
    face.current?.setAttribute("transform", `translate(${look.x.toFixed(2)} ${look.y.toFixed(2)})`);
    character.current?.setAttribute("transform", "translate(0 0)");
  }
  useMotionActivity(root, {
    onFrame: ({ time, delta }) => { if (animate) draw(time, delta); },
    onStatus: (status) => { if (status === "reduced") draw(0, 0, true); },
  });
  useEffect(() => { if (!animate) draw(0, 0, true); }, [animate]); // eslint-disable-line react-hooks/exhaustive-deps

  const outline = elementalShape(0, water, orb), closed = expression === "calm" || expression === "grumpy";
  return <div ref={root} className={cn("emberling", className)} role="img" aria-label={`${name} elemental with a ${expression} expression`} data-slot="emberling" data-theme={resolved} data-appearance={appearance} data-blink={blink} data-variant={variant} data-shape={shape} data-animate={animate} data-expression={expression} style={{ width: clamp(size, 48, 640), "--ember-color": body } as CSSProperties}>
    {orb && <div className="elemental-orb-layer" aria-hidden="true"><ShaderCanvas modules={ORB_MODULES} source={{ type: "elemental-orb", colors: [body, inner, center], speed }} paused={!animate} theme={resolved} appearance={appearance} /></div>}
    <svg viewBox={orb ? "0 25 240 240" : "0 0 240 300"} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id + "-shell"} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={body} /><stop offset="1" stopColor={body} /></linearGradient>
        <clipPath id={id + "-clip"}><path ref={clip} d={outline} /></clipPath>
      </defs>
      <ellipse className="emberling-shadow" cx="122" cy={orb ? 252 : 280} rx={orb ? 56 : 48} ry="5.5" fill={water ? "#128597" : "#77682e"} opacity=".16" />
      <g ref={character}>
        {!orb && <g stroke={water ? "#138bb5" : variant === "ember" ? "#f34c50" : body} strokeWidth="2" strokeLinejoin="round" fill={feet}>
          <path d="M91 191C82 211 83 234 82 252L80 271Q94 280 107 270L112 254 130 254 135 272Q149 280 161 269L158 247C162 223 155 205 148 194Z" />
          <path className="elemental-arm elemental-arm-left" d="M86 211C74 213 63 207 56 196 51 187 41 190 39 199 34 195 28 199 30 207 33 223 62 237 81 235Z" />
          <path className="elemental-arm elemental-arm-right" d="M153 210C170 213 183 225 182 234 180 246 166 244 157 233Z" />
          {simple && <path d="M119 223C100 234 94 254 118 256 142 257 136 234 119 223Z" fill="#45d7e9" stroke="none" />}
        </g>}
        <path ref={shell} className="emberling-shell" d={outline} fill={orb ? "none" : `url(#${id}-shell)`} />
        <g clipPath={`url(#${id}-clip)`}>
          {!orb && <><path ref={core} className="elemental-inner-flame" d={elementalShape(.7, water)} transform="translate(120 199) scale(.8 .82) translate(-120 -199)" fill={inner} /><path d="M65 150C65 121 86 99 118 99 151 96 178 122 179 151 182 181 156 202 122 202 84 203 63 182 65 150Z" fill={center} /></>}
          {water && !simple && !orb && <g className="elemental-glints" fill="#e7fdff"><ellipse cx="76" cy="112" rx="12" ry="5" transform="rotate(-34 76 112)" /><circle cx="95" cy="96" r="4" /><path d="M46 139q-4 26 7 37" stroke="#e7fdff" strokeWidth="2" fill="none" strokeLinecap="round" /></g>}
          <g ref={face} className="emberling-face">
            <g className="emberling-eyes" fill={ink}>
              {closed ? <g fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"><path d={expression === "grumpy" ? "m77 141 21 11-19-1" : "M77 150q12-12 23 0"} /><path d={expression === "grumpy" ? "m143 152 20-11-2 11" : "M141 150q12-12 23 0"} /></g> : simple ? <><ellipse cx="89" cy="149" rx="9.5" ry={expression === "surprised" ? 17 : 14} />{expression === "wink" ? <path d="M143 151q10-9 20 0" fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" /> : <ellipse cx="153" cy="149" rx="9.5" ry={expression === "surprised" ? 17 : 14} />}</> : <>
                <ellipse cx="89" cy="147" rx="17" ry="20" fill="#fffdf0" />
                {expression === "wink" ? <path d="m143 150 19-5-15 11" fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" /> : <ellipse cx="154" cy="149" rx="16" ry="19" fill="#fffdf0" />}
                {expression === "excited" ? <><path d="m89 132 3 10 10 3-10 3-3 12-3-11-9-3 9-3Z" /><path d="m154 136 3 8 8 3-8 3-3 9-3-9-8-3 8-3Z" /></> : <><ellipse cx="91" cy="149" rx="10" ry="13" fill={water ? "#06516d" : ink} /><circle cx="87" cy="142" r="4" fill="#fff" />{expression !== "wink" && <><ellipse cx="155" cy="150" rx="9" ry="12" fill={water ? "#06516d" : ink} /><circle cx="152" cy="144" r="3.5" fill="#fff" /></>}</>}
              </>}
            </g>
            {expression === "surprised" ? <ellipse cx="122" cy="179" rx="7" ry="9" fill={ink} /> : expression === "grumpy" ? <path d="M103 184q19-8 38 0m-37-6-2 11m38-11 2 11" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" /> : expression === "excited" ? <path d="M107 175Q122 183 137 175C134 195 111 196 107 175Z" fill="#fffef1" /> : <path d={simple ? "M109 177q12 17 25-1" : "M109 177q12 12 25-1"} fill="none" stroke={ink} strokeWidth={simple ? 5 : 3.8} strokeLinecap="round" />}
            {!simple && <g stroke={water ? "#c2f2ff" : "#f77136"} strokeWidth="2" strokeLinecap="round" opacity=".7"><path d="m72 169 4-2m-2 7 5-3m84-1 4 2m-5 3 4 2" /></g>}
          </g>
        </g>
        <g className="emberling-cinder emberling-cinder-one" fill={water ? body : "#fb6e49"}><path d={water ? "M35 70C21 61 18 78 28 80Q40 82 35 70Z" : "M43 60q-12-9-4-19 8 8 4 19Z"} /></g>
        <g className="emberling-cinder emberling-cinder-two" fill={water ? inner : "#ffc746"}><path d={water ? "M190 49C181 37 192 26 201 32 214 40 202 53 190 49Z" : "M199 61q-5-10 3-17 6 10-3 17Z"} /></g>
        <g className="emberling-cinder emberling-cinder-three" fill={body}><circle cx="218" cy="120" r="3" /></g>
      </g>
    </svg>
  </div>;
}
