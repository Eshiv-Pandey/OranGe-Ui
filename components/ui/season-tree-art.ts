export type TreeSeason = "pink" | "green" | "yellow" | "red" | "winter";
export const TREE_WIDTH = 900, TREE_HEIGHT = 940;
export const TREE_SEASONS: { value: TreeSeason; label: string }[] = [
  { value: "pink", label: "Spring" }, { value: "green", label: "Summer" }, { value: "yellow", label: "Autumn" }, { value: "red", label: "Maple" }, { value: "winter", label: "Winter" },
];
export const TREE_PALETTES = {
  pink: { sky: "#fff5f6", darkSky: "#241e2b", leaves: ["#632d53", "#a73878", "#de579b", "#f99dc4", "#ffe2de"], fallen: ["#ed89ad", "#f7b3c2", "#e2709a"], ground: "transparent", density: 1 },
  green: { sky: "#f4f9ed", darkSky: "#182720", leaves: ["#203f38", "#356348", "#5c8d4b", "#99bd60", "#d9e999"], fallen: ["#88a446", "#acbb57", "#688744"], ground: "transparent", density: 1.16 },
  yellow: { sky: "#fffdf7", darkSky: "#29221f", leaves: ["#694035", "#aa5c29", "#d89132", "#f4c557", "#ffe79b"], fallen: ["#f98a4c", "#ffc448", "#eba83e"], ground: "transparent", density: .94 },
  red: { sky: "#fff4ea", darkSky: "#291c25", leaves: ["#4b2635", "#882d3d", "#c74a42", "#ee7954", "#ffc18b"], fallen: ["#d95043", "#f78342", "#ac3343"], ground: "transparent", density: 1.02 },
  winter: { sky: "#edf4f6", darkSky: "#192734", leaves: ["#819caa", "#b6c9cf", "#d2e2e4", "#eff5f4", "#ffffff"], fallen: ["#f4f9ff", "#deedf1", "#bacfdc"], ground: "transparent", density: 0 },
} as const;
export type TreeTile = { x: number; y: number; w: number; h: number; color: string; layer: number; rotation: number; blossom?: boolean };
export function seededTreeRandom(seed: number) {
  let current = seed >>> 0;
  return () => { current = (Math.imul(current, 1664525) + 1013904223) >>> 0; return current / 4294967296; };
}
type LimbPoint = { x: number; y: number; width: number };
type Crown = { x: number; y: number; rx: number; ry: number; layer: number; light: number; phase: number };

