import { clamp, type ShaderSettings } from "./types";

type Lobe = readonly [number, number, number, number, number];
// A receding central tower, overlapping shoulders, then the nearer lower banks.
const ROOTS: readonly Lobe[] = [
  [0, 1.20, .90, .40, 1.12], [-.16, .71, .75, .53, 1.08],
  [.17, .05, .52, .68, 1.08], [-.07, -.75, .40, .81, 1.02],
  [.56, .48, .33, .39, 1.03], [-.92, -.89, -.24, .65, 1.03],
  [1.03, -.92, -.51, .76, 1.04], [-.16, -1.64, -.83, 1.01, .78],
  [-2.0, -1.49, .10, .91, 1.02], [2.10, -1.44, .19, 1.02, 1.12],
  [1.74, -.11, .93, .62, 1.07], [-1.95, .05, 1.10, .63, 1.04],
];
const DIRECTIONS = [[-.56,.58,-.58], [.39,.84,-.37], [.68,.04,-.73], [-.68,-.25,-.61], [.08,-.66,-.74], [-.14,.20,-.97]];
let cachedSeed = -1, cachedLobes: number[] = [], cachedShapes: number[] = [];

/** Fixed root topology keeps seeds connected while each lobe remains uneven. */
export function cloudGeometry(settings: ShaderSettings) {
  const seed = clamp(settings.seed, 0, 1000, 7);
  if (seed !== cachedSeed) {
    const random = (i: number) => { const n = Math.sin(i * 127.1 + seed * 7.73) * 43758.5453; return n - Math.floor(n); };
    cachedLobes = []; cachedShapes = [];
    ROOTS.forEach(([x, y, z, radius, stretch], group) => {
      cachedLobes.push(x, y, z, radius); cachedShapes.push(stretch);
      DIRECTIONS.forEach((direction, child) => {
        const index = group * 53 + child * 7;
        const vector = direction.map((v, axis) => v + (random(index + axis) - .5) * .24);
        const length = Math.hypot(...vector), offset = radius * (.73 + random(index + 3) * .14);
        cachedLobes.push(x + vector[0] / length * offset, y + vector[1] / length * offset * stretch, z + vector[2] / length * offset, radius * (.37 + random(index + 4) * .13));
        cachedShapes.push(.91 + random(index + 5) * .24);
      });
    });
    cachedSeed = seed;
  }
  return { lobes: cachedLobes, shapes: cachedShapes };
}

