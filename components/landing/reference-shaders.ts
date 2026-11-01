// Shared flow coordinates keep the photographed cloud edges and glitter together.
const noise = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
}
float fbm(vec2 p) {
  float sum = 0.0, gain = .5;
  for (int i=0; i<4; i++) { sum += gain*noise(p); p = mat2(1.6,1.2,-1.2,1.6)*p; gain *= .5; }
  return sum;
}
vec2 cloudFlow(vec2 p, float t) {
  vec2 warp = vec2(fbm(p*3.2+vec2(t,-t*.43)),fbm(p*3.2+vec2(3.7-t*.31,t*.6)));
  return vec2(fbm(p*4.7+warp*1.5+vec2(t*.4,0)),fbm(p*4.7+warp*1.5+vec2(5,-t*.32)))-.5;
}
`;

export const REFERENCE_VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 point = vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  vUv = point; gl_Position = vec4(point*2.0-1.0,0,1);
}`;

export const REFERENCE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPlate, uFlowers, uClouds, uPerson, uGrass;
uniform vec2 uCover, uCenter, uPointer;
uniform float uTime, uMotion, uWindStrength, uWindSpeed, uGustSpeed;
uniform float uCloudSpeed, uCloudDisplacement, uGrain, uParallax;
${noise}
void main() {
  vec2 uv = (vUv-.5)*uCover+uCenter;
  vec2 p = vec2(uv.x,1.0-uv.y);
  float person = texture(uPerson,uv).r;
  float flowers = texture(uFlowers,uv).r;
  float clouds = texture(uClouds,uv).r;
  float grass = texture(uGrass,uv).r;
  float foreground = smoothstep(.54,.95,p.y);
  // Bright heads move, dark stems stay anchored. Foreground motion is slower.
  float phase = noise(p*vec2(19,27))*2.0;
  float gust = .55+.45*sin(uTime*uGustSpeed-p.x*7.5+noise(p*6.0));
  float sway = sin(uTime*uWindSpeed*(1.0-foreground*.32)-p.x*13.0+phase);
  sway += .22*sin(uTime*1.9-p.x*25.0+phase);
  float wind = (.26+sway)*(.38+gust*.7)*uWindStrength;
  vec2 flowerOffset = vec2(wind,-abs(wind)*.16)*flowers*(.45+foreground*1.75);
  vec2 grassOffset = vec2(wind*.11,0.0)*grass;
  // Bounded UV warping preserves the luminous river's recognizable course.
  vec2 flow = cloudFlow(p,uTime*uCloudSpeed);
  vec2 cloudOffset = vec2(flow.x,-flow.y)*uCloudDisplacement*clouds;
  vec2 offset = (flowerOffset+grassOffset+cloudOffset+uPointer*uParallax*(flowers+clouds*.35))*uMotion;
  offset *= 1.0-person;
  vec2 moved = clamp(uv+offset,vec2(.001),vec2(.999));
  // Do not pull the person into neighboring cloud pixels either.
  offset *= 1.0-texture(uPerson,moved).r;
  vec3 color = texture(uPlate,clamp(uv+offset,vec2(.001),vec2(.999))).rgb;
  float grain = (hash(gl_FragCoord.xy+floor(uTime*24.0))-.5)*uGrain*uMotion;
  float vignette = 1.0-dot(vUv-.5,vUv-.5)*.07;
  color = color*vignette+grain;
  // The protected silhouette stays unchanged while the surrounding scene moves.
  color = mix(color,texture(uPlate,uv).rgb,person);
  fragColor = vec4(color,1.0);
}`;

export const REFERENCE_SPARKLE_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec4 aSparkle;
layout(location=1) in vec3 aColor;
uniform vec2 uCover, uCenter;
uniform float uTime, uCloudSpeed, uCloudDisplacement, uDpr, uSparkleIntensity, uMotion;
out vec3 vColor;
out float vOpacity;
${noise}
void main() {
  vec2 p = vec2(aSparkle.x,1.0-aSparkle.y);
  vec2 flow = cloudFlow(p,uTime*uCloudSpeed);
  vec2 position = aSparkle.xy-vec2(flow.x,-flow.y)*uCloudDisplacement*uMotion;
  gl_Position = vec4(((position-uCenter)/uCover)*2.0,0,1);
  gl_PointSize = (3.0+aSparkle.w*1.3)*uDpr;
  float twinkle = pow(max(0.0,sin(aSparkle.z+uTime*(.42+.15*sin(aSparkle.z)))),3.0);
  vOpacity = (.02+twinkle*.98)*uSparkleIntensity*uMotion;
  vColor = aColor;
}`;

export const REFERENCE_SPARKLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vColor;
in float vOpacity;
out vec4 fragColor;
void main() {
  vec2 p = gl_PointCoord-.5;
  float distanceSquared = dot(p,p);
  float core = exp(-distanceSquared*110.0);
  float halo = exp(-distanceSquared*20.0)*.16;
  fragColor = vec4(vColor,(core+halo)*vOpacity);
}`;
