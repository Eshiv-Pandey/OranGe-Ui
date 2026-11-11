/**
 * Seeded lookup noise, with paired slices for one-fetch 3D interpolation.
 * The texture packing follows Shader Sky by jay sharma / 23rd.dev (MIT).
 * See THIRD_PARTY_NOTICES.md. This replaces per-pixel procedural hashing.
 */
export function cloudNoiseTexels() {
  const size = 256, data = new Uint8Array(size * size * 4);
  let seed = 0x23d;
  const random = () => { seed = (seed + 0x6d2b79f5) | 0; let n = Math.imul(seed ^ (seed >>> 15), 1 | seed); n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n; return ((n ^ (n >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < size * size; i++) data[i * 4] = Math.floor(random() * 256);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const from = ((y - 239) & 255) * size + ((x - 37) & 255), index = (y * size + x) * 4;
    data[index + 1] = data[from * 4]; data[index + 3] = 255;
  }
  return data;
}
