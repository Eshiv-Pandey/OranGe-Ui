import type { SVGProps } from "react";

export type PixelPalette = Readonly<Record<string, string>>;

export function PixelSprite({ rows, palette, ...props }: SVGProps<SVGSVGElement> & { rows: readonly string[]; palette: PixelPalette }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" shapeRendering="crispEdges" {...props}>
      {rows.flatMap((row, y) => [...row].flatMap((pixel, x) =>
        palette[pixel] ? [<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={palette[pixel]} />] : [],
      ))}
    </svg>
  );
}
