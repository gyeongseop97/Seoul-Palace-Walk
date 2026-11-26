import {groundHeightAt} from "./bulguksa-ground.js";
import {templeHallTerraces} from "./bulguksa-hall-layout.js";

// Centre lines of the mapped gallery roofs, in courtyard axes.
const rows=[
 [244539236,[[-29.1,-21.6],[-63.5,-21.7],[-63.4,17.7],[-51.8,17.2]]],
 [244539237,[[14.9,-45.3],[23.1,-46.1],[23.8,16.7],[7.5,16.5]]],
 [244539238,[[-18.1,-47.2],[-24.2,-47.1],[-23.8,16.6],[-7.2,16.2]]],
 [949325903,[[-40.95,16.9],[-27.5,16.7]]]
];
const screens=[];
export const templeCorridors=new Map();
for(const [id,points] of rows){
 const spans=[];templeCorridors.set(id,spans);
 for(let i=1;i<points.length;i++){
  const [u0,v0]=points[i-1],[u1,v1]=points[i],du=u1-u0,dv=v1-v0,length=Math.hypot(du,dv);
  const n=Math.max(1,Math.ceil(Math.abs(groundHeightAt(u0,v0)-groundHeightAt(u1,v1))/.65));
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,u=u0+t*du,v=v0+t*dv,w=length/n,columns=Math.ceil(w/3.1);
   const c=du/length,s=-dv/length,outside=Math.sign(c)||1,front=v>11&&Math.abs(du)>Math.abs(dv);
   spans.push({u,v,w,height:groundHeightAt(u,v),yaw:.15+Math.atan2(-dv,du),columns,front,outside});
   if(front)for(let col=0;col<columns;col+=2){
    const across=((col+.5)/columns-.5)*w,along=outside*1.72;
    screens.push({u:u+c*across+s*along,v:v-s*across+c*along,c,s,half:(w/columns-.18)/2});
   }
  }
 }
}
const gatehouses=templeHallTerraces.filter(hall=>!hall.plinth);
export function templeScreenAt({u,v}){
 if(v<10||v>23||u< -66||u>26)return false;
 for(const screen of screens){
  const x=u-screen.u,z=v-screen.v;
  if(Math.abs(x*screen.s+z*screen.c)<.16&&Math.abs(x*screen.c-z*screen.s)<screen.half+.08)return true;
 }
 for(const hall of gatehouses){
  const x=Math.abs(u-hall.u),z=Math.abs(v-hall.v);
  if(Math.abs(x-hall.bodyW/2)<.18&&z<hall.bodyD/2+.1)return true;
  const middle=hall.bodyW*hall.frontBays[1]/hall.frontBays.reduce((a,b)=>a+b)/2;
  if(hall.gable&&Math.abs(z-hall.bodyD/2)<.17&&x>middle-.05&&x<hall.bodyW/2)return true;
 }
 return false;
}
