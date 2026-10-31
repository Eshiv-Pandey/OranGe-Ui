import { CREATIVE_SHADER_COMMON } from "./creative-webgl";

/** Original nested flow field: broad pigment ribbons, soft light and fine film grain. */
export const GRAIN_GRADIENT_FRAGMENT = CREATIVE_SHADER_COMMON + `
uniform vec3 uColors[12];uniform vec2 uPositions[12];
uniform float uColorCount,uSpeed,uBlur,uIntensity,uGrain,uAngle,uTurbulence,uWaveScale;
uniform float uPointerEffect,uInteractive,uGrainStyle,uVignette,uPosterize,uDither,uMode;
float flowNoise(vec2 p){return noise(p)*.65+noise(p*2.03+11.)*.25+noise(p*4.09-7.)*.1;}
void main(){
  vec2 p=vUv;float t=uTime*uSpeed;
  vec2 axis=vec2(cos(uAngle),sin(uAngle));
  vec2 q=vec2(flowNoise(p*uWaveScale+axis*t*.55),flowNoise(p*uWaveScale+4.7-axis*t*.4));
  vec2 flow=vec2(flowNoise(p*uWaveScale+q*2.7+vec2(t*.3,1.7)),flowNoise(p*uWaveScale+q*2.4+vec2(5.2,-t*.3)));
  p+=(flow-.5)*uTurbulence*.92+axis*sin(t*.35)*.08;
  vec2 difference=p-uPointer;float distance=max(.001,length(difference));
  float falloff=exp(-distance*4.5)*uInteractive;
  if(uPointerEffect<.5){float a=falloff*(.65+sin(t*.8)*.2);mat2 rotation=mat2(cos(a),-sin(a),sin(a),cos(a));p=uPointer+rotation*(p-uPointer);}
  else if(uPointerEffect<1.5)p+=difference/distance*falloff*.15;
  else if(uPointerEffect<2.5)p-=difference/distance*falloff*.15;
  else p+=difference/distance*sin(distance*24.-t*5.)*falloff*.045;
  vec3 color=vec3(0.);float total=0.;
  for(int i=0;i<12;i++){
    if(float(i)>=uColorCount)break;
    vec2 anchor=uPositions[i]+vec2(sin(t*.6+float(i)*1.9),cos(t*.45+float(i)*2.3))*.055;
    float d=length(p-anchor);
    if(uMode>.5&&uMode<1.5)d=abs(length(p-.5)*1.5-float(i)/max(1.,uColorCount-1.));
    else if(uMode>1.5){float a=fract(atan(p.y-.5,p.x-.5)/6.2831853+.5);d=abs(a-float(i)/uColorCount);d=min(d,1.-d);}
    float weight=exp(-d*d/(.008+uBlur*uBlur*.105));
    color+=uColors[i]*weight;total+=weight;
  }
  color/=max(.00001,total);
  vec3 base=mix(vec3(.97,.956,.936),vec3(.027,.026,.04),uTheme);
  color=mix(base,color,uIntensity);
  float grain=hash(gl_FragCoord.xy)-.5;
  if(uGrainStyle>.5&&uGrainStyle<1.5)grain=step(.77,hash(floor(gl_FragCoord.xy/2.)))-.23;
  else if(uGrainStyle>1.5)grain=noise(gl_FragCoord.xy*.75)-.5;
  color+=grain*uGrain*.32;
  color*=1.-uVignette*pow(length(vUv-.5)*1.414,1.7);
  if(uPosterize>1.)color=floor(color*(uPosterize-1.)+.5)/(uPosterize-1.);
  if(uDither>.5)color=floor(color*9.+bayer(gl_FragCoord.xy/2.)-.5)/9.;
  gl_FragColor=vec4(clamp(color,0.,1.),1.);
}`;
