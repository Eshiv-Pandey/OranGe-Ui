import type { StickerFinish, StickerMotion, StickerName } from "../components/ui/sticker-pack";

export type StickerOptions = { size: number; rotate: number; finish: StickerFinish; motion: StickerMotion; duration: number; intensity: number; shadow: boolean };
export const DEFAULT_STICKER_OPTIONS: StickerOptions = { size: 180, rotate: 0, finish: "sharp", motion: "bounce", duration: 650, intensity: 1, shadow: true };
/** Square envelope across the authored keyframes, including proportional displacement. */
export function stickerMotionExtent(options: StickerOptions): number {
  const angle = options.rotate * Math.PI / 180;
  if (options.motion === "spin") return options.size * Math.SQRT2 * 1.04;
  const frames = options.motion === "bounce" ? [[1,1,0,0], [1.06,.9,-3,.015 * options.intensity], [.96,1.07,5,-.05 * options.intensity], [1.02,.98,-2,.01]] : options.motion === "wiggle" ? [0, -10, 8, -5, 2].map(value => [1,1,value * options.intensity,0]) : [[1,1,0,0]];
  return options.size * Math.max(...frames.flatMap(([xScale,yScale,rotation,translate]) => {
    const radians = angle + rotation * Math.PI / 180;
    return [xScale * Math.abs(Math.cos(radians)) + yScale * Math.abs(Math.sin(radians)) + 2 * Math.abs(translate * Math.sin(angle)), xScale * Math.abs(Math.sin(radians)) + yScale * Math.abs(Math.cos(radians)) + 2 * Math.abs(translate * Math.cos(angle))];
  }));
}
export function stickerReactCode(name: StickerName, options: StickerOptions) {
  return `import { Sticker } from "orangeui-stickers";\nimport "orangeui-stickers/styles.css";\n\n<Sticker\n  name="${name}"\n  finish="${options.finish}"\n  size={${options.size}}\n  rotate={${options.rotate}}\n  motion="${options.motion}"\n  duration={${options.duration}}\n  intensity={${options.intensity}}\n  shadow={${options.shadow}}\n  interactive\n/>`;
}
