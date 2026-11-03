"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { clamp, useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import "../../styles/emberling.css";

export type EmberlingVariant = "ember" | "custom" | "prism";
export type EmberlingProps = {
  size?: number; variant?: EmberlingVariant; color?: string; eyeColor?: string;
  colors?: readonly string[]; interactive?: boolean; blink?: boolean;
  theme?: CreativeTheme; appearance?: Appearance; className?: string;
};

/** Original folded-flame geometry. The complete character is also rendered on the server. */
export function Emberling({ size = 200, variant = "ember", color = "#ef853c", eyeColor = "#fff3d6", colors = ["#ff9c66", "#f5d787", "#83cdbb"], interactive = true, blink = true, theme = "auto", appearance = "polished", className }: EmberlingProps) {
  const id = useId().replace(/:/g, ""), resolved = useCreativeTheme(theme);
  const root = useRef<HTMLDivElement>(null), face = useRef<SVGGElement>(null), ember = useRef<SVGGElement>(null);
  const gaze = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const body = variant === "custom" ? color : variant === "prism" ? colors[0] || "#ff9c66" : "#ef853c";
  const tip = variant === "prism" ? colors[1] || body : "#ffdd96";
  const fold = variant === "prism" ? colors[2] || body : body;
  useEffect(() => {
    const element = root.current;
    if (!element || !interactive) return;
    const move = (event: PointerEvent) => {
      if (element.dataset.motion !== "running") return;
      const box = element.getBoundingClientRect();
      gaze.current.targetX = clamp((event.clientX - box.x - box.width / 2) / Math.max(1, box.width), -1, 1) * 7;
      gaze.current.targetY = clamp((event.clientY - box.y - box.height / 2) / Math.max(1, box.height), -1, 1) * 5;
    };
    const settle = () => { gaze.current.targetX = gaze.current.targetY = 0; };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", settle);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", settle); settle(); };
  }, [interactive]);
  useMotionActivity(root, {
    onFrame: ({ delta }) => {
      const look = gaze.current, ease = 1 - Math.exp(-delta / 110);
      look.x += ((interactive ? look.targetX : 0) - look.x) * ease;
      look.y += ((interactive ? look.targetY : 0) - look.y) * ease;
      face.current?.setAttribute("transform", `translate(${look.x.toFixed(2)} ${look.y.toFixed(2)})`);
      ember.current?.setAttribute("transform", `rotate(${(look.x * .35).toFixed(2)} 120 162)`);
    },
    onStatus: (status) => {
      if (status === "reduced") {
        gaze.current = { x: 0, y: 0, targetX: 0, targetY: 0 };
        face.current?.removeAttribute("transform"); ember.current?.removeAttribute("transform");
      }
    },
  });
  return <div ref={root} className={cn("emberling", className)} role="img" aria-label="Emberling, a curious folded-flame character" data-slot="emberling" data-theme={resolved} data-appearance={appearance} data-blink={blink} data-variant={variant} style={{ width: clamp(size, 48, 640), "--ember-color": body } as CSSProperties}>
    <svg viewBox="0 0 240 260" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id + "-shell"} x1=".15" y1="0" x2=".85" y2="1"><stop stopColor={tip} /><stop offset=".43" stopColor={body} /><stop offset="1" stopColor={fold} /></linearGradient>
        <linearGradient id={id + "-fold"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff7d4" stopOpacity=".8" /><stop offset=".55" stopColor={tip} stopOpacity=".2" /><stop offset="1" stopColor="#45272c" stopOpacity=".28" /></linearGradient>
        <linearGradient id={id + "-shade"} x1="0" y1="0" x2="1" y2=".4"><stop stopColor="#38232d" stopOpacity=".48" /><stop offset="1" stopColor="#50332c" stopOpacity="0" /></linearGradient>
        <linearGradient id={id + "-visor"} x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#422f32" /><stop offset="1" stopColor="#211f28" /></linearGradient>
        <radialGradient id={id + "-shadow"}><stop stopColor="#19141b" stopOpacity=".28" /><stop offset="1" stopColor="#19141b" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse className="emberling-shadow" cx="121" cy="237" rx="61" ry="9" fill={`url(#${id}-shadow)`} />
      <g className="emberling-float">
        <g ref={ember}>
          <path className="emberling-shell" d="M120 215C78 215 51 189 53 155C54 125 77 112 79 88C81 73 75 58 77 50C101 64 111 79 112 93C134 68 154 51 149 24C178 43 193 78 182 111C207 138 203 164 189 186C174 207 146 218 120 215Z" fill={`url(#${id}-shell)`} />
          <path d="M149 24C152 54 130 83 112 102L130 145L182 111C192 78 178 43 149 24Z" fill={`url(#${id}-fold)`} />
          <path d="M77 50C84 84 72 115 61 134C41 175 65 210 111 215L91 164L112 102C110 78 94 61 77 50Z" fill={`url(#${id}-shade)`} />
          <path d="M60 158L96 172L121 212L78 190Z" fill={fold} opacity=".65" />
          <path d="M179 120L153 166L121 212C166 211 194 185 194 160Z" fill={`url(#${id}-fold)`} />
          <path d="M150 38C150 64 128 86 119 100M183 130C192 147 190 159 186 167" fill="none" stroke="#fff6d9" strokeWidth="2" strokeLinecap="round" opacity=".67" />
          <g ref={face} className="emberling-face">
            <path d="M84 140Q82 127 97 124L143 121Q161 121 160 139L156 158Q154 169 142 170L104 169Q92 168 89 158Z" fill={`url(#${id}-visor)`} />
            <path d="M91 131Q118 122 150 129" fill="none" stroke="#fff2cc" strokeOpacity=".18" strokeWidth="1.5" />
            <g className="emberling-eyes" fill={eyeColor}>
              <path d="M102 140Q102 137 105 137Q109 137 109 141L109 149Q109 152 106 152Q102 152 102 148Z" />
              <path d="M135 139Q135 136 138 136Q142 136 142 140L142 148Q142 152 138 152Q135 152 135 148Z" />
            </g>
            <path d="M117 156Q121 159 125 155" fill="none" stroke={eyeColor} strokeWidth="1.8" strokeLinecap="round" opacity=".65" />
          </g>
          <path d="M99 191L119 207L143 184" fill="none" stroke="#fff1c5" strokeWidth="1.3" opacity=".4" />
        </g>
        <g className="emberling-cinder emberling-cinder-one"><path d="M49 81L54 91L49 100L44 91Z" fill={tip} /></g>
        <g className="emberling-cinder emberling-cinder-two"><path d="M196 69L200 76L196 82L193 76Z" fill={body} /></g>
      </g>
    </svg>
  </div>;
}
