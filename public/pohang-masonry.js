import * as T from "three";
import {graniteMaterial} from "./granite-material.js";

let masonry;
export function coastalMasonry(){
 if(masonry)return masonry;
 masonry=graniteMaterial(T).clone();
 masonry.onBeforeCompile=shader=>{
  // Each cut block takes a different section of the same photograph. The supplied UVs are metres along the wall and up.
  shader.fragmentShader=shader.fragmentShader.replace("#include <map_fragment>",`
   #ifdef USE_MAP
    vec2 course=vMapUv*vec2(.95,3.15), dx=dFdx(course), dy=dFdy(course);
    course.x+=.5*mod(floor(course.y),2.);
    vec2 block=floor(course), face=fract(course);
    vec2 seed=fract(vec2(dot(block,vec2(.75488,.56984)),dot(block,vec2(.43845,.75488))));
    vec2 crop=vec2(.72,.48), flip=step(vec2(.5),seed), direction=1.-2.*flip;
    vec2 sampleUv=fract(seed*7.21)*(1.-crop)+(flip+direction*face)*crop;
    vec4 sampleColor=textureGrad(map,sampleUv,dx*crop*direction,dy*crop*direction);
    vec2 footprint=max(abs(dx)+abs(dy),vec2(.0002));
    vec2 edge=min(face,1.-face),joint=vec2(.011,.024);
    vec2 inside=smoothstep(joint-footprint*.5,joint+footprint*.5,edge);
    float fade=1.-smoothstep(.10,.40,max(footprint.x,footprint.y));
    sampleColor.rgb*=(.975+.05*seed.x)*(1.-.22*fade*(1.-inside.x*inside.y));
    diffuseColor*=sampleColor;
   #endif`);
 };
 return masonry;
}
