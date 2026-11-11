import { clamp, type ShaderModule } from "./types";
export const dither: ShaderModule = {
  id: "dither", kind: "effect", defaults: { mode: "bayer4", strength: .55, scale: 1 },
  uniforms: {
    uMode: { type: "int", value: (s) => Math.max(0, ["bayer4", "bayer8", "blueNoise"].indexOf(String(s.mode))) },
    uStrength: { type: "float", value: (s) => clamp(s.strength, 0, 1, .55) },
    uScale: { type: "float", value: (s) => clamp(s.scale, .5, 12, 1) },
  },
  fragment: `uniform int uMode;
uniform float uStrength;
uniform float uScale;
float bayer(ivec2 p, int levels) {
  int value = 0;
  for (int i = 0; i < 3; i++) {
    if (i >= levels) break;
    int x = (p.x >> i) & 1, y = (p.y >> i) & 1;
    value = value * 4 + ((x ^ y) * 2 + y);
  }
  return (float(value) + .5) / (levels == 2 ? 16.0 : 64.0);
}
// Toroidal void-and-cluster threshold ranks, generated once with sigma 1.15.
const float blue[64] = float[64](
  1.,58.,8.,31.,15.,4.,24.,14.,41.,19.,38.,55.,43.,61.,39.,54.,
  32.,51.,13.,25.,0.,29.,18.,9.,23.,5.,62.,36.,52.,12.,45.,59.,
  48.,28.,44.,7.,20.,57.,34.,2.,21.,56.,17.,33.,42.,27.,16.,40.,
  11.,37.,3.,60.,10.,53.,6.,63.,46.,26.,49.,22.,47.,35.,50.,30.);
void main() {
  ivec2 p = ivec2(floor(vUv * uCssSize / uScale));
  float threshold = uMode == 2 ? (blue[(p.y & 7) * 8 + (p.x & 7)] + .5) / 64.0 : bayer(p, uMode == 1 ? 3 : 2);
  float strength = uStrength * (1.0 - proximity(vUv) * uDitherProximity * .95);
  vec3 color = texture(uInput, vUv).rgb;
  fragColor = vec4(clamp(color + (threshold - .5) * strength * .45, 0.0, 1.0), 1);
}`,
};
