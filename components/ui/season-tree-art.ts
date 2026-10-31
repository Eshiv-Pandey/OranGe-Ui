export type TreeSeason = "pink" | "green" | "yellow" | "red" | "winter";
export const TREE_SEASONS: { value: TreeSeason; label: string }[] = [
  { value: "pink", label: "Spring" }, { value: "green", label: "Summer" }, { value: "yellow", label: "Autumn" }, { value: "red", label: "Maple" }, { value: "winter", label: "Winter" },
];
export const TREE_PALETTES = {
  pink: { sky: "#fff5f6", darkSky: "#241e2b", leaves: ["#f38daa", "#ffc4ca", "#ef6f99", "#ffe0d8"], fallen: ["#ed89ad", "#f7b3c2", "#e2709a"], ground: "#c4b782", density: 0.76 },
  green: { sky: "#f4f9ed", darkSky: "#182720", leaves: ["#a4c953", "#73ab4e", "#c4d875", "#538743"], fallen: ["#88a446", "#acbb57", "#688744"], ground: "#a4ba69", density: 1.1 },
  yellow: { sky: "#fffdf7", darkSky: "#29221f", leaves: ["#ffca53", "#ffd967", "#ffb64b", "#f77e4d"], fallen: ["#f98a4c", "#ffc448", "#eba83e"], ground: "#edce66", density: 1 },
  red: { sky: "#fff4ea", darkSky: "#291c25", leaves: ["#d95e47", "#f37c46", "#f4a34c", "#ac4247"], fallen: ["#d95043", "#ec884a", "#aa4243"], ground: "#c29b66", density: 0.86 },
  winter: { sky: "#edf4f6", darkSky: "#192734", leaves: ["#f3f8fc", "#cbdfe6", "#fff", "#a7c5d2"], fallen: ["#f4f9ff", "#deedf1", "#bacfdc"], ground: "#d9e6e8", density: 0.06 },
} as const;
export type TreeTile = { x: number; y: number; w: number; h: number; color: string; layer: number };
export function seededTreeRandom(seed: number) {
  let current = seed >>> 0;
  return () => { current = (Math.imul(current, 1664525) + 1013904223) >>> 0; return current / 4294967296; };
}
export function createSeasonFoliage(season: TreeSeason): TreeTile[] {
  const random = seededTreeRandom(9143), palette = TREE_PALETTES[season];
  const tiles: TreeTile[] = [];
  // Connected leaf masses have an illuminated crown and a warm, broken underside.
  // The empty fork below the crown is intentional, so the trunk reads at small sizes.
  const crowns = [[41, 48, 23, 21], [65, 35, 24, 20], [88, 50, 24, 21], [29, 72, 22, 20], [64, 62, 38, 26], [99, 78, 22, 22], [41, 87, 23, 16]];
  const step = season === "green" ? 2 : season === "pink" ? 3 : 2.5;
  for (let y = 17; y < 105; y += step) for (let x = 7; x < 124; x += step) {
    const edge = Math.sin(x * .57) * 1.7 + Math.cos(y * .91) * 1.2;
    const inside = crowns.some(([cx, cy, rx, ry]) => ((x - cx) / (rx + edge)) ** 2 + ((y - cy) / (ry + edge)) ** 2 < 1);
    if (!inside) continue;
    if (season === "winter" && (y > 76 || random() > .032)) continue;
    const opening = y > 77 && x > 51 && x < 79 && Math.abs(x - 65) < (y - 73) * .6;
    if (opening) continue;
    const shade = y * .46 + x * .07 + Math.sin(x * .23) * 4 + Math.cos(y * .29) * 3 + Math.sin(x * .35 - y * .2) * 3 + random() * 7;
    const colorIndex = shade < 29 ? 1 : shade < 38 ? 0 : shade < 49 ? 2 : 3;
    const paletteOrder = season === "yellow" ? ["#ffc950", "#ffdd75", "#ffa947", "#ec7046"] : season === "green" ? ["#7fb84f", "#bbd976", "#5b934b", "#386a48"] : palette.leaves;
    const front = y < 59 || (y < 88 && Math.sin(x * .19 - y * .07) > .35);
    tiles.push({ x: Math.round(x), y: Math.round(y), w: Math.ceil(step) + 1, h: Math.ceil(step) + (season === "pink" ? 1 : 2), color: paletteOrder[colorIndex], layer: front ? .9 : .3 });
    if (random() < .014 && y < 80) tiles.push({ x: Math.round(x - 5), y: Math.round(y - 5), w: 2, h: 2, color: paletteOrder[1], layer: .9 });
  }
  return tiles;
}
export function paintTreeBranches(context: CanvasRenderingContext2D, winter = false) {
  context.fillStyle = "#683447";
  const blocks = [[59, 79, 9, 33], [56, 109, 15, 10], [52, 117, 23, 5], [46, 121, 35, 3], [62, 61, 6, 30], [46, 65, 5, 7], [49, 71, 6, 8], [53, 78, 10, 8], [36, 52, 4, 10], [40, 60, 8, 8], [68, 76, 8, 7], [75, 66, 5, 13], [80, 60, 9, 5], [87, 47, 4, 16], [58, 47, 4, 18], [63, 39, 4, 12], [69, 91, 14, 5], [82, 82, 4, 12], [34, 84, 20, 4], [29, 77, 5, 10]];
  for (const [x, y, w, h] of blocks) context.fillRect(x, y, w, h);
  context.fillStyle = "#a25456"; context.fillRect(59, 92, 3, 21); context.fillRect(56, 112, 3, 7); context.fillRect(62, 68, 2, 13); context.fillRect(51, 74, 2, 6);
  context.fillStyle = "#472b3c"; context.fillRect(65, 100, 3, 18); context.fillRect(69, 118, 5, 3);
  if (winter) { context.fillStyle = "#f8ffff"; context.fillRect(37, 51, 10, 3); context.fillRect(70, 90, 17, 3); context.fillRect(51, 118, 25, 3); }
}
