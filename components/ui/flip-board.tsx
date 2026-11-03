"use client";

import { useId, useRef, useState, type CSSProperties } from "react";
import type { AppearanceProps } from "./appearance";
import { useCreativeTheme, type CreativeTheme } from "./creative-surface";
import { useMotionActivity } from "./use-motion-activity";
import { bounded, graphemes } from "./interaction-utils";
import { InteractionIcon } from "./interaction-icons";
import "../../styles/interaction-text.css";

export type FlipBoardProps = AppearanceProps & { phrases?: readonly string[]; interval?: number; autoPlay?: boolean; showControls?: boolean; onPhraseChange?: (phrase: string, index: number) => void; theme?: CreativeTheme; label?: string };
const DEFAULT_PHRASES = ["MAKE GOOD THINGS", "STAY CURIOUS", "KEEP EXPLORING"];
export function FlipBoard(props: FlipBoardProps) {
  return <FlipBoardContent key={(props.phrases ?? DEFAULT_PHRASES).join("\u0000")} {...props} />;
}
function FlipBoardContent({ phrases = DEFAULT_PHRASES, interval = 3200, autoPlay = true, showControls = true, onPhraseChange, theme = "auto", appearance = "polished", className, label = "Split-flap message board" }: FlipBoardProps) {
  const words = phrases.length ? phrases : [""], [state, setState] = useState({ current: 0, previous: 0, turn: 0 }), [paused, setPaused] = useState(false);
  const root = useRef<HTMLElement>(null), position = useRef(0), elapsed = useRef(0), resolved = useCreativeTheme(theme), id = useId();
  function advance() { const previous = position.current, current = (previous + 1) % words.length; position.current = current; elapsed.current = 0; setState((old) => ({ current, previous, turn: old.turn + 1 })); onPhraseChange?.(words[current], current); }
  useMotionActivity(root, { onFrame: ({ delta }) => { if (!autoPlay || paused || words.length < 2) return; elapsed.current += delta; if (elapsed.current >= bounded(interval, 1000, 30000, 3200)) advance(); } });
  const maxLength = Math.max(1, ...words.map((word) => graphemes(word).length)), columns = Math.min(18, maxLength), slots = Math.ceil(maxLength / columns) * columns;
  const current = graphemes(words[state.current]), previous = graphemes(words[state.previous]);
  return <section ref={root} className={["creative-surface interaction-surface flip-board", className].filter(Boolean).join(" ")} data-theme={resolved} data-appearance={appearance} aria-label={label}>
    <div className="flip-board-housing" style={{ "--flap-columns": columns } as CSSProperties} aria-hidden="true">{Array.from({ length: slots }, (_, index) => {
      const letter = current[index] ?? " ", old = previous[index] ?? " ", changed = state.turn > 0 && letter !== old;
      return <span className="flap-cell" key={`${index}-${state.turn}`} style={{ "--flap-delay": `${Math.min(index * 26, 360)}ms` } as CSSProperties}><span className="flap-letter">{letter}</span><span className="flap-seam" />{changed && <><span className="flap-moving"><span>{old}</span></span><span className="flap-arriving"><span>{letter}</span></span></>}</span>;
    })}</div>
    <span className="ix-sr" role="status" aria-live={autoPlay && !paused ? "off" : "polite"} id={id}>{words[state.current]}</span>
    {showControls && <div className="flip-board-controls"><p className="ix-caption">A thought worth putting on the board.</p><div className="ix-controls">{autoPlay && words.length > 1 && <button type="button" className="ix-button" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"} flipping</button>}<button className="ix-icon" type="button" aria-label="Next message" aria-describedby={id} disabled={words.length < 2} onClick={advance}><InteractionIcon name="next" /></button></div></div>}
  </section>;
}
