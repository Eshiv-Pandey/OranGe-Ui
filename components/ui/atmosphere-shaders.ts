import { clamp, hexRgb, type ShaderModule, type ShaderUniform } from "./shader-canvas/types";

const number = (key: string, min: number, max: number, fallback: number): ShaderUniform => ({ type: "float", value: settings => clamp(settings[key], min, max, fallback) });
const color = (key: string, fallback: string): ShaderUniform => ({ type: "vec3", value: settings => hexRgb(settings[key] ?? fallback) });
const declarations = `uniform vec3 uColor; uniform vec3 uAccent; uniform vec3 uBackground; uniform float uSpeed; uniform float uSeed;`;
const shared = (primary: string, accent: string, background: string) => ({
  uColor: color("color", primary), uAccent: color("accent", accent), uBackground: color("background", background),
  uSpeed: number("speed", 0, 2, .3), uSeed: number("seed", 0, 1000, 7),
});

/** Original piecewise electrical bridge and fork geometry, not a port of Lightning. */
export const arcFieldShader: ShaderModule = {
  id: "arc-field", kind: "source", defaults: {}, renderBudget: { maxPixels: 140_000, maxFps: 24 },
  uniforms: { ...shared("#ffbd73", "#fff0cf", "#19130f"), uSpread: number("spread", .2, 2, 1), uGlow: number("glow", 0, 2, 1), uBranches: number("branches", 0, 6, 4) },
  fragment: `${declarations}
uniform float uSpread; uniform float uGlow; uniform float uBranches;
float segmentDistance(vec2 p, vec2 a, vec2 b) { vec2 d = b-a; return length(p-a-d*clamp(dot(p-a,d)/max(dot(d,d),.000001),0.0,1.0)); }
vec2 terminalPoint(float i, float t) {
  float x = .08 + i / 40.0 * .84;
  float envelope = sin(i/40.0*3.141593);
  float y = .5 + envelope*uSpread*(sin(i*.6924+t*1.8+uSeed)*.063+sin(i*1.652-t*2.7)*.025+sin(i*4.871+t*3.4)*.009);
  y += (uPointer.y-.5)*uPointerActive*.14*envelope;
  return vec2(x,y);
}
void main() {
  vec2 uv = sourceUv(); float t = uTime*uSpeed;
  float aspect = uCssSize.x/max(uCssSize.y,1.0); vec2 metric = vec2(aspect,1.0);
  float d = 10.0;
  for(int i=0;i<40;i++) { vec2 a=terminalPoint(float(i),t),b=terminalPoint(float(i+1),t); d=min(d,segmentDistance(uv*metric,a*metric,b*metric)); }
  float fork=10.0;
  for(int i=0;i<6;i++) {
    if(float(i)>=uBranches) break;
    float j=7.5+float(i)*4.5; vec2 a=terminalPoint(j,t);
    float signum=mod(float(i),2.0)*2.0-1.0;
    vec2 b=a+vec2(.04,sin(float(i)*1.3+t)*.035+signum*.075)*uSpread;
    vec2 c=b+vec2(.055,signum*.09)*uSpread;
    fork=min(fork,min(segmentDistance(uv*metric,a*metric,b*metric),segmentDistance(uv*metric,b*metric,c*metric)));
  }
  float pixel=1.2/max(uResolution.y,1.0);
  float core=1.0-smoothstep(pixel*.25,pixel*1.15,d);
  float branch=(1.0-smoothstep(pixel*.2,pixel*.85,fork))*.42;
  float glow=exp(-d*75.0)*.35+exp(-fork*95.0)*.12;
  float terminals=exp(-length((uv-vec2(.08,.5))*metric)*110.0)+exp(-length((uv-vec2(.92,.5))*metric)*110.0);
  vec3 base=uBackground+uColor*(glow*uGlow+terminals*.5);
  base=mix(base,uAccent,clamp(core+branch,0.0,1.0)*(.82+.12*sin(t*4.0)));
  fragColor=vec4(clamp(base,0.0,1.0),1.0);
}`,
};

/** Original curved-height surface: normals, broad folds and grazing satin light. */
export const satinFlowShader: ShaderModule = {
  id: "satin-flow", kind: "source", defaults: {}, renderBudget: { maxPixels: 180_000, maxFps: 24 },
  uniforms: { ...shared("#cb857d", "#fff1dc", "#392b32"), uFolds: number("folds", 2, 12, 5), uDrape: number("drape", 0, 2, .8), uSheen: number("sheen", 0, 2, 1), uAngle: number("angle", -180, 180, -18) },
  fragment: `${declarations}
uniform float uFolds; uniform float uDrape; uniform float uSheen; uniform float uAngle;
float fabric(vec2 p,float t) {
  float phase=p.x*uFolds*3.141593+sin(p.y*2.3+t*.4+uSeed*.07)*uDrape;
  return sin(phase)*.24+sin(phase*2.0+p.y*.8)*.065+sin(p.y*2.0-t*.2)*.08;
}
void main() {
  vec2 uv=sourceUv(), p=(uv-.5)*2.0; p.x*=uCssSize.x/max(uCssSize.y,1.0);
  float angle=uAngle*.0174533+(uPointer.x-.5)*uPointerActive*.13; float c=cos(angle),s=sin(angle);
  p=mat2(c,-s,s,c)*p; float t=uTime*uSpeed;
  float h=fabric(p,t), eps=.008;
  vec3 normal=normalize(vec3(-(fabric(p+vec2(eps,0.0),t)-h)/eps*.15,-(fabric(p+vec2(0.0,eps),t)-h)/eps*.15,1.0));
  vec3 light=normalize(vec3(-.7,.3,1.2));
  float diffuse=max(dot(normal,light),0.0);
  vec3 halfVector=normalize(light+vec3(0,0,1));
  float sheen=pow(max(dot(normal,halfVector),0.0),24.0)*uSheen;
  float fold=sin(p.x*uFolds*3.141593+sin(p.y*2.3+t*.4+uSeed*.07)*uDrape);
  vec3 cloth=mix(uBackground,uColor,.38+diffuse*.5);
  cloth*=.7+smoothstep(-1.0,1.0,fold)*.3;
  cloth=mix(cloth,uAccent,clamp(sheen*.45,0.0,.8));
  fragColor=vec4(clamp(cloth,0.0,1.0),1.0);
}`,
};

