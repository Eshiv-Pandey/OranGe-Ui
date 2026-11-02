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
uniform int uCloudLobeCount;
uniform float uSpeed, uScale, uCoverage, uDensity, uBillow, uSoftness;
uniform float uSunAngle, uLightIntensity, uSeed;
uniform vec3 uSkyColor, uCloudColor, uShadowColor;

float cloudHash(vec2 p) {
  p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32);
  return fract(p.x*p.y);
}
vec3 cloudNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f), du=6.0*f*(1.0-f);
  float a=cloudHash(i), b=cloudHash(i+vec2(1,0));
  float c=cloudHash(i+vec2(0,1)), d=cloudHash(i+1.0), crossTerm=a-b-c+d;
  return vec3(a+(b-a)*u.x+(c-a)*u.y+crossTerm*u.x*u.y,
    du*vec2(b-a+crossTerm*u.y,c-a+crossTerm*u.x));
}
void main() {
  vec2 uv=sourceUv(), xy=(uv-.5)*vec2(uCssSize.x/uCssSize.y,1)*3.9/uScale;
  float time=uTime*uSpeed;
  vec3 sky=pow(uSkyColor,vec3(2.2))*mix(1.08,.80,clamp(uv.y,0.0,1.0));
  vec3 sunColor=pow(uCloudColor,vec3(2.2)), shadeColor=pow(uShadowColor,vec3(2.2));
  sky=mix(sky,sunColor,.032*pow(1.0-clamp(uv.y,0.0,1.0),2.0));
  if(uCoverage<.001 || uDensity<.001) {
    fragColor=vec4(pow(clamp(sky,0.0,1.0),vec3(1.0/2.2)),1); return;
  }

  // Intersect the visible caps analytically, once per lobe. The old density
  // marcher evaluated this entire field again at every view and shadow step.
  // A uniform loop bound also avoids large driver-unrolled shader programs.
  vec2 texturePoint=xy+vec2(uSeed*.19,uSeed*.37+time*.008);
  vec3 broad=cloudNoise(texturePoint*10.7), fine=cloudNoise(texturePoint*29.1);
  float fineWeight=1.0-smoothstep(.16,.42,29.1*3.9/(uScale*uResolution.y));
  float detail=(broad.x-.5)*.018+(fine.x-.5)*.005*fineWeight;
  vec2 detailSlope=broad.yz*(10.7*.018)+fine.yz*(29.1*.005*fineWeight);
  vec2 warp=vec2(cloudNoise(texturePoint*5.3).x,cloudNoise(texturePoint*5.3+19.0).x)-.5;
  vec2 point=xy+warp*.045;
  float surface=10.0, edgeDistance=10.0, thickness=0.0;
  vec2 slope=vec2(0);
  float expansion=(uCoverage-.62)*.7;
  for(int index=0;index<uCloudLobeCount;index++) {
    vec4 lobe=uCloudLobes[index];
    float stretch=uCloudShapes[index];
    bool root=index%7==0;
    float radius=max(.025,lobe.w*(root?.88:(.85+uBillow*.28))+expansion);
    vec2 drift=vec2(sin(time*.13+lobe.z*.12)*(.18+.055*(2.0-lobe.z)),
      sin(time*.11+lobe.z*.5)*.025);
    vec2 q=(point+drift-lobe.xy)/vec2(1,stretch);
    // Most projected caps do not cover this pixel. Reject before sqrt.
    if(any(greaterThan(abs(q),vec2(radius+.06)))) continue;
    float distance=length(q), edge=distance-radius+detail;
    edgeDistance=min(edgeDistance,edge);
    if(edge>.04) continue;
    float depth=sqrt(max(0.0,radius*radius-distance*distance));
    float front=lobe.z-depth, blend=clamp(.5+.5*(surface-front)/.09,0.0,1.0);
    slope=mix(slope,q/(max(depth,.035)*vec2(1,stretch)),blend);
    surface=mix(surface,front,blend)-.09*blend*(1.0-blend);
    thickness=max(thickness,depth*2.0);
  }

  // Analytic slopes stay smooth at every render scale. Screen derivatives
  // would quantize normals into 2-by-2 pixel blocks on low-resolution canvases.
  vec3 normal=normalize(vec3(slope+detailSlope*1.7,-1.0));
  vec3 light=normalize(vec3(-cos(uSunAngle)*.8,sin(uSunAngle)*.85+.25,-.55));
  float diffuse=max(dot(normal,light),0.0);
  float ambient=.19+.12*(normal.y*.5+.5);
  float lit=clamp(ambient+uLightIntensity*(.23+diffuse*.58),0.0,.97);
  vec3 cloud=mix(shadeColor*.83,sunColor,lit);
  float feather=.006+uSoftness*.085;
  float alpha=(1.0-smoothstep(-feather,feather,edgeDistance));
  alpha*=1.0-exp(-uDensity*(3.0+thickness*5.0));
  fragColor=vec4(pow(clamp(mix(sky,cloud,alpha),0.0,1.0),vec3(1.0/2.2)),1);
}`;
