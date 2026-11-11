"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { bounded, graphemes } from "./interaction-utils";
import "../../styles/interaction-text.css";

export type CipherTextProps = AppearanceProps & { text: string; duration?: number; trigger?: "mount" | "hover"; replayKey?: string | number; characters?: string; onComplete?: () => void; theme?: CreativeTheme; style?: CSSProperties };
export function CipherText({ text, duration = 1500, trigger = "mount", replayKey = 0, characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&?", onComplete, theme = "auto", appearance = "polished", className, style }: CipherTextProps) {
  const root = useRef<HTMLSpanElement>(null), run = useRef({ active: trigger === "mount", start: -1, last: -1, complete: false });
  const completeCallback = useRef(onComplete);
  const [frame, setFrame] = useState({ source: text, display: text }), resolved = useCreativeTheme(theme);
  useEffect(() => { completeCallback.current = onComplete; }, [onComplete]);
  useEffect(() => {
    const reduced = root.current?.dataset.motion === "reduced";
    run.current = { active: trigger === "mount" && !reduced, start: -1, last: -1, complete: reduced };
    if (reduced) completeCallback.current?.();
  }, [text, duration, trigger, replayKey]);
  const finish = () => { if (run.current.complete) return; run.current.complete = true; run.current.active = false; setFrame({ source: text, display: text }); completeCallback.current?.(); };
  useMotionActivity(root, {
    onStatus: (status) => { if (status === "reduced") finish(); },
    onFrame: ({ time }) => {
      const state = run.current; if (!state.active || state.complete) return;
      if (state.start < 0) state.start = time;
      const progress = (time - state.start) / bounded(duration, 100, 10000, 1500);
      if (progress >= 1) { finish(); return; }
      if (time - state.last < 33) return; state.last = time;
      const letters = graphemes(text), alphabet = graphemes(characters || "01");
      setFrame({ source: text, display: letters.map((letter, index) => /\s/.test(letter) || index < progress * letters.length ? letter : alphabet[(Math.floor(time / 33) * 11 + index * 17) % alphabet.length]).join("") });
    },
  });
  const replay = () => { if (trigger !== "hover" || root.current?.dataset.motion === "reduced") return; run.current = { active: true, start: -1, last: -1, complete: false }; };
  return <span ref={root} className={["creative-surface interaction-surface cipher-text", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} style={style} tabIndex={trigger === "hover" ? 0 : undefined} onPointerEnter={replay} onFocus={replay}><span className="ix-sr">{text}</span><span aria-hidden="true">{frame.source === text ? frame.display : text}</span></span>;
}
