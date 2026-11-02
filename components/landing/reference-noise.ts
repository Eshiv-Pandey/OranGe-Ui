export const REFERENCE_NOISE_SIZE = 64;

/** One small, repeatable lookup replaces the cloud shader's nested noise loops. */
export function referenceNoiseTexels() {
  const data = new Uint8Array(REFERENCE_NOISE_SIZE * REFERENCE_NOISE_SIZE * 4);
  let seed = 20261102;
  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      data[i + channel] = (seed >>> 0) & 255;
    }
    data[i + 3] = 255;
  }
  return data;
}