/** Original analytic cartography: three drifting hills, readable major contours. */
export const contourTerrainShader: ShaderModule = {
  id: "contour-terrain", kind: "source", defaults: {}, renderBudget: { maxPixels: 180_000, maxFps: 24 },
  uniforms: { ...shared("#507b74", "#b57748", "#f0eee5"), uLevels: number("levels", 6, 40, 18), uElevation: number("elevation", .25, 2, 1), uLineWidth: number("lineWidth", .5, 2.5, 1), uScale: number("scale", .5, 3, 1) },
  fragment: `${declarations}
uniform float uLevels; uniform float uElevation; uniform float uLineWidth; uniform float uScale;
float hill(vec2 p,vec2 center,vec2 stretch) { vec2 q=(p-center)*stretch; return exp(-dot(q,q)*2.0); }
void main() {
  vec2 uv=sourceUv(),p=(uv-.5)*2.0; p.x*=uCssSize.x/max(uCssSize.y,1.0); p*=uScale;
  float t=uTime*uSpeed*.18+uSeed*.013;
  float h=hill(p,vec2(-.62+sin(t)*.12,.18),vec2(1.1,1.7))*.9;
  h+=hill(p,vec2(.66,-.28+cos(t)*.1),vec2(1.6,.8))*.75;
  h+=hill(p,vec2(.06,.78),vec2(1.4,2.0))*.55;
  h+=sin(p.x*3.2+p.y*2.8+t)*.06+cos(p.x*5.1-p.y*3.0)*.025;
  h+=proximity(uv)*.15; h*=uElevation;
  float value=h*uLevels,part=fract(value),distance=min(part,1.0-part);
  float aa=max(fwidth(value),.009)*uLineWidth;
  float lines=1.0-smoothstep(aa*.3,aa,distance);
  float majorValue=value/5.0,majorPart=fract(majorValue),majorDistance=min(majorPart,1.0-majorPart);
  float major=1.0-smoothstep(max(fwidth(majorValue),.005)*.3,max(fwidth(majorValue),.005)*1.6,majorDistance);
  vec3 paper=uBackground*(1.0-clamp(h,0.0,1.0)*.07);
  vec3 ink=mix(uColor,uAccent,major);
  fragColor=vec4(mix(paper,ink,clamp(lines*.58+major*.32,0.0,.9)),1.0);
}`,
};

/** Original twin-source oscilloscope interference inside a rounded signal lens. */
export const signalLensShader: ShaderModule = {
  id: "signal-lens", kind: "source", defaults: {}, renderBudget: { maxPixels: 160_000, maxFps: 24 },
  uniforms: { ...shared("#74d9c3", "#eeaa72", "#081b1c"), uDensity: number("density", 4, 24, 10), uCurvature: number("curvature", 0, 1, .35), uScanlines: number("scanlines", 0, 1, .4), uChromatic: number("chromatic", 0, 2, .5) },
  fragment: `${declarations}
uniform float uDensity; uniform float uCurvature; uniform float uScanlines; uniform float uChromatic;
float signal(vec2 p,float t) {
  vec2 a=vec2(-.45+sin(t*.4)*.12,.12),b=vec2(.42,-.18+cos(t*.3)*.1);
  float first=cos(length(p-a)*uDensity*3.141593-t*2.0);
  float second=cos(length(p-b)*uDensity*2.4+t*1.3);
  return pow(max(first*second,0.0),2.0);
}
void main() {
  vec2 uv=sourceUv(),q=(uv-.5)*2.0; float aspect=uCssSize.x/max(uCssSize.y,1.0);
  q*=1.0+dot(q,q)*uCurvature*.18; vec2 p=q*vec2(aspect,1.0);
  float t=uTime*uSpeed+uSeed*.01;
  vec2 offset=vec2(.009*uChromatic,0.0);
  vec3 rgb=vec3(signal(p+offset,t),signal(p,t),signal(p-offset,t));
  float line=.7+.3*cos(gl_FragCoord.y*3.141593);
  rgb*=mix(1.0,line,uScanlines);
  float center=exp(-dot(q,q)*.65);
  float secondary=signal(p+vec2(.02),t+.7)*.25;
  vec3 field=uBackground+uColor*rgb*center+uAccent*secondary*center;
  float vignette=1.0-smoothstep(.7,1.38,length(q));
  field=mix(uBackground,field,vignette);
  fragColor=vec4(clamp(field,0.0,1.0),1.0);
}`,
};
