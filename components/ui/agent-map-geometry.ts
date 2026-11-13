export type MapCoordinate = { latitude: number; longitude: number };
export type MapPoint = { x: number; y: number };
export const MAP_TILE_SIZE = 256;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/** Web Mercator pixels, compatible with standard XYZ map tiles. */
export function projectMapCoordinate(coordinate: MapCoordinate, zoom: number): MapPoint {
  const size = MAP_TILE_SIZE * 2 ** zoom;
  const latitude = clamp(coordinate.latitude, -85.051129, 85.051129) * Math.PI / 180;
  return { x: (clamp(coordinate.longitude, -180, 180) + 180) / 360 * size, y: (1 - Math.log(Math.tan(latitude) + 1 / Math.cos(latitude)) / Math.PI) / 2 * size };
}

export function fitMapCoordinates(coordinates: readonly MapCoordinate[], width = 800, height = 460) {
  if (!coordinates.length) return { zoom: 13, center: { x: 4096, y: 4096 } };
  for (let zoom = 16; zoom >= 1; zoom--) {
    const points = coordinates.map(coordinate => projectMapCoordinate(coordinate, zoom));
    // Unwrap longitudes around the first point so routes across the date line fit.
    const size = MAP_TILE_SIZE * 2 ** zoom;
    points.forEach(point => { while (point.x - points[0].x > size / 2) point.x -= size; while (point.x - points[0].x < -size / 2) point.x += size; });
    const xs = points.map(point => point.x), ys = points.map(point => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    if ((maxX - minX <= width * .62 && maxY - minY <= height * .58) || zoom === 1) return { zoom, center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 } };
  }
  return { zoom: 1, center: projectMapCoordinate(coordinates[0], 1) };
}

export function mapTileUrl(template: string, x: number, y: number, zoom: number) {
  const limit = 2 ** zoom;
  return template.replace("{z}", String(zoom)).replace("{x}", String(((x % limit) + limit) % limit)).replace("{y}", String(clamp(y, 0, limit - 1)));
}

export function pointNearCenter(coordinate: MapCoordinate, zoom: number, center: MapPoint) {
  const point = projectMapCoordinate(coordinate, zoom), size = MAP_TILE_SIZE * 2 ** zoom;
  while (point.x - center.x > size / 2) point.x -= size;
  while (point.x - center.x < -size / 2) point.x += size;
  return point;
}
