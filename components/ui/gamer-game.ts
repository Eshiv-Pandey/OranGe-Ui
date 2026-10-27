export type Direction = "up" | "left" | "right" | "down";
export type GameState = { phase: "ready" | "playing" | "paused" | "won"; x: number; y: number; score: number; moves: number };
export const initialGame: GameState = { phase: "ready", x: 2, y: 1, score: 0, moves: 0 };
export const targets = [{ x: 4, y: 1 }, { x: 4, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 2 }];
type Action = { type: "play" } | { type: "reset" } | { type: "move"; direction: Direction };
export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === "reset") return initialGame;
  if (action.type === "play") {
    if (state.phase === "ready" || state.phase === "won") return { ...initialGame, phase: "playing" };
    return { ...state, phase: state.phase === "playing" ? "paused" : "playing" };
  }
  if (state.phase !== "playing") return state;
  const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[action.direction];
  const x = Math.max(0, Math.min(4, state.x + delta[0]));
  const y = Math.max(0, Math.min(2, state.y + delta[1]));
  if (x === state.x && y === state.y) return state;
  const target = targets[state.score];
  const score = state.score + (x === target.x && y === target.y ? 1 : 0);
  return { ...state, x, y, score, moves: state.moves + 1, phase: score === targets.length ? "won" : "playing" };
}
