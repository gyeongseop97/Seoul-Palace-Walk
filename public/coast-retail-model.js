import * as T from "three";
import {coastalRetail} from "./coast-retail-layout.js";

export function buildCoastalRetail(root,{box,oval,post,sign}){
 for(const shop of coastalRetail){
  const local=new T.Group();local.position.set(shop.x,1.85,shop.z);local.rotation.y=shop.yaw;root.add(local);
  const snow=shop.id==="snow-cafe",lounge=shop.id==="shore-lounge",w=shop.width;
  const wall=snow?0xe8e0d3:lounge?0x363742:0x45362d;
  const trim=snow?0xa37757:lounge?0xc19b67:0xb78a42;
  const pane=snow?0x87a8ad:lounge?0x536578:0x596e69;
  const face=shop.upstairs?3.45:0;
  box(local,0xbcb3a8,0,.008,shop.depth/2,w,.048,shop.depth+.16);
  // The recessed glass, mullions, cornice and canopy share the surveyed façade plane.
  box(local,wall,0,face+1.68,.09,w,3.36,.18);
  box(local,pane,0,face+1.6,.2,w-.45,2.42,.10);
  for(let u=-w/2+.18;u<w/2;u+=1.48)box(local,trim,u,face+1.57,.27,.08,2.59,.11);
  box(local,trim,0,face+.36,.29,w,.14,.34);
  box(local,wall,0,face+2.71,.31,w,.16,.36);
  if(snow){
   for(let i=0;i<13;i++){
    const u=(i-6)*w/13,cloth=i%2===0?0xe1bd99:0xe9e5d7;
    const stripe=box(local,cloth,u,face+3.14,.56,w/13,.095,.94);
    stripe.rotation.x=.14;
    box(local,cloth,u,face+2.99,1.02,w/13,.18,.075);
   }
  }else{
   box(local,lounge?0x272d38:0x283e35,0,face+3.01,.54,w+.1,.16,.84);
   for(const u of [-w*.38,0,w*.38])oval(local,0xffdda2,u,face+2.86,.76,.10,.06,.10);
  }
  const brand=snow?"#80573e":lounge?"#363547":"#344739";
  const signZ=snow?1.10:.99;
  box(local,trim,0,face+3.48,signZ-.05,w*.67+.13,.82,.09);
  sign(local,shop.name,0,face+3.48,signZ+.012,w*.67,.72,brand);
  if(shop.upstairs)box(local,wall,shop.doorX,1.48,.075,3.05,2.96,.15);
  box(local,trim,shop.doorX,1.25,.20,1.77,2.50,.18);
  box(local,0x45565a,shop.doorX,1.22,.32,1.52,2.31,.11);
  box(local,pane,shop.doorX,1.35,.39,1.27,1.78,.045);
  box(local,trim,shop.doorX+.49,1.12,.43,.06,.51,.09);
  if(shop.upstairs)sign(local,"2F  "+shop.name,shop.doorX,2.72,.30,2.83,.43,brand);
  if(!shop.upstairs){
   // Street-level grill counter, brass beer taps and stout steins behind the hatch.
   box(local,0x815b43,1.33,1.10,.51,3.55,.16,.82);
   for(let i=0;i<3;i++){
    const u=.34+i*.66;
    post(local,0xb69868,u,1.39,.54,.035,.47,.035);
    box(local,0xac9663,u,1.58,.61,.08,.08,.19);
    post(local,0xcda559,u+.25,1.27,.71,.078,.17,.078);
   }
  }
 }
}