export const CLOUD_FIELD_GLSL = `
uniform vec4 uCloudLobes[84];
uniform float uCloudShapes[84];
uniform float uSpeed, uScale, uCoverage, uDensity, uBillow, uSoftness;
uniform float uSunAngle, uLightIntensity, uSeed;
uniform vec3 uSkyColor, uCloudColor, uShadowColor;
float cloudHash(vec3 p) {
  p = fract(p*.1031); p += dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z);
}
float cloudNoise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(cloudHash(i),cloudHash(i+vec3(1,0,0)),f.x),
    mix(cloudHash(i+vec3(0,1,0)),cloudHash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(cloudHash(i+vec3(0,0,1)),cloudHash(i+vec3(1,0,1)),f.x),
    mix(cloudHash(i+vec3(0,1,1)),cloudHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float cloudUnion(float a,float b,float width) {
  float h=max(width-abs(a-b),0.0)/width; return min(a,b)-h*h*width*.25;
}
float cloudLobe(vec3 p,int index,float billow) {
  vec4 lobe=uCloudLobes[index]; float stretch=uCloudShapes[index];
  vec3 q=(p-lobe.xyz)/vec3(1,stretch,1); float radius=lobe.w*billow;
  float field=length(q)-radius;
  bool crown=index<21 || (index>=28 && index<35);
  // These smaller lobes sit on the OUTER rim, not on the front-facing texture.
  // Restrict work to the silhouette band and its two nearest nested cap groups.
  if(crown && abs(q.z)<radius*.72 && dot(q.xy,q.xy)>radius*radius*.61) {
    float count=10.0+mod(float(index),4.0), arc=6.2831853/count;
    float nearest=floor(atan(q.y,q.x)/arc);
    for(int neighbor=0;neighbor<2;neighbor++) {
      float sector=mod(nearest+float(neighbor),count);
      float variation=cloudHash(vec3(float(index)+.7,sector+.3,uSeed+17.0));
      float angle=(sector+(variation-.5)*.30)*arc;
      vec3 center=vec3(cos(angle),sin(angle),0)*radius*(.95+.055*variation);
      vec3 cap=q-center; cap.z*=.58;
      float capRadius=radius*(.15+.10*cloudHash(vec3(sector,float(index),uSeed+31.0)));
      field=cloudUnion(field,length(cap)-capRadius,radius*.014);
      // A smaller offset cap interrupts the broad rim without moving its parent.
      float smallAngle=angle+arc*(.22+.14*variation);
      vec3 smallCap=q-vec3(cos(smallAngle),sin(smallAngle),0)*radius*(1.035+.045*variation);
      smallCap.z*=.70;
      float smallRadius=radius*(.07+.025*cloudHash(vec3(float(index),sector,uSeed+53.0)));
      field=cloudUnion(field,length(smallCap)-smallRadius,radius*.01);
    }
  }
  // Put nested caps in front of the crown and shoulder as well as around them.
  // Their depth produces separate lit contours and short contact shadows;
  // adding only silhouette bumps leaves the parent face as one smooth mass.
  if(crown && q.z<radius*.10 && q.z>-radius*1.4 && dot(q.xy,q.xy)<radius*radius*1.3) {
    float count=5.0+mod(float(index),3.0), arc=6.2831853/count;
    float nearest=floor(atan(q.y,q.x)/arc);
    for(int neighbor=0;neighbor<2;neighbor++) {
      float sector=mod(nearest+float(neighbor),count);
      float variation=cloudHash(vec3(float(index),sector,uSeed+71.0));
      float angle=(sector+(variation-.5)*.36)*arc;
      float offset=radius*(.46+.16*variation);
      vec3 center=vec3(cos(angle)*offset,sin(angle)*offset,-radius*(.66+.10*variation));
      float capRadius=radius*(.32+.10*cloudHash(vec3(sector,float(index),uSeed+83.0)));
      field=cloudUnion(field,length(q-center)-capRadius,radius*.018);
    }
  }
  return field*min(stretch,1.0);
}
float cloudField(vec3 position,float time) {
  if(uCoverage<.001 || uDensity<.001) return 8.0;
  vec3 p=position;
  // The nearer banks and the distant tower drift at different rates.
  p.x+=sin(time*.13+p.z*.12)*(.18+.055*(2.0-p.z));
  p.y+=sin(time*.11+p.z*.5)*.025;
  float field=10.0, expansion=(uCoverage-.62)*.7;
  for(int group=0;group<12;group++) {
    int root=group*7; vec4 mainLobe=uCloudLobes[root];
    float bound=length(p-mainLobe.xyz)-mainLobe.w*1.65;
    if(bound>field+.24+abs(expansion)) continue;
    // A small interior core joins the outer lobes without painting its envelope.
    float mass=cloudLobe(p,root,.73);
    for(int child=1;child<7;child++)
      mass=cloudUnion(mass,cloudLobe(p,root+child,.88+uBillow*.2),.055);
    field=cloudUnion(field,mass,.095);
  }
  field-=expansion;
  if(field>.24) return field;
  // Medium convection follows the nested volumes. Fine erosion stays small.
  vec3 q=p+vec3(uSeed*.19,time*.007,uSeed*.37);
  // Convection must not erase the smaller caps around the distant crown.
  float crown=smoothstep(.05,.55,p.y);
  float convect=(cloudNoise(q*7.1)-.5)*mix(.14,.022,crown);
  float fold=(cloudNoise(q*19.7+vec3(0,time*.012,0))-.5)*mix(.032,.008,crown);
  float edge=(cloudNoise(q*47.9)-.5)*.009;
  return field+convect+fold+edge;
}
float cloudDensity(float field) {
  float edge=.003+uSoftness*.015;
  return (1.0-smoothstep(-edge,edge,field))*uDensity;
}
vec3 cloudNormal(vec3 p,float time) {
  float e=.006;
  return normalize(vec3(cloudField(p+vec3(e,0,0),time)-cloudField(p-vec3(e,0,0),time),
    cloudField(p+vec3(0,e,0),time)-cloudField(p-vec3(0,e,0),time),
    cloudField(p+vec3(0,0,e),time)-cloudField(p-vec3(0,0,e),time))+.00001);
}
float cloudSunlight(vec3 p,vec3 light,float time) {
  // A close sample resolves cap contacts before the wider bank-shadow samples.
  float optical=cloudDensity(cloudField(p+light*.045,time))*.32, distance=.035;
  // Sample beyond the immediate lobe to pick up shadows from adjoining billows.
  for(int i=0;i<4;i++) {
    float stride=.12*pow(2.0,float(i)); distance+=stride;
    optical+=cloudDensity(cloudField(p+light*distance,time))*stride*3.4;
  }
  return exp(-optical);
}
void main() {
  vec2 uv=sourceUv(), xy=(uv-.5)*vec2(uCssSize.x/uCssSize.y,1)*3.9/uScale;
  float time=uTime*uSpeed;
  vec3 sky=pow(uSkyColor,vec3(2.2))*mix(1.08,.80,clamp(uv.y,0.0,1.0));
  vec3 sunColor=pow(uCloudColor,vec3(2.2)), shadeColor=pow(uShadowColor,vec3(2.2));
  sky=mix(sky,sunColor,.032*pow(1.0-clamp(uv.y,0.0,1.0),2.0));
  vec3 light=normalize(vec3(-cos(uSunAngle)*.8,sin(uSunAngle)*.85+.25,-.40));
  vec3 color=vec3(0), origin=vec3(xy,-3.0), normal=vec3(0,0,-1);
  float transmittance=1.0, travel=cloudHash(vec3(gl_FragCoord.xy,7))*.009;
  bool foundSurface=false;
  for(int i=0;i<84;i++) {
    vec3 point=origin+vec3(0,0,travel); float field=cloudField(point,time);
    if(field>.065) { travel+=clamp(field*.7,.035,.32); }
    else {
      // Resolve thin crowns before taking larger steps through an opaque core.
      float density=cloudDensity(field), stride=(foundSurface?.012:.006)+smoothstep(.02,.13,-field)*.034;
      if(density>.004) {
        if(!foundSurface) { normal=cloudNormal(point,time); foundSurface=true; }
        float sunlight=cloudSunlight(point,light,time), diffuse=max(dot(normal,light),0.0);
        float rim=1.0-abs(normal.z); rim*=rim;
        float ambient=(.08+.12*(normal.y*.5+.5))*mix(.5,1.0,sunlight);
        // Block direct diffuse light inside blue recesses, preserving sunny caps.
        float lit=clamp(ambient+uLightIntensity*sunlight*(.53+diffuse*.24+rim*.07),0.0,.91);
        vec3 contactShade=shadeColor*mix(.62,1.0,sunlight);
        vec3 scatter=mix(contactShade,sunColor,lit);
        // Thin grazing caps need enough optical depth to retain a clear lit edge.
        float alpha=1.0-exp(-density*stride*(14.0+rim*42.0));
        color+=transmittance*alpha*scatter; transmittance*=1.0-alpha;
      }
      travel+=stride;
    }
    if(transmittance<.008 || travel>6.2) break;
  }
  fragColor=vec4(pow(clamp(color+sky*transmittance,0.0,1.0),vec3(1.0/2.2)),1);
}`;
