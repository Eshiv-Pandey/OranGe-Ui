import { unzlibSync } from 'fflate';

/** Read 8-bit browser PNG pixels so drawing checks don't depend on DOM state. */
export function warmPixelCount(png: Buffer): number {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), type = png[25], channels = type === 6 ? 4 : 3;
  if (png[24] !== 8 || type !== 2 && type !== 6) throw new Error('Expected a browser RGB/RGBA PNG');
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const source = unzlibSync(Buffer.concat(chunks)), stride = width * channels;
  let previous = new Uint8Array(stride), count = 0, cursor = 0;
  for (let y = 0; y < height; y++) {
    const filter = source[cursor++], row = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0, up = previous[x], diagonal = x >= channels ? previous[x - channels] : 0;
      const p = left + up - diagonal, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - diagonal);
      const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? a <= b && a <= c ? left : b <= c ? up : diagonal : 0;
      row[x] = source[cursor++] + predictor;
    }
    for (let x = 0; x < stride; x += channels) if (row[x] > 220 && row[x + 1] > 130 && row[x + 1] < 225 && row[x + 2] < 170 && (channels === 3 || row[x + 3] > 180)) count++;
    previous = row;
  }
  return count;
}
