"use client";

import { useEffect, useId, useReducer, type KeyboardEvent } from "react";
import { gameReducer, initialGame, targets, type Direction } from "./gamer-game";

import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/gamer-boy.css";

export type GamerBoyProps = AppearanceProps & { label?: string; onScoreChange?: (score: number) => void };
export function GamerBoy({ appearance = "polished", className, label = "Interactive handheld console", onScoreChange }: GamerBoyProps) {
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const hintId = useId();
  useEffect(() => { onScoreChange?.(game.score); }, [game.score, onScoreChange]);
  const target = targets[game.score];
  const directions: Direction[] = ["up", "left", "right", "down"];
  const active = game.phase === "playing";
  const status = game.phase === "ready" ? "Four little stars. One small adventure." : game.phase === "won" ? "All four found. Nicely played!" : game.phase === "paused" ? "Take your time. Press Play to resume." : `You: column ${game.x + 1}, row ${game.y + 1}. Star: column ${target.x + 1}, row ${target.y + 1}.`;
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const direction = { ArrowUp: "up", ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", w: "up", a: "left", d: "right", s: "down" }[event.key] as Direction | undefined;
    if (direction) { event.preventDefault(); dispatch({ type: "move", direction }); }
    else if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); dispatch({ type: "play" }); }
    else if (event.key === "Escape") dispatch({ type: "reset" });
  }
  return <div className={uiClass("console-wrap gamer-boy-device", className)} data-appearance={appearance}>
    <div className="handheld" role="group" aria-label={label} aria-describedby={hintId} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="handheld-screen">
        <div className="screen-status pixel-type"><span>{game.phase === "ready" ? "ORANGE / POCKET EDITION" : `STARS ${game.score} / 4`}</span><span className="battery" role="img" aria-label="Full battery"><i /><i /><i /></span></div>
        {game.phase === "ready" ? <p className="console-title pixel-type">PRESS<br />PLAY</p> : game.phase === "won" ? <p className="console-title console-title--won pixel-type">YOU<br />GOT IT!</p> : <div className="console-board" aria-hidden="true" data-player={`${game.x},${game.y}`} data-score={game.score}>{Array.from({ length: 15 }, (_, i) => {
          const x = i % 5, y = Math.floor(i / 5);
          return <span key={i} className="console-cell">{x === game.x && y === game.y ? <span className="console-player" /> : x === target.x && y === target.y ? <span className="console-star">✦</span> : <span className="console-cell-dot" />}</span>;
        })}</div>}
        <p role="status" className={`console-message pixel-type${game.phase === "playing" ? " console-message--playing" : ""}`}>{status}</p>
      </div>
      <div className="handheld-controls">
        <button type="button" className="console-play" aria-label={active ? "Pause console demo" : "Play console demo"} aria-pressed={active} onClick={() => dispatch({ type: "play" })}><span className="pixel-type">{active ? "PAUSE" : "PLAY"}</span></button>
        <div className="console-buttons">{directions.map((direction) => <button type="button" key={direction} className={`console-button console-button--${direction}`} aria-label={`Console ${direction}`} disabled={!active} onClick={() => dispatch({ type: "move", direction })}><span className="pixel-type">{direction === "down" ? <>DO<wbr />WN</> : direction.toUpperCase()}</span></button>)}</div>
      </div>
      <div className="handheld-bottom"><span>oRangeUi <span aria-hidden="true">✳</span></span><button type="button" className="console-reset" onClick={() => dispatch({ type: "reset" })}>Reset game <span aria-hidden="true">↺</span></button></div>
    </div>
    <p id={hintId} className="console-hint">Collect four stars. Use the buttons, arrow keys or WASD.<br />Press Play to begin. Escape resets.</p>
  </div>;
}
