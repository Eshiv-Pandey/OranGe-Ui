/** All scene tuning lives here. Distances are fractions of the source image. */
export const REFERENCE_SCENE_CONFIG = {
  windStrength: 0.014,
  windSpeed: 2.9,
  gustSpeed: 1.7,
  cloudSpeed: 0.17,
  cloudDisplacement: 0.048,
  sparkleCount: 0,
  sparkleIntensity: 1.05,
  sparkleSpeed: 1.1,
  grain: 0.002,
  parallax: 0.0012,
  maxDpr: 2,
  maxPixels: 1_600_000,
} as const;

export type ReferenceSceneConfig = { [Key in keyof typeof REFERENCE_SCENE_CONFIG]: number };

export const REFERENCE_SCENE_ASSETS = {
  plate: "/landing/sunset-flight-scene.png",
  flowers: "/landing/sunset-empty-mask.png",
  clouds: "/landing/sunset-clouds-mask.png",
  person: "/landing/sunset-still-mask.png",
  grass: "/landing/sunset-trees-mask.png",
  birds: "/landing/sunset-birds.png",
} as const;

/** Matches CSS cover at 50% 64%, keeping the forest crowns in wide viewports. */
export function referenceCover(width: number, height: number, imageWidth = 736, imageHeight = 920) {
  const aspect = Math.max(1, width) / Math.max(1, height), imageAspect = imageWidth / imageHeight;
  const x = Math.min(1, aspect / imageAspect), y = Math.min(1, imageAspect / aspect);
  // CSS positions the overflow, rather than the image center. WebGL's Y axis
  // runs upward, so translate the lower anchor into the same source crop.
  const verticalAnchor = aspect >= 2.5 ? .56 : .64;
  return { scale: [x, y] as const, center: [.5, 1 - (y * .5 + (1 - y) * verticalAnchor)] as const };
}

/** A deterministic weighted distribution follows the photographed luminous river. */
export function referenceSparkles(width: number, height: number, plate: Uint8ClampedArray, clouds: Uint8ClampedArray, person: Uint8ClampedArray, count: number) {
  const result: number[] = [];
  const radius = Math.max(1, Math.round(Math.min(width, height) * .016));
  const luminance = (x: number, y: number) => {
    const index = (Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4;
    return (plate[index] * .2126 + plate[index + 1] * .7152 + plate[index + 2] * .0722) / 255;
  };
  let seed = 20261101;
  const random = () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
  const limit = Math.min(2400, Math.max(0, Math.round(count)));
  for (let attempt = 0; result.length < limit * 7 && attempt < limit * 220; attempt++) {
    const x = random(), y = random() * .6, px = Math.min(width - 1, Math.floor(x * width)), py = Math.min(height - 1, Math.floor(y * height));
    const index = (py * width + px) * 4;
    // The river begins below the distant sky. The cloud matte alone is too
    // broad: blue sky is bright in its blue channel but is not luminous mist.
    if (y < .14 || person[index] > 0 || clouds[index] < 96) continue;
    const light = luminance(px, py);
    const surrounding = (luminance(px - radius, py) + luminance(px + radius, py) + luminance(px, py - radius) + luminance(px, py + radius)) / 4;
    const ridge = Math.max(0, light - surrounding - .018);
    const warmCore = plate[index] >= plate[index + 1] * .94 && plate[index] >= plate[index + 2] * .9;
    const emission = Math.min(1, ridge * 9 + (warmCore ? Math.max(0, light - .64) * 3 : 0));
    const weight = emission * Math.pow(Math.max(0, (light - .38) / .62), .6) * clouds[index] / 255;
    if (!weight || random() > weight) continue;
    const cyan = plate[index + 2] - plate[index] > 12;
    result.push(x, 1 - y, random() * Math.PI * 2, .7 + random() * 1.1,
      cyan ? .48 : 1, cyan ? .92 : .84, cyan ? 1 : .79);
  }
  return new Float32Array(result);
}
