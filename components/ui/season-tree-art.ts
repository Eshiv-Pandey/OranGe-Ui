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
  const clusters = [[43, 43, 25, 16], [71, 35, 25, 17], [90, 52, 24, 21], [105, 72, 19, 15], [29, 68, 24, 20], [52, 63, 27, 22], [75, 72, 26, 23], [49, 87, 30, 13]];
  const tiles: TreeTile[] = [];
  for (const [cx, cy, rx, ry] of clusters) for (let i = 0; i < 58 * palette.density; i++) {
    const angle = random() * Math.PI * 2, radius = Math.sqrt(random());
    tiles.push({ x: Math.round(cx + Math.cos(angle) * radius * rx), y: Math.round(cy + Math.sin(angle) * radius * ry), w: 3 + Math.floor(random() * 6), h: season === "pink" ? 3 : 3 + Math.floor(random() * 4), color: palette.leaves[Math.floor(random() * palette.leaves.length)], layer: random() });
  }
  return tiles;
}
export function paintTreeBranches(context: CanvasRenderingContext2D, winter = false) {
  context.fillStyle = "#71333f";
  const blocks = [[58, 79, 8, 43], [54, 107, 16, 16], [47, 118, 32, 6], [63, 61, 6, 30], [45, 64, 7, 7], [49, 69, 7, 8], [52, 76, 9, 9], [36, 52, 5, 12], [41, 59, 7, 10], [69, 73, 9, 6], [77, 61, 6, 15], [82, 57, 10, 5], [89, 43, 4, 16], [59, 48, 5, 19], [65, 39, 4, 13], [74, 91, 13, 5], [85, 82, 5, 13], [34, 81, 20, 5], [29, 75, 5, 11]];
  for (const [x, y, w, h] of blocks) context.fillRect(x, y, w, h);
  context.fillStyle = "#a65552"; context.fillRect(60, 94, 3, 24); context.fillRect(55, 108, 3, 13); context.fillRect(67, 68, 3, 11);
  if (winter) { context.fillStyle = "#f8ffff"; context.fillRect(37, 51, 10, 3); context.fillRect(70, 90, 17, 3); context.fillRect(51, 118, 25, 3); }
}
