import { gradient } from "./gradient";
import { noise } from "./noise";
import { pixelate } from "./pixelate";
import { dither } from "./dither";
import { palette } from "./palette";
export { gradient, noise, pixelate, dither, palette };
export const SHADER_MODULES = [gradient, noise, pixelate, dither, palette] as const;
