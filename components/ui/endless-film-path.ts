export const FILM_FRAME_SPACING = 236;
export type FilmPoint = { x: number; y: number; z: number; distance: number; angle: number; nx: number; ny: number; nz: number };
const knots = [
  [-740, 300, -35], [-430, 220, -20], [-290, 20, 15], [-300, -150, 25],
  [-100, -230, 40], [130, -70, 40], [310, 150, 0], [480, 180, -30],
  [540, 20, -35], [530, -130, -20], [650, -190, 5], [810, -100, 10],
] as const;
const compactKnots = [
  [-420, 290, -20], [-230, 230, -15], [-150, 100, 0], [-155, -60, 15],
  [-80, -200, 30], [90, -215, 30], [210, -110, 10], [235, 80, -10], [410, 210, -30],
] as const;

/** A smooth, spatial film loop. Distance drives both photos and perforations. */
export function createFilmPath(compact = false) {
  const points: FilmPoint[] = [], sourceKnots = compact ? compactKnots : knots;
  function position(t: number) {
    const segment = Math.min(sourceKnots.length - 2, Math.floor(t)), u = t - segment;
    const a = sourceKnots[Math.max(0, segment - 1)], b = sourceKnots[segment], c = sourceKnots[segment + 1], d = sourceKnots[Math.min(sourceKnots.length - 1, segment + 2)];
    const coordinate = (axis: 0 | 1 | 2) => .5 * ((2 * b[axis]) + (-a[axis] + c[axis]) * u + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * u * u + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * u * u * u);
    return { x: coordinate(0), y: coordinate(1), z: coordinate(2) };
  }
  let distance = 0;
  const count = 720, extent = sourceKnots.length - 1;
  for (let index = 0; index <= count; index++) {
    const t = index / count * extent, point = position(t);
    const before = position(Math.max(0, t - .002)), after = position(Math.min(extent, t + .002));
    const dx = after.x - before.x, dy = after.y - before.y, dz = after.z - before.z;
    const tangentLength = Math.hypot(dx, dy, dz) || 1, tx = dx / tangentLength, ty = dy / tangentLength, tz = dz / tangentLength;
    const horizontal = Math.hypot(tx, ty) || 1, ax = -ty / horizontal, ay = tx / horizontal;
    const bx = -tz * ay, by = tz * ax, bz = tx * ay - ty * ax;
    const progress = index / count;
    const twist = Math.sin(progress * Math.PI * 3 - .3) * .08 + .1 * Math.exp(-Math.pow((progress - .67) / .16, 2));
    const nx = ax * Math.cos(twist) + bx * Math.sin(twist), ny = ay * Math.cos(twist) + by * Math.sin(twist), nz = bz * Math.sin(twist);
    const previous = points.at(-1);
    if (previous) distance += Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z);
    points.push({ ...point, distance, nx, ny, nz, angle: Math.atan2(dy, dx) * 180 / Math.PI });
  }
  function at(value: number) {
    let low = 0, high = points.length - 1;
    while (low < high) { const middle = (low + high) >>> 1; if (points[middle].distance < value) low = middle + 1; else high = middle; }
    const point = points[low], previous = points[Math.max(0, low - 1)];
    const t = Math.max(0, Math.min(1, (value - previous.distance) / (point.distance - previous.distance || 1)));
    const mix = (key: keyof FilmPoint) => previous[key] + (point[key] - previous[key]) * t;
    return { x: mix('x'), y: mix('y'), z: mix('z'), nx: mix('nx'), ny: mix('ny'), nz: mix('nz'), angle: mix('angle') };
  }
  return { length: distance, points, at };
}
