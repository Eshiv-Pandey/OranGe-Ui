type Point = { x: number; y: number; distance: number; angle: number };
const curves = [
  [[-150, 0], [130, 50], [470, 30], [680, 220]],
  [[680, 220], [940, 510], [170, 340], [190, 540]],
  [[190, 540], [190, 790], [850, 640], [1050, 730]],
] as const;

/** Equal-distance sampling keeps every photograph the same size around a bend. */
export function createFilmPath(compact = false) {
  const points: Point[] = [], scale = compact ? .56 : 1;
  let distance = 0;
  for (const curve of curves) for (let index = points.length ? 1 : 0; index <= 180; index++) {
    const t = index / 180, u = 1 - t;
    const x = scale * (u ** 3 * curve[0][0] + 3 * u * u * t * curve[1][0] + 3 * u * t * t * curve[2][0] + t ** 3 * curve[3][0]);
    const y = u ** 3 * curve[0][1] + 3 * u * u * t * curve[1][1] + 3 * u * t * t * curve[2][1] + t ** 3 * curve[3][1];
    const dx = scale * (3 * u * u * (curve[1][0] - curve[0][0]) + 6 * u * t * (curve[2][0] - curve[1][0]) + 3 * t * t * (curve[3][0] - curve[2][0]));
    const dy = 3 * u * u * (curve[1][1] - curve[0][1]) + 6 * u * t * (curve[2][1] - curve[1][1]) + 3 * t * t * (curve[3][1] - curve[2][1]);
    const previous = points.at(-1);
    if (previous) distance += Math.hypot(x - previous.x, y - previous.y);
    points.push({ x, y, distance, angle: Math.atan2(dy, dx) * 180 / Math.PI });
  }
  const line = (offset: number) => points.map((point, index) => {
    const angle = point.angle * Math.PI / 180;
    return `${index ? "L" : "M"}${(point.x - Math.sin(angle) * offset).toFixed(2)} ${(point.y + Math.cos(angle) * offset).toFixed(2)}`;
  }).join(" ");
  function at(value: number) {
    let low = 0, high = points.length - 1;
    while (low < high) { const middle = (low + high) >>> 1; if (points[middle].distance < value) low = middle + 1; else high = middle; }
    const point = points[low], previous = points[Math.max(0, low - 1)];
    const t = Math.max(0, Math.min(1, (value - previous.distance) / (point.distance - previous.distance || 1)));
    return { x: previous.x + (point.x - previous.x) * t, y: previous.y + (point.y - previous.y) * t, angle: previous.angle + (point.angle - previous.angle) * t };
  }
  return { length: distance, center: line(0), edges: [line(-48), line(48)], at };
}
