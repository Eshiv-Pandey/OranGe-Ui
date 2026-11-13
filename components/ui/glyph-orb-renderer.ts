export type GlyphOrbRenderConfig = {
  color: string; shadowColor: string; background: string; glyphSize: number; spacing: number;
  size: number; tilt: number; bands: number; turbulence: number; speed: number;
  lightAngle: number; lightHeight: number; contrast: number; glow: number; charset: string;
};
export type GlyphStorm = { x: number; y: number; age: number };
export type GlyphOrbFrame = { time: number; rotation: number; latitudeRotation: number; lightX: number; lightY: number; storms: readonly GlyphStorm[] };
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, Number.isFinite(value) ? value : low));
export function glyphColor(value: string, fallback: readonly number[] = [245, 200, 150]) {
  let hex = value.replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex)) hex = hex.split("").map(character => character + character).join("");
  return /^[\da-f]{6}$/i.test(hex) ? [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] : [...fallback];
}

/** An original analytic sphere, latitudinal cloud field and diffuse light, drawn as text. */
export function drawGlyphOrb(context: CanvasRenderingContext2D, width: number, height: number, config: GlyphOrbRenderConfig, frame: GlyphOrbFrame) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = config.background; context.fillRect(0, 0, width, height);
  const font = clamp(config.glyphSize, 6, 24), cellX = font * .64 * clamp(config.spacing, .7, 1.8), cellY = font * 1.1;
  const radius = Math.min(width, height) * .405 * clamp(config.size, .45, 1.5), cx = width / 2, cy = height / 2;
  const tilt = clamp(config.tilt, -180, 180) * Math.PI / 180, cs = Math.cos(tilt), sn = Math.sin(tilt);
  const angle = clamp(config.lightAngle, -360, 360) * Math.PI / 180, lx = Math.sin(angle) + frame.lightX * .85, ly = -Math.cos(angle) + frame.lightY * .85, lz = clamp(config.lightHeight, .1, 1.5);
  const ln = Math.hypot(lx, ly, lz), light = [lx / ln, ly / ln, lz / ln];
  const color = glyphColor(config.color), dark = glyphColor(config.shadowColor, [94, 83, 151]);
  const charset = Array.from(config.charset || " .:-=+*#%@"), time = frame.time * clamp(config.speed, -5, 5), glow = clamp(config.glow, 0, 3);
  context.font = `600 ${font}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textAlign = "center"; context.textBaseline = "middle";
  const minX = Math.max(0, cx - radius * 1.08), maxX = Math.min(width, cx + radius * 1.08);
  const minY = Math.max(0, cy - radius * 1.08), maxY = Math.min(height, cy + radius * 1.08);
  const palette = Array.from({ length: 64 }, (_, index) => {
    const p = index / 63;
    return `rgb(${dark.map((channel, c) => Math.round(channel + (color[c] - channel) * p)).join(" ")})`;
  });
  // Center the cell lattice so the disc has equally clean left and right edges.
  for (let y = cy + Math.floor((minY - cy) / cellY) * cellY; y <= maxY; y += cellY) {
    for (let x = cx + Math.floor((minX - cx) / cellX) * cellX; x <= maxX; x += cellX) {
      const nx = (x - cx) / radius, ny = (y - cy) / radius, rr = nx * nx + ny * ny;
      if (rr > 1) {
        if (rr > 1.14 || glow <= .01) continue;
        const limb = Math.max(0, nx * light[0] + ny * light[1]);
        const alpha = (1 - (rr - 1) / .14) * limb * glow * .18;
        if (alpha < .025) continue;
        context.globalAlpha = alpha; context.fillStyle = config.color; context.fillText("·", x, y); continue;
      }
      const z = Math.sqrt(1 - rr), tx = nx * cs + ny * sn, ty = -nx * sn + ny * cs;
      const latitude = Math.asin(clamp(ty * Math.cos(frame.latitudeRotation) + z * Math.sin(frame.latitudeRotation), -1, 1));
      const longitude = Math.atan2(tx, z) + time * .19 + frame.rotation;
      let swirl = 0;
      for (const storm of frame.storms) {
        const dx = nx - storm.x, dy = ny - storm.y, distance = dx * dx + dy * dy;
        swirl += Math.sin(Math.atan2(dy, dx) * 2 - storm.age * 2 + distance * 24) * Math.exp(-distance * 16) * Math.max(0, 1 - storm.age / 6) * 2;
      }
      const flow = Math.sin(longitude * 3 + Math.sin(latitude * 7) * .85 + time * .14) * .5 + Math.sin(longitude * 7 - latitude * 4 + time * .09) * .2;
      const cloud = Math.sin(latitude * clamp(config.bands, 3, 18) * 2 + flow * clamp(config.turbulence, 0, 3) * 2 + swirl);
      const detail = Math.sin(longitude * 19 + latitude * 13 + time * .2) * Math.sin(latitude * 21 - longitude * 9);
      const field = .56 + cloud * .22 + detail * .07;
      const diffuse = Math.max(0, nx * light[0] + ny * light[1] + z * light[2]);
      const rim = Math.pow(1 - z, 3) * Math.max(0, nx * light[0] + ny * light[1]) * .35;
      const brightness = clamp(field * (.14 + diffuse * .9) + rim, 0, 1);
      const density = clamp(Math.pow(brightness, 1.1 - clamp(config.contrast, 0, 1) * .5), 0, 1);
      const character = charset[Math.min(charset.length - 1, Math.floor(density * charset.length))];
      if (character === " ") continue;
      context.globalAlpha = .22 + brightness * .78;
      context.fillStyle = palette[Math.min(63, Math.round(diffuse * 54 + rim * 9))];
      context.fillText(character, x, y);
    }
  }
  context.globalAlpha = 1;
}
