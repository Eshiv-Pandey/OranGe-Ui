import { REFERENCE_NOISE_SIZE } from "./reference-noise";

// The small lookup uses hardware interpolation instead of nested per-pixel
// fractal loops. Both photographed mist and glints follow this same current.
const flow = `
uniform sampler2D uNoise;
vec2 field(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return texture(uNoise,(cell+f+.5)/${REFERENCE_NOISE_SIZE}.0).rg;
}
vec2 cloudVelocity(vec2 p) {
  vec2 drift = field(p*vec2(4.5,7.0));
  float depth = .22+.78*smoothstep(.10,.52,p.y);
  return vec2(.56+drift.x*.38,(drift.y-.5)*.34+sin(p.x*8.0+p.y*15.0)*.12)*depth;
}
`;

export const REFERENCE_VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 point = vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  vUv = point; gl_Position = vec4(point*2.0-1.0,0,1);
}`;

/** Padded ink sprites stay centered at their source-painting positions. */
export const REFERENCE_BIRD_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec4 aBird;
layout(location=1) in vec4 aWing;
uniform vec2 uCover, uCenter;
out vec2 vLocal;
flat out vec2 vTile;
flat out float vHalfSpan, vPhase;
void main() {
  const vec2 corners[6] = vec2[6](vec2(0,0),vec2(1,0),vec2(0,1),vec2(0,1),vec2(1,0),vec2(1,1));
  vLocal = corners[gl_VertexID];
  vec2 position = aBird.xy+(vLocal-.5)*aBird.zw;
  gl_Position = vec4((position-uCenter)/uCover*2.0,0,1);
  vHalfSpan = aWing.x; vPhase = aWing.y; vTile = aWing.zw;
}`;

export const REFERENCE_BIRD_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vLocal;
flat in vec2 vTile;
flat in float vHalfSpan, vPhase;
uniform sampler2D uBirds;
uniform vec2 uAtlasGrid, uTileSize;
uniform float uTime, uMotion, uGustSpeed, uWindStrength;
out vec4 fragColor;
void main() {
  // A narrow body strip is fixed. Only wing tips bend, with independent
  // phases and the same slow cadence as the scene's wind gusts.
  float wing = smoothstep(1.2/uTileSize.x,max(2.0/uTileSize.x,vHalfSpan),abs(vLocal.x-.5));
  float amplitude = min(2.2,.9+uWindStrength*90.0);
  float flap = sin(uTime*uGustSpeed+vPhase)*amplitude*uMotion;
  vec2 source = vLocal-vec2(0,flap*wing/uTileSize.y);
  if (any(lessThan(source,vec2(0))) || any(greaterThan(source,vec2(1)))) discard;
  vec4 ink = texture(uBirds,(vTile+source)/uAtlasGrid);
  if (ink.a < .003) discard;
  fragColor = ink;
}`;

export const REFERENCE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPlate, uFlowers, uClouds, uPerson, uGrass;
uniform vec2 uCover, uCenter, uPointer;
uniform float uTime, uMotion, uWindStrength, uWindSpeed, uGustSpeed;
uniform float uCloudSpeed, uCloudDisplacement, uGrain, uParallax;
${flow}
float grainHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx)*.1031);
  q += dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
vec2 protect(vec2 uv, vec2 offset, float person) {
  offset *= 1.0-person;
  // Also protect the source sample: moving mist must never borrow the figure.
  return offset*(1.0-texture(uPerson,clamp(uv+offset,vec2(.001),vec2(.999))).r);
}
vec3 samplePlate(vec2 uv, vec2 offset, float person) {
  return texture(uPlate,clamp(uv+protect(uv,offset,person),vec2(.001),vec2(.999))).rgb;
}
vec3 sampleMist(vec2 uv, vec2 offset, float person, vec3 original) {
  vec2 source = clamp(uv+protect(uv,offset,person),vec2(.001),vec2(.999));
  // The flattened plate also contains the hill. Only advect source pixels
  // inside the sky matte, or the wind would copy grass out into the mist.
  float available = smoothstep(.75,.99,texture(uClouds,source).r);
  return mix(original,texture(uPlate,source).rgb,available);
}
void main() {
  vec2 uv = (vUv-.5)*uCover+uCenter;
  vec2 p = vec2(uv.x,1.0-uv.y);
  float person = texture(uPerson,uv).r;
  vec3 original = texture(uPlate,uv).rgb;
  if (person > .999) { fragColor = vec4(original,1.0); return; }

  // Average the head/tip matte slightly so each flower clump bends coherently,
  // rather than stretching every bright petal independently. Dark roots hold.
  float flowers = textureLod(uFlowers,uv,1.4).r;
  float grass = textureLod(uGrass,uv,1.4).r;
  float clouds = texture(uClouds,uv).r;
  float foreground = smoothstep(.48,.94,p.y);
  float phase = field(p*vec2(10.0,16.0)).x*4.0;
  float gust = pow(.5+.5*sin(uTime*uGustSpeed-p.x*6.5+p.y*3.0),3.0);
  float sway = sin(uTime*uWindSpeed*(1.0-foreground*.2)-p.x*8.0+phase);
  sway += .28*sin(uTime*5.2-p.x*16.0+phase);
  float wind = (.4+sway*.55)*(.48+gust*.85)*uWindStrength;
  vec2 bend = vec2(wind,-abs(wind)*.2);
  vec2 landOffset = bend*(flowers*(.6+foreground*1.15)+grass*.9);
  landOffset += uPointer*uParallax*flowers;
  vec3 color = samplePlate(uv,landOffset*uMotion,person);

  if (clouds > .001 && uMotion > .5) {
    vec2 velocity = cloudVelocity(p);
    vec2 travel = vec2(velocity.x,-velocity.y)*uCloudDisplacement;
    vec2 billow = (field(p*13.0+vec2(uTime*.16,-uTime*.07))-.5)*uCloudDisplacement*.08;
    // Two staggered advection phases keep the cloud texture moving in one
    // direction. Each reset happens at zero weight, so there is no snap back.
    float first = fract(uTime*uCloudSpeed), second = fract(first+.5);
    float blend = smoothstep(0.0,1.0,abs(first*2.0-1.0));
    vec2 local = billow+uPointer*uParallax*.3;
    vec3 a = sampleMist(uv,(-travel*first+local)*clouds,person,original);
    vec3 b = sampleMist(uv,(-travel*second+local)*clouds,person,original);
    color = mix(color,mix(a,b,blend),clouds);
  }

  float grain = (grainHash(gl_FragCoord.xy+floor(uTime*24.0))-.5)*uGrain*uMotion;
  float vignette = 1.0-dot(vUv-.5,vUv-.5)*.07;
  color = color*vignette+grain;
  fragColor = vec4(mix(color,original,person),1.0);
}`;

