/** Small deterministic helpers shared by the interaction collection. */
export function bounded(value: number, min: number, max: number, fallback = min) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
}

export function seedValue(seed: string | number) {
  let value = 2166136261;
  for (const letter of String(seed)) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function seededRandom(seed: string | number) {
  let value = seedValue(seed);
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ value >>> 15, 1 | value);
    next ^= next + Math.imul(next ^ next >>> 7, 61 | next);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

export function graphemes(text: string) {
  // Feature detection also keeps source installs compatible with ES2020 lib types.
  const Segmenter = (Intl as typeof Intl & { Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => { segment(value: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(text), ({ segment }) => segment);
  const result: string[] = [];
  for (const letter of Array.from(text)) {
    const last = result[result.length - 1];
    if (last && (/\p{Mark}|[\uFE0E\uFE0F\u200D\u{1F3FB}-\u{1F3FF}]/u.test(letter) || /[\u200D\u094D]$/u.test(last))) result[result.length - 1] += letter;
    else result.push(letter);
  }
  return result;
}
