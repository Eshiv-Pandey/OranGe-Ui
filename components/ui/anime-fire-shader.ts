import { CREATIVE_SHADER_COMMON } from "./creative-webgl";

/** Original advected flame field, with four cel layers and detached rising embers. */
export const ANIME_FIRE_FRAGMENT = CREATIVE_SHADER_COMMON + `
uniform vec3 uColors[3];
uniform float uSpeed,uIntensity,uHeight,uInteractive,uDither,uPixelSize,uAppearance;
float flameNoise(vec2 p){
  return noise(p)*.57+noise(p*2.07+7.3)*.28+noise(p*4.13+2.1)*.15;
}
void main(){
  vec2 uv=(floor(gl_FragCoord.xy/max(1.,uPixelSize))+.5)*max(1.,uPixelSize)/uResolution;
  float t=uTime*uSpeed;
  float aspect=uResolution.x/uResolution.y;
  float pointerPull=exp(-pow((uv.x-uPointer.x)*4.,2.))*uPointer.y*uInteractive*.32;
  vec2 p=vec2(uv.x*max(1.,aspect)*4.5,uv.y*3.);
  p.x+=sin(p.y*2.8-t*2.1)*.25+sin(p.y*5.2-t*1.3)*.12;
  p+=vec2(flameNoise(p*.9+vec2(0.,-t)),flameNoise(p*.7+5.-t*.6))*.55;
  float flowing=flameNoise(p+vec2(t*.14,-t*2.4));
  float curl=sin(p.x*3.1+flowing*5.+t*.8)*.032;
  float reach=uHeight*(.68+uIntensity*.22)+pointerPull;
  float field=reach-uv.y+(flowing-.47)*(.48+reach*.3)+curl;
  field-=smoothstep(.8,1.,uv.y)*.2;
  vec3 background=mix(vec3(.988,.978,.958),vec3(.041,.037,.043),uTheme);
  vec3 color=background;
  float alive=smoothstep(0.,.18,uIntensity);
  float feather=max(.0015,1.5/uResolution.y);
  color=mix(color,uColors[0],smoothstep(-feather,feather,field)*alive);
  color=mix(color,uColors[1],smoothstep(.068-feather,.068+feather,field)*alive);
  color=mix(color,uColors[2],smoothstep(.16-feather,.16+feather,field)*alive);
  vec3 core=mix(uColors[2],vec3(1.,.965,.84),.8);
  color=mix(color,core,smoothstep(.28-feather,.28+feather,field)*alive);
  color+=vec3(1.,.47,.12)*exp(-abs(field)*28.)*.025;
  for(int i=0;i<12;i++){
    float fi=float(i),seed=hash(vec2(fi,3.4));
    float rise=fract(seed+t*(.07+seed*.035));
    float x=hash(vec2(fi,7.8))+sin(rise*9.+fi+t)*.018;
    float y=.12+rise*.77;
    vec2 d=(uv-vec2(x,y))*vec2(aspect,1.);
    float ember=(1.-smoothstep(.001,.0045,length(d)))*sin(rise*3.14159)*alive;
    color=mix(color,uColors[1],ember*.7);
  }
  color+=(hash(gl_FragCoord.xy)-.5)*.012;
  if(uAppearance>1.5&&uAppearance<2.5){
    float edge=1.-smoothstep(.003,.011,min(abs(field),min(abs(field-.068),abs(field-.16))));
    color=mix(color,vec3(.055,.035,.06),edge*alive);
  }
  if(uAppearance>3.5){
    vec2 cell=fract(gl_FragCoord.xy/vec2(5.,8.));
    float glyph=step(.18,cell.x)*step(cell.x,.82)*step(.18,cell.y)*step(cell.y,.8);
    float lit=step(0.,field)*(.45+step(.068,field)*.25+step(.16,field)*.3);
    vec3 terminalInk=mix(uColors[0],uColors[2],lit)*mix(.48,1.,uTheme);
    color=mix(background,terminalInk,lit*glyph*alive);
  }
  if(uDither>.5)color=floor(color*7.+(bayer(gl_FragCoord.xy/max(1.,uPixelSize))-.5)*.8)/7.;
  gl_FragColor=vec4(clamp(color,0.,1.),1.);
}`;
