export const FILM_FRAME_SPACING = 148;
export type FilmPoint = { x: number; y: number; z: number; distance: number; angle: number; nx: number; ny: number; nz: number };
const knots = [
  [-650, 350, -35], [-360, 240, -20], [-250, 20, 15], [-330, -170, 25],
  [-160, -260, 40], [80, -80, 40], [260, 180, 0], [430, 190, -30],
  [460, -20, -45], [340, -200, -25], [460, -230, 5], [680, -90, 10],
] as const;

/** A smooth, spatial film loop. Distance drives both photos and perforations. */
export function createFilmPath(compact = false) {
  const points: FilmPoint[] = [], scale = compact ? .5 : 1;
  function position(t: number) {
    const segment = Math.min(knots.length - 2, Math.floor(t)), u = t - segment;
    const a = knots[Math.max(0, segment - 1)], b = knots[segment], c = knots[segment + 1], d = knots[Math.min(knots.length - 1, segment + 2)];
    const coordinate = (axis: 0 | 1 | 2) => .5 * ((2 * b[axis]) + (-a[axis] + c[axis]) * u + (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * u * u + (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * u * u * u);
    return { x: coordinate(0) * scale, y: coordinate(1), z: coordinate(2) };
  }
  let distance = 0;
  const count = 720, extent = knots.length - 1;
  for (let index = 0; index <= count; index++) {
    const t = index / count * extent, point = position(t);
    const before = position(Math.max(0, t - .002)), after = position(Math.min(extent, t + .002));
    const dx = after.x - before.x, dy = after.y - before.y, dz = after.z - before.z;
    const tangentLength = Math.hypot(dx, dy, dz) || 1, tx = dx / tangentLength, ty = dy / tangentLength, tz = dz / tangentLength;
    const horizontal = Math.hypot(tx, ty) || 1, ax = -ty / horizontal, ay = tx / horizontal;
    const bx = -tz * ay, by = tz * ax, bz = tx * ay - ty * ax;
    const progress = index / count;
    const twist = Math.sin(progress * Math.PI * 3 - .3) * .16 + .22 * Math.exp(-Math.pow((progress - .67) / .16, 2));
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
