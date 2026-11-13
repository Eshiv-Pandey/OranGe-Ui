/** Original geometry on a 24-unit grid. Matching command signatures keep morphs continuous. */
export type MorphIconCategory = "Navigation" | "Media" | "Actions" | "Communication" | "Workspace";
export type MorphIconPath = {
  from: string;
  to: string;
  opacity?: readonly [number, number];
  filled?: boolean;
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
export const morphRect = (x: number, y: number, w: number, h: number, r = 0) => `M${x+r} ${y}L${x+w-r} ${y}Q${x+w} ${y} ${x+w} ${y+r}L${x+w} ${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}L${x+r} ${y+h}Q${x} ${y+h} ${x} ${y+h-r}L${x} ${y+r}Q${x} ${y} ${x+r} ${y}Z`;
export const morphPath = (from: string, to = from, options: Omit<MorphIconPath, "from" | "to"> = {}): MorphIconPath => ({ from, to, ...options });
