export type FrostPoint = { x: number; y: number; pressure: number };

function softBrush(context: CanvasRenderingContext2D, point: FrostPoint, size: number, softness: number) {
  const radius = Math.max(1, size / 2 * (0.45 + Math.max(0.1, point.pressure) * 0.65));
  context.globalCompositeOperation = "destination-out";
  if (softness <= 0) context.fillStyle = "#000";
  else {
    const gradient = context.createRadialGradient(point.x, point.y, radius * (1 - softness), point.x, point.y, radius);
    gradient.addColorStop(0, "#000"); gradient.addColorStop(1, "rgba(0,0,0,0)"); context.fillStyle = gradient;
  }
  context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill();
}

/** Stamp a pressure-aware brush along a quadratic curve, not disconnected pointer dots. */
export function paintFrostCurve(context: CanvasRenderingContext2D, from: FrostPoint, control: FrostPoint, to: FrostPoint, size = 38, softness = 0.55) {
  const distance = Math.hypot(control.x - from.x, control.y - from.y) + Math.hypot(to.x - control.x, to.y - control.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, size * 0.14)));
  context.save();
  for (let index = 0; index <= steps; index++) {
    const t = index / steps, a = 1 - t;
    softBrush(context, { x: a * a * from.x + 2 * a * t * control.x + t * t * to.x, y: a * a * from.y + 2 * a * t * control.y + t * t * to.y, pressure: from.pressure + (to.pressure - from.pressure) * t }, size, Math.max(0, Math.min(1, softness)));
  }
  context.restore();
}
export function regrowFrostMask(context: CanvasRenderingContext2D, width: number, height: number, deltaMs: number, regrowMs: number) {
  if (regrowMs <= 0 || deltaMs <= 0) return;
  context.save(); context.globalCompositeOperation = "source-over"; context.globalAlpha = 1 - Math.exp(-deltaMs * 5 / regrowMs); context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); context.restore();
}
export function frostTextCutout(context: CanvasRenderingContext2D, text: string, font: string, width: number, height: number) {
  if (!text) return;
  context.save(); context.globalCompositeOperation = "destination-out"; context.fillStyle = "#000"; context.textAlign = "center"; context.textBaseline = "middle";
  const requested = Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1] || 65), lines = text.split("\n");
  context.font = font;
  const measured = Math.max(...lines.map((line) => context.measureText(line).width), 1);
  const size = Math.min(requested, requested * width * 0.85 / measured, height * 0.7 / Math.max(1, lines.length) / 1.25);
  context.font = font.replace(/\d+(?:\.\d+)?px/, size + "px");
  lines.forEach((line, index) => context.fillText(line, width / 2, height / 2 + (index - (lines.length - 1) / 2) * size * 1.3));
  context.restore();
}