/** A broad crown with staggered shoulders and a small, off-centre summit. */
const CROWNS: Crown[] = [
  [345,226,112,92,0,.04], [454,192,117,92,0,.22], [563,229,119,95,0,.2],
  [249,296,126,97,0,-.12], [649,297,120,102,0,.19],
  [171,388,108,103,0,-.17], [737,390,103,100,0,.2],
  [233,495,146,97,0,-.2], [661,491,142,108,0,.05],
  [405,360,150,130,0,-.2], [520,414,149,126,0,-.08],
  [379,204,88,73,1,.1], [501,202,104,85,1,.26],
  [293,308,123,87,1,-.02], [570,314,120,94,1,.24], [701,354,88,78,1,.24],
  [204,418,123,85,1,-.2], [418,331,127,95,1,.02],
  [579,431,138,90,1,.03], [752,473,77,81,1,.11],
  [183,527,94,64,2,-.2], [322,477,121,81,2,-.16],
  [422,431,108,74,2,-.02], [508,486,95,64,2,-.17],
  [650,537,111,65,2,-.02], [365,568,76,55,2,-.23],
].map(([x,y,rx,ry,layer,light], i) => ({ x, y, rx, ry, layer, light, phase: i * 2.399 }));
function crownEdge(theta: number, phase: number) {
  return 1 + .075 * Math.sin(theta * 5 + phase) + .043 * Math.sin(theta * 9 - phase) + .022 * Math.cos(theta * 17 + phase);
}
export function createSeasonFoliage(season: TreeSeason): TreeTile[] {
  const random = seededTreeRandom(7293), palette = TREE_PALETTES[season], leaves: TreeTile[] = [];
  for (const crown of CROWNS) {
    const count = Math.round(crown.rx * crown.ry * .078 * palette.density);
    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2, radial = Math.sqrt(random());
      const dx = Math.cos(theta) * radial, dy = Math.sin(theta) * radial, edge = crownEdge(theta, crown.phase);
      const x = crown.x + dx * crown.rx * edge, y = crown.y + dy * crown.ry * edge;
      // Each cluster has a lit upper-right shoulder and a shaded underside.
      const light = .48 + dx * .17 - dy * .3 + crown.light + (random() - .5) * .28;
      const shade = Math.max(0, Math.min(4, Math.floor(light * 4.4)));
      const size = (season === "pink" ? 2.3 : 2.6) + random() * 3.3;
      leaves.push({ x, y, w: size, h: size * (season === "pink" ? .8 : .42 + random() * .22), color: palette.leaves[shade], layer: crown.layer, rotation: theta + random() * 1.8, blossom: season === "pink" });
    }
  }
  return leaves;
}
export function paintTreeLeaf(context: CanvasRenderingContext2D, leaf: Pick<TreeTile, "x" | "y" | "w" | "h" | "color" | "rotation" | "blossom">) {
  context.save(); context.translate(leaf.x, leaf.y); context.rotate(leaf.rotation); context.fillStyle = leaf.color;
  context.beginPath(); context.moveTo(-leaf.w, 0);
  if (leaf.blossom) {
    context.bezierCurveTo(-leaf.w * 1.1, -leaf.h, -leaf.w * .22, -leaf.h, 0, -leaf.h * .5);
    context.bezierCurveTo(leaf.w * .35, -leaf.h * 1.4, leaf.w * 1.2, -leaf.h * .45, leaf.w * .7, leaf.h * .25);
    context.bezierCurveTo(leaf.w * .7, leaf.h, -.4 * leaf.w, leaf.h * 1.3, -leaf.w, 0);
  } else {
    context.bezierCurveTo(-leaf.w * .15, -leaf.h, leaf.w * .7, -leaf.h * .6, leaf.w, 0);
    context.bezierCurveTo(leaf.w * .28, leaf.h, -leaf.w * .75, leaf.h * .75, -leaf.w, 0);
  }
  context.fill(); context.restore();
}
/** Continuous tangents and taper are shared by the trunk, roots and forks. */
function curvedLimb(knots: number[][]): LimbPoint[] {
  return knots.slice(0, -1).flatMap(([x, y, width], index) => {
    const [px, py] = knots[Math.max(0, index - 1)], [ex, ey, endWidth] = knots[index + 1], [nx, ny] = knots[Math.min(knots.length - 1, index + 2)];
    return Array.from({ length: 12 }, (_, step) => {
      const t = step / 12, s = 1 - t;
      return { x: s ** 3 * x + 3 * s * s * t * (x + (ex - px) / 6) + 3 * s * t * t * (ex - (nx - x) / 6) + t ** 3 * ex, y: s ** 3 * y + 3 * s * s * t * (y + (ey - py) / 6) + 3 * s * t * t * (ey - (ny - y) / 6) + t ** 3 * ey, width: width + (endWidth - width) * t };
    });
  }).concat([{ x: knots.at(-1)![0], y: knots.at(-1)![1], width: knots.at(-1)![2] }]);
}
const TRUNK = curvedLimb([[446,854,111], [458,805,83], [466,751,67], [462,712,60], [481,655,53], [495,602,43], [482,554,33], [470,509,23], [445,455,14], [441,413,3]]);
const MAIN_LIMBS = [
  [[475,666,45],[420,592,36],[335,529,24],[237,462,13],[137,414,.3]],
  [[473,651,43],[549,583,35],[617,520,24],[700,469,12],[777,432,.3]],
  [[482,584,35],[530,494,27],[525,398,17],[555,301,8],[546,212,.3]],
  [[481,568,33],[414,479,25],[366,394,16],[307,322,8],[251,260,.3]],
  [[475,520,23],[449,416,18],[464,321,11],[437,250,6],[454,170,.3]],
  [[524,475,21],[601,412,16],[644,340,9],[705,300,.3]],
  [[416,590,30],[391,568,22],[318,557,15],[251,569,8],[167,550,.3]],
  [[558,576,31],[582,554,24],[650,564,16],[717,541,8],[791,530,.3]],
  [[361,548,23],[343,530,20],[299,441,14],[249,387,8],[186,350,.3]],
  [[422,497,25],[405,468,18],[361,365,12],[381,280,6],[353,213,.3]],
  [[582,427,18],[600,415,15],[605,329,10],[635,257,5],[613,210,.3]],
].map(curvedLimb);
const ROOTS = [
  [[450,815,71],[420,839,49],[372,854,23],[319,865,.3]],
  [[465,818,63],[486,844,42],[530,864,19],[582,873,.3]],
  [[444,840,48],[424,858,29],[405,879,.3]],
  [[466,842,45],[473,869,19],[498,885,.3]],
].map(curvedLimb);
function createTwigs() {
  const random = seededTreeRandom(18279), limbs: LimbPoint[][] = [];
  const grow = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    const turn = (random() - .5) * .42, ex = x + Math.cos(angle + turn) * length, ey = y + Math.sin(angle + turn) * length;
    limbs.push(curvedLimb([[x,y,width],[x + Math.cos(angle) * length * .51,y + Math.sin(angle) * length * .51,width * .59],[ex,ey,.18]]));
    if (depth <= 0) return;
    grow(ex, ey, angle - .35 - random() * .25, length * (.55 + random() * .13), width * .54, depth - 1);
    grow(ex, ey, angle + .28 + random() * .3, length * (.5 + random() * .16), width * .49, depth - 1);
  };
  for (const limb of MAIN_LIMBS) for (let index = 13; index < limb.length - 5; index += 8) {
    const point = limb[index], previous = limb[index - 2], next = limb[index + 2];
    const tangent = Math.atan2(next.y - previous.y, next.x - previous.x);
    const angle = tangent + (index % 3 ? -1 : 1) * (.48 + random() * .42);
    // Fine tips reach upward without a rigid, repeating fractal fan.
    grow(point.x, point.y, Math.sin(angle) > .2 ? -angle : angle, 38 + random() * 37, Math.min(4.4, point.width * .26), 2);
  }
  return limbs;
}
const TWIGS = createTwigs();
function limbNormal(points: LimbPoint[], index: number) {
  const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)];
  const dx = next.x - previous.x, dy = next.y - previous.y, length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
}
function limbShape(context: CanvasRenderingContext2D, points: LimbPoint[]) {
  context.beginPath();
  for (let side = 1; side >= -1; side -= 2) for (let step = 0; step < points.length; step++) {
    const index = side === 1 ? step : points.length - step - 1, point = points[index], normal = limbNormal(points, index);
    const x = point.x + normal.x * point.width * .5 * side, y = point.y + normal.y * point.width * .5 * side;
    if (side === 1 && step === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  if (points !== TRUNK) {
    const base = points[0], normal = limbNormal(points, 0);
    context.quadraticCurveTo(base.x - normal.y * base.width * .6, base.y + normal.x * base.width * .6, base.x + normal.x * base.width * .5, base.y + normal.y * base.width * .5);
  }
  context.closePath();
}
function paintSnow(context: CanvasRenderingContext2D) {
  const random = seededTreeRandom(9492);
  context.lineCap = "round"; context.lineJoin = "round";
  for (const points of [...MAIN_LIMBS, ...ROOTS]) {
    for (let start = 4; start < points.length - 6; start += 13 + Math.floor(random() * 7)) {
      const point = points[start], normal = limbNormal(points, start);
      if (Math.abs(normal.y) < .55 || point.width < 3) continue;
      const end = Math.min(points.length - 2, start + 8 + Math.floor(random() * 6)), phase = random() * 6.28;
      const cap: { x: number; y: number; top: number }[] = [];
      for (let i = start; i <= end; i++) {
        const p = points[i], n = limbNormal(points, i), side = n.y > 0 ? -1 : 1;
        const x = p.x + n.x * p.width * .44 * side, y = p.y + n.y * p.width * .44 * side;
        const t = (i - start) / (end - start), lift = (1.5 + Math.min(5.5, p.width * .27)) * Math.sin(t * Math.PI) ** .6 * (1 + .18 * Math.sin(t * 11 + phase));
        cap.push({ x, y, top: y - lift });
      }
      context.beginPath();
      cap.forEach((p, i) => { if (!i) context.moveTo(p.x, p.top); else context.lineTo(p.x, p.top); });
      for (let i = cap.length - 1; i >= 0; i--) context.lineTo(cap[i].x, cap[i].y + .7);
      context.closePath(); context.fillStyle = "#d3e1e9"; context.fill();
      context.beginPath();
      cap.slice(2, -2).forEach((p, i) => { if (!i) context.moveTo(p.x, p.top + .5); else context.lineTo(p.x, p.top + .5); });
      context.lineWidth = 1.2; context.strokeStyle = "#f6f9fa"; context.stroke();
    }
  }
}
export function paintTreeBranches(context: CanvasRenderingContext2D, winter = false) {
  context.save();
  const limbs = [...TWIGS, ...MAIN_LIMBS, TRUNK, ...ROOTS], random = seededTreeRandom(73190);
  const shading = document.createElement("canvas"); shading.width = TREE_WIDTH; shading.height = TREE_HEIGHT;
  const shadeContext = shading.getContext("2d");
  // A single wood undercoat unites the silhouette before any local lighting.
  for (const points of limbs) {
    context.fillStyle = winter && points[0].width < 4 ? "#81929d" : winter ? "#41474b" : "#424b40";
    limbShape(context, points); context.fill();
  }
  for (const points of limbs) {
    const middle = points[Math.floor(points.length / 2)], normal = limbNormal(points, Math.floor(points.length / 2)), width = Math.max(5, points[0].width);
    if (width < 6) continue;
    const wood = context.createLinearGradient(middle.x - normal.x * width * .6, middle.y - normal.y * width * .6, middle.x + normal.x * width * .6, middle.y + normal.y * width * .6);
    wood.addColorStop(0, winter ? "#807d7c" : "#858064"); wood.addColorStop(.23, winter ? "#585854" : "#5a6050");
    wood.addColorStop(.57, winter ? "#3c4144" : "#353e3a"); wood.addColorStop(1, winter ? "#29303a" : "#292d35");
    const base = points[0];
    const joinIndex = Math.max(1, points.findIndex((point) => Math.hypot(point.x - base.x, point.y - base.y) >= width * 1.8));
    if (shadeContext) {
      shadeContext.clearRect(0, 0, TREE_WIDTH, TREE_HEIGHT);
      shadeContext.save(); shadeContext.fillStyle = wood; limbShape(shadeContext, points); shadeContext.fill();
      if (points !== TRUNK) {
        const end = points[joinIndex], fade = shadeContext.createLinearGradient(base.x, base.y, end.x, end.y);
        fade.addColorStop(0, "#0000"); fade.addColorStop(.35, "#0000"); fade.addColorStop(1, "#000");
        shadeContext.globalCompositeOperation = "destination-in"; shadeContext.fillStyle = fade; shadeContext.fillRect(0, 0, TREE_WIDTH, TREE_HEIGHT);
      }
      shadeContext.restore(); context.drawImage(shading, 0, 0);
    }
    context.save(); limbShape(context, points); context.clip();
    // Long, broken furrows give each limb a turning plane.
    for (let mark = 0; mark < width * 1.6; mark++) {
      const start = Math.floor(random() * (points.length - 3)), end = Math.min(points.length - 1, start + 8 + Math.floor(random() * 28));
      const offset = (random() - .5) * .91, phase = random() * 6.28;
      context.strokeStyle = mark % 3 ? "#191f2a" : winter ? "#c5d2ce" : "#abb38a";
      context.globalAlpha = (.13 + random() * .25) * (points === TRUNK ? 1 : Math.min(1, start / joinIndex)); context.lineWidth = .5 + random() * 1.35; context.beginPath();
      for (let i = start; i <= end; i++) {
        const point = points[i], n = limbNormal(points, i), distance = point.width * (offset + Math.sin(i * .14 + phase) * .05);
        const x = point.x + n.x * distance, y = point.y + n.y * distance;
        if (i === start) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.restore();
  }
  if (winter) paintSnow(context);
  shading.width = shading.height = 0;
  context.restore();
}
function paintCrown(context: CanvasRenderingContext2D, crown: Crown, season: TreeSeason) {
  const palette = TREE_PALETTES[season].leaves;
  context.save(); context.beginPath();
  for (let i = 0; i <= 96; i++) {
    const angle = i / 96 * Math.PI * 2, edge = crownEdge(angle, crown.phase) * .96;
    const x = crown.x + Math.cos(angle) * crown.rx * edge, y = crown.y + Math.sin(angle) * crown.ry * edge;
    if (!i) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath();
  const shade = context.createRadialGradient(crown.x + crown.rx * .36, crown.y - crown.ry * .6, 0, crown.x, crown.y, crown.rx * 1.13);
  shade.addColorStop(0, palette[crown.light > .1 ? 3 : 2]); shade.addColorStop(.5, palette[crown.light > .1 ? 2 : 1]); shade.addColorStop(1, palette[0]);
  context.fillStyle = shade; context.fill(); context.restore();
}
/** Cache the foliage texture and branch shading only when the season changes. */
export function createTreeLayers(season: TreeSeason) {
  const foliage = createSeasonFoliage(season);
  const layers = Array.from({ length: 3 }, () => { const canvas = document.createElement("canvas"); canvas.width = TREE_WIDTH; canvas.height = TREE_HEIGHT; return canvas; });
  const contexts = layers.map((layer) => layer.getContext("2d"));
  if (contexts.every(Boolean)) for (let layer = 0; layer < 3; layer++) {
    const context = contexts[layer]!;
    if (layer === 1) paintTreeBranches(context, season === "winter");
    if (season === "winter") continue;
    for (const crown of CROWNS.filter((crown) => crown.layer === layer)) paintCrown(context, crown, season);
    for (const leaf of foliage) if (leaf.layer === layer) paintTreeLeaf(context, leaf);
  }
  return { layers, foliage, destroy: () => layers.forEach((canvas) => { canvas.width = canvas.height = 0; }) };
}
