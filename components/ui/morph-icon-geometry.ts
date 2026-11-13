/** Original geometry on a 24-unit grid. Matching command signatures keep morphs continuous. */
export type MorphIconCategory = "Navigation" | "Media" | "Actions" | "Communication" | "Workspace";
export type MorphIconPath = {
  from: string;
  to: string;
  opacity?: readonly [number, number];
  filled?: boolean;
  rotation?: readonly [number, number];
  origin?: readonly [number, number];
  draw?: readonly [number, number];
  geometryPhase?: readonly [number, number];
  opacityPhase?: readonly [number, number];
  rotationPhase?: readonly [number, number];
  drawPhase?: readonly [number, number];
  keyframes?: readonly { at: number; d: string }[];
};
export type MorphIconDefinition = {
  name: string;
  title: string;
  category: MorphIconCategory;
  states: readonly [string, string];
  paths: readonly MorphIconPath[];
};
export const morphLine = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}`;
export const morphPolyline = (points: readonly (readonly [number, number])[], closed = false) => points.map(([x,y],i) => `${i ? "L" : "M"}${x} ${y}`).join("") + (closed ? "Z" : "");
export const morphCircle = (cx: number, cy: number, r: number) => {
  const k = r * .55228475;
  return `M${cx+r} ${cy}C${cx+r} ${cy+k} ${cx+k} ${cy+r} ${cx} ${cy+r}C${cx-k} ${cy+r} ${cx-r} ${cy+k} ${cx-r} ${cy}C${cx-r} ${cy-k} ${cx-k} ${cy-r} ${cx} ${cy-r}C${cx+k} ${cy-r} ${cx+r} ${cy-k} ${cx+r} ${cy}Z`;
};
export const morphRect = (x: number, y: number, w: number, h: number, radius = 0) => {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2)), k = r * .55228475;
  return `M${x+r} ${y}L${x+w-r} ${y}C${x+w-r+k} ${y} ${x+w} ${y+r-k} ${x+w} ${y+r}L${x+w} ${y+h-r}C${x+w} ${y+h-r+k} ${x+w-r+k} ${y+h} ${x+w-r} ${y+h}L${x+r} ${y+h}C${x+r-k} ${y+h} ${x} ${y+h-r+k} ${x} ${y+h-r}L${x} ${y+r}C${x} ${y+r-k} ${x+r-k} ${y} ${x+r} ${y}Z`;
};
/** One joined confirmation mark, optically centered, with a 1:2 leg ratio. */
export const morphCheck = (cx = 12, cy = 12, scale = 1) => morphPolyline([[cx - 4.5 * scale, cy], [cx - 1.5 * scale, cy + 3 * scale], [cx + 4.5 * scale, cy - 3 * scale]]);
export const morphPath = (from: string, to = from, options: Omit<MorphIconPath, "from" | "to"> = {}): MorphIconPath => ({ from, to, ...options });
