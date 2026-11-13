/** Original mathematical cut-paper contours. No reference artwork is embedded. */
export type PaperCutPalette = "ocean" | "citrus" | "graphite";
export type PaperCutSheet = { path: string; color: string; depth: number };
export const PAPER_CUT_PALETTES = {
  ocean: { paper: "#f5f8f8", shadow: "#003e58", sheets: ["#a8edf1", "#72dfe8", "#40c8d9", "#21afc6", "#1296b3", "#087b9e", "#086184", "#054969", "#033750", "#022d43"] },
  citrus: { paper: "#fff9ee", shadow: "#723014", sheets: ["#ffe2a4", "#ffd178", "#ffbc53", "#ffa638", "#f98a26", "#e66e20", "#cb541c", "#a6401b", "#83321b", "#68291c"] },
  graphite: { paper: "#f7f6f3", shadow: "#111923", sheets: ["#e0e2df", "#cdd4d2", "#b3c2c0", "#94aaa9", "#778d91", "#5e747e", "#495c69", "#354654", "#283743", "#1e2a35"] },
} as const;
export function paperBound(value: number, min: number, max: number, fallback: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
}
type Point = { x: number; y: number };
const n = (value: number) => value.toFixed(2);
function smooth(points: Point[], closed = false) {
  let result = `M${n(points[0].x)},${n(points[0].y)}`;
  const last = points.length - 1;
  for (let index = 0; index < (closed ? points.length : last); index++) {
    const p0 = points[closed ? (index - 1 + points.length) % points.length : Math.max(0, index - 1)];
    const p1 = points[index], p2 = points[(index + 1) % points.length];
    const p3 = points[closed ? (index + 2) % points.length : Math.min(last, index + 2)];
    result += `C${n(p1.x + (p2.x - p0.x) / 6)},${n(p1.y + (p2.y - p0.y) / 6)} ${n(p2.x - (p3.x - p1.x) / 6)},${n(p2.y - (p3.y - p1.y) / 6)} ${n(p2.x)},${n(p2.y)}`;
  }
  return result + (closed ? "Z" : "");
}
function island(x: number, y: number, width: number, height: number, phase: number) {
  return smooth(Array.from({ length: 18 }, (_, index) => {
    const angle = index / 18 * Math.PI * 2;
    const radius = 1 + .16 * Math.sin(angle * 3 + phase) + .07 * Math.cos(angle * 5 - phase);
    return { x: x + Math.cos(angle) * width * radius, y: y + Math.sin(angle) * height * radius };
  }), true);
}
export function createPaperCutArt(seed = 7, count = 8, palette: PaperCutPalette = "ocean"): PaperCutSheet[] {
  const colors = PAPER_CUT_PALETTES[palette] ?? PAPER_CUT_PALETTES.ocean;
  const total = Math.round(paperBound(count, 5, 10, 8));
  const phase = (Math.abs(paperBound(seed, -100000, 100000, 7)) * .731) % (Math.PI * 2);
  const sheets: PaperCutSheet[] = Array.from({ length: total }, (_, index) => {
    const t = index / (total - 1);
    const points = Array.from({ length: 29 }, (_, point) => {
      const x = -180 + point * 50;
      const y = 412 - x * .32 + t * 310
        + Math.sin(x * .0071 + phase + t * .42) * (76 - t * 16)
        + Math.cos(x * .0142 - phase * .6 + t * .25) * 38;
      return { x, y };
    });
    return { path: smooth(points) + "L1220,900L-180,900Z", color: colors.sheets[Math.round(t * 9)], depth: .28 + t * .72 };
  });
  // A second shoreline opens a quiet pocket without repeating the first contour.
  const coast = Array.from({ length: 24 }, (_, index) => {
    const x = 100 + index * 50;
    return { x, y: 850 - x * .31 + Math.sin(x * .0085 + phase * .4) * 64 + Math.cos(x * .016) * 25 };
  });
  sheets.push({ path: smooth(coast) + "L1400,1000L100,1000Z", color: colors.paper, depth: 1.12 });
  sheets.push({ path: island(660, 371, 35, 55, phase), color: colors.paper, depth: 1.24 });
  sheets.push({ path: island(267, 588, 42, 24, phase + 2), color: colors.sheets[1], depth: .93 });
  return sheets;
}