export const REFERENCE_SPARKLE_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec4 aSparkle;
layout(location=1) in vec3 aColor;
uniform vec2 uCover, uCenter;
uniform float uTime, uCloudSpeed, uCloudDisplacement, uDpr, uSparkleIntensity, uSparkleSpeed, uMotion;
out vec3 vColor;
out float vOpacity, vRays;
${flow}
void main() {
  vec2 p = vec2(aSparkle.x,1.0-aSparkle.y);
  vec2 velocity = cloudVelocity(p);
  float life = fract(uTime*uCloudSpeed+aSparkle.z/6.283185);
  vec2 position = aSparkle.xy+vec2(velocity.x,-velocity.y)*uCloudDisplacement*(life-.5)*uMotion;
  gl_Position = vec4(((position-uCenter)/uCover)*2.0,0,1);
  gl_PointSize = (4.0+aSparkle.w*1.8)*uDpr;
  float pulse = .5+.5*sin(aSparkle.z+uTime*uSparkleSpeed*(.8+aSparkle.w*.4));
  float twinkle = pow(pulse,8.0);
  float lifetime = smoothstep(0.0,.12,life)*(1.0-smoothstep(.8,1.0,life));
  vOpacity = (.015+twinkle*.985)*uSparkleIntensity*uMotion*lifetime;
  vRays = smoothstep(1.4,1.8,aSparkle.w)*twinkle;
  vColor = aColor;
}`;

export const REFERENCE_SPARKLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vColor;
in float vOpacity, vRays;
uniform sampler2D uPerson, uClouds;
uniform vec2 uCover, uCenter, uResolution;
out vec4 fragColor;
void main() {
  // Mask the complete point sprite, not just its original center. Glints can
  // drift past the person and terrain without ever painting over either.
  vec2 uv = (gl_FragCoord.xy/uResolution-.5)*uCover+uCenter;
  float region = texture(uClouds,uv).r*(1.0-texture(uPerson,uv).r);
  vec2 p = gl_PointCoord-.5;
  float distanceSquared = dot(p,p);
  float core = exp(-distanceSquared*110.0);
  float halo = exp(-distanceSquared*20.0)*.2;
  float rays = (exp(-abs(p.x)*85.0-abs(p.y)*9.0)+exp(-abs(p.y)*85.0-abs(p.x)*9.0))*.12*vRays;
  fragColor = vec4(vColor,(core+halo+rays)*vOpacity*region);
}`;
