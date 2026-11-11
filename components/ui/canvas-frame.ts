const redraws = new WeakMap<HTMLCanvasElement, () => void>();
/** Register a synchronous redraw for exports without retaining a WebGL drawing buffer. */
export function registerCanvasFrame(canvas: HTMLCanvasElement, redraw: () => void) {
  redraws.set(canvas, redraw);
  return () => { if (redraws.get(canvas) === redraw) redraws.delete(canvas); };
}
/** Copy in the same task as drawing, before the compositor can clear a WebGL buffer. */
export function copyCanvasFrame(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  redraws.get(source)?.(); target.width = source.width; target.height = source.height;
  target.getContext("2d")?.drawImage(source, 0, 0);
}
