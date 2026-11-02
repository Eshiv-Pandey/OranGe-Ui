export type TreeSeason = "pink" | "green" | "yellow" | "red" | "winter";
export const TREE_WIDTH = 900, TREE_HEIGHT = 940;
export const TREE_SEASONS: { value: TreeSeason; label: string }[] = [
  { value: "pink", label: "Spring" }, { value: "green", label: "Summer" }, { value: "yellow", label: "Autumn" }, { value: "red", label: "Maple" }, { value: "winter", label: "Winter" },
];
export const TREE_PALETTES = {
  pink: { sky: "#fff5f6", darkSky: "#241e2b", leaves: ["#82344e", "#bd5571", "#ea8599", "#ffb6b6", "#ffe0ce"], fallen: ["#ed89ad", "#f7b3c2", "#e2709a"], ground: "transparent", density: .72 },
  green: { sky: "#f4f9ed", darkSky: "#182720", leaves: ["#214639", "#376749", "#588747", "#8cb651", "#c6d776"], fallen: ["#88a446", "#acbb57", "#688744"], ground: "transparent", density: 1.12 },
  yellow: { sky: "#fffdf7", darkSky: "#29221f", leaves: ["#773442", "#b74a39", "#ec732c", "#ffa93a", "#ffd16a"], fallen: ["#f98a4c", "#ffc448", "#eba83e"], ground: "transparent", density: .98 },
  red: { sky: "#fff4ea", darkSky: "#291c25", leaves: ["#50162d", "#842039", "#ba313b", "#ef522f", "#ff903c"], fallen: ["#d95043", "#f78342", "#ac3343"], ground: "transparent", density: 1 },
  winter: { sky: "#edf4f6", darkSky: "#192734", leaves: ["#819caa", "#b6c9cf", "#d2e2e4", "#eff5f4", "#ffffff"], fallen: ["#f4f9ff", "#deedf1", "#bacfdc"], ground: "transparent", density: .018 },
} as const;
export type TreeTile = { x: number; y: number; w: number; h: number; color: string; layer: number; rotation: number };
export function seededTreeRandom(seed: number) {
  let current = seed >>> 0;
  return () => { current = (Math.imul(current, 1664525) + 1013904223) >>> 0; return current / 4294967296; };
}
type LimbPoint = { x: number; y: number; width: number };
type Branch = { x: number; y: number; ex: number; ey: number; c1x: number; c1y: number; c2x: number; c2y: number; width: number; endWidth: number };
type Crown = { x: number; y: number; radius: number; phase: number };
/** An asymmetrical branching skeleton, shared by every season. */
function createTreeStructure() {
  const random = seededTreeRandom(92154), branches: Branch[] = [], crowns: Crown[] = [];
  // Preserve the seeded canopy while replacing the old segmented spine.
  for (let i = 0; i < 6; i++) random();
  const grow = (x: number, y: number, length: number, angle: number, width: number, depth: number, parentAngle = -Math.PI / 2) => {
    const ex = x + Math.cos(angle) * length, ey = y + Math.sin(angle) * length;
    const bend = (random() - .5) * length * .2;
    branches.push({ x, y, ex, ey, c1x: x + Math.cos(parentAngle) * length * .38, c1y: y + Math.sin(parentAngle) * length * .38, c2x: ex - Math.cos(angle) * length * .32 + bend, c2y: ey - Math.sin(angle) * length * .32 + bend * .3, width, endWidth: width * .6 });
    if (depth === 0 || length < 12) { crowns.push({ x: ex, y: ey, radius: 21 + random() * 30, phase: random() * 6.28 }); return; }
    grow(ex, ey, length * (.61 + random() * .12), angle - .32 - random() * .42, width * .61, depth - 1, angle);
    grow(ex, ey, length * (.58 + random() * .16), angle + .28 + random() * .42, width * .56, depth - 1, angle);
    if (depth > 1 && random() > .3) grow(ex, ey, length * .51, angle + (random() - .5) * .26, width * .4, depth - 2, angle);
  };
  // Main limbs have different reach and rhythm, rather than mirrored forks.
  grow(488,678,118,-2.65,22,4);
  grow(491,650,115,-.57,21,4);
  grow(458,553,115,-2.43,18,4);
  grow(455,544,104,-.8,18,4);
  grow(463,447,103,-2.72,14,4);
  grow(465,430,104,-.81,14,4);
  grow(434,330,93,-2.44,9,4);
  grow(447,285,83,-.81,8,4);
  grow(454,217,62,-1.75,4,3);
  random(); random();
  // Interior foliage joins the terminal sprays into a broad, continuous crown.
  // Overlapping irregular leaf masses leave smaller windows onto the branches.
  const interior = [[456,223,97], [372,309,121], [523,313,113], [299,416,119], [444,411,129], [592,416,121], [236,490,85], [367,509,106], [514,510,113], [633,517,91], [398,579,82], [570,588,74]];
  return { branches, crowns: [...interior.map(([x, y, radius]) => ({ x, y, radius, phase: random() * 6.28 })), ...crowns.filter((c) => c.x > 66 && c.x < 834 && c.y > 60 && c.y < 680)] };
}
const STRUCTURE = createTreeStructure();
export function createSeasonFoliage(season: TreeSeason): TreeTile[] {
  const random = seededTreeRandom(7293), palette = TREE_PALETTES[season], leaves: TreeTile[] = [];
  for (const crown of STRUCTURE.crowns) {
    const count = Math.round((55 + crown.radius + crown.radius * crown.radius * .12) * palette.density);
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2, radial = Math.sqrt(random()), ripple = 1 + .15 * Math.sin(theta * 5 + crown.phase);
      const x = crown.x + Math.cos(theta) * crown.radius * radial * ripple;
      const y = crown.y + Math.sin(theta) * crown.radius * radial * .75 * ripple;
      if (x < 34 || x > 866 || y < 32) continue;
      const sunlight = (x / TREE_WIDTH) * .38 + (1 - y / 700) * .34 + Math.sin(crown.x * .04 + crown.y * .023) * .2 + (random() - .5) * .34;
      const shade = Math.max(0, Math.min(4, Math.floor(sunlight * 5)));
      const size = 2.7 + random() * 4.2;
      leaves.push({ x, y, w: size, h: size * (.44 + random() * .37), color: palette.leaves[shade], layer: random(), rotation: theta * .45 + random() * 1.8 });
    }
  }
  return leaves;
}
export function paintTreeLeaf(context: CanvasRenderingContext2D, leaf: Pick<TreeTile, "x" | "y" | "w" | "h" | "color" | "rotation">) {
  context.save(); context.translate(leaf.x, leaf.y); context.rotate(leaf.rotation); context.fillStyle = leaf.color;
  context.beginPath(); context.moveTo(-leaf.w, 0);
  context.bezierCurveTo(-leaf.w * .15, -leaf.h, leaf.w * .7, -leaf.h * .6, leaf.w, 0);
  context.bezierCurveTo(leaf.w * .28, leaf.h, -leaf.w * .75, leaf.h * .75, -leaf.w, 0);
  context.fill(); context.restore();
}
function sampleBranch(b: Branch): LimbPoint[] {
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16, s = 1 - t;
    return { x: s ** 3 * b.x + 3 * s * s * t * b.c1x + 3 * s * t * t * b.c2x + t ** 3 * b.ex, y: s ** 3 * b.y + 3 * s * s * t * b.c1y + 3 * s * t * t * b.c2y + t ** 3 * b.ey, width: b.width + (b.endWidth - b.width) * t };
  });
}
/** Catmull-Rom handles keep the trunk's tangent continuous through every bend. */
function curvedLimb(knots: number[][]): LimbPoint[] {
  return knots.slice(0, -1).flatMap(([x, y, width], index) => {
    const [px, py] = knots[Math.max(0, index - 1)], [ex, ey, endWidth] = knots[index + 1], [nx, ny] = knots[Math.min(knots.length - 1, index + 2)];
    const samples = sampleBranch({ x, y, ex, ey, width, endWidth, c1x: x + (ex - px) / 6, c1y: y + (ey - py) / 6, c2x: ex - (nx - x) / 6, c2y: ey - (ny - y) / 6 });
    return index === knots.length - 2 ? samples : samples.slice(0, -1);
  });
}
const TRUNK = curvedLimb([[518,856,60], [510,818,46], [489,777,40], [478,730,35], [483,678,30], [494,628,27], [485,578,24], [462,525,21], [457,478,17], [467,426,14], [450,369,11], [434,311,8], [444,255,5], [454,211,1]]);
const ROOTS = [curvedLimb([[514,828,38], [505,850,32], [480,862,17], [445,873,.2]]), curvedLimb([[517,836,40], [534,857,25], [555,867,12], [576,873,.2]])];
const LIMBS = [...STRUCTURE.branches.map(sampleBranch), TRUNK, ...ROOTS];
function limbNormal(points: LimbPoint[], index: number) {
  const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - previous.x, dy = next.y - previous.y, length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
}
export function paintTreeBranches(context: CanvasRenderingContext2D, winter = false) {
  context.save();
  const wood = context.createLinearGradient(365, 680, 566, 710);
  wood.addColorStop(0, "#241c26"); wood.addColorStop(.66, "#39252c"); wood.addColorStop(1, "#634035");
  context.fillStyle = wood;
  for (const points of LIMBS) {
    context.beginPath();
    for (let side = 1; side >= -1; side -= 2) for (let step = 0; step < points.length; step++) {
      const index = side === 1 ? step : points.length - step - 1, point = points[index], normal = limbNormal(points, index);
      const x = point.x + normal.x * point.width * .5 * side, y = point.y + normal.y * point.width * .5 * side;
      if (side === 1 && step === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.closePath(); context.fill();
  }
  // Broken, uneven furrows follow the growth. No regular stripes or bright outlines.
  const random = seededTreeRandom(73190);
  context.lineCap = "round";
  for (const points of LIMBS) {
    if (points[0].width < 4) continue;
    const count = Math.round(points.length * Math.min(1.5, points[0].width / 23));
    for (let mark = 0; mark < count; mark++) {
      const start = Math.floor(random() * (points.length - 2)), end = Math.min(points.length - 1, start + 2 + Math.floor(random() * 9));
      const offset = (random() - .5) * .76, phase = random() * 6.28, light = random();
      context.strokeStyle = light > .8 ? winter ? "#b3c4c7" : "#c08652" : light > .38 ? "#925c42" : "#17151e";
      context.globalAlpha = .28 + random() * .34; context.lineWidth = .4 + random() * .9;
      context.beginPath();
      for (let i = start; i <= end; i++) {
        const point = points[i], normal = limbNormal(points, i), distance = point.width * (offset + Math.sin((i - start) * .35 + phase) * .055);
        const x = point.x + normal.x * distance, y = point.y + normal.y * distance;
        if (i === start) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
  }
  context.restore();
}
/** Rasterize the intricate artwork only on season changes, never every frame. */
export function createTreeLayers(season: TreeSeason) {
  const foliage = createSeasonFoliage(season);
  const layers = Array.from({ length: 3 }, () => { const canvas = document.createElement("canvas"); canvas.width = TREE_WIDTH; canvas.height = TREE_HEIGHT; return canvas; });
  const contexts = layers.map((layer) => layer.getContext("2d"));
  const back = contexts[0], front = contexts[1], light = contexts[2];
  if (back && front && light) {
    for (const leaf of foliage) if (leaf.layer < .62) paintTreeLeaf(back, leaf);
    paintTreeBranches(back, season === "winter");
    for (const leaf of foliage) if (leaf.layer >= .62) paintTreeLeaf(leaf.layer > .9 ? light : front, leaf);
  }
  return { layers, foliage, destroy: () => layers.forEach((canvas) => { canvas.width = canvas.height = 0; }) };
}
