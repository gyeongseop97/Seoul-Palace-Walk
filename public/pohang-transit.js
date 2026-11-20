import {roads,lines} from "./pohang-transit-geography.js";
import {expressBusCount,cityBusCount,busCount} from "./coast-fleet.js";
export {busCount};

const dist=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)});
const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const transitRoads=roads.map(([x,z,u,v,width,oneWay])=>({a:{x,z},b:{x:u,z:v},width,oneWay:!!oneWay}));
export const busDwell=10;
const stopRows=[
 [["station","포항역","영일대 방면"],["beach","영일대해수욕장","포항역 방면"]],
 [["north-market","북부시장","영일대·환호공원 방면"],["port","포항여객선터미널","환호공원 방면"],["beach-park","영일대해수욕장","환호공원 방면"],["duho-park","두호동행정복지센터","환호공원 방면"],["park","환호공원","영일대·북부시장 방면"],["duho-city","두호동행정복지센터","북부시장 방면"],["beach-city","영일대해수욕장","북부시장 방면"],["port-city","포항여객선터미널","북부시장 방면"]]
];
export const busLines=[
 {id:"express",number:"급행",name:"포항역 급행",color:"#ae3538",count:expressBusCount,maxSpeed:24,acceleration:2.05,braking:2.6},
 {id:"city",number:"해안",name:"해안 시내버스",color:"#2c65aa",count:cityBusCount,maxSpeed:12.5,acceleration:1.55,braking:2.05}
];
function carriageway(ref){
 const {a,b,width,oneWay}=transitRoads[Math.abs(ref)-1];
 return {a:ref>0?a:b,b:ref>0?b:a,width,oneWay};
}
function laneOffset(edge){
 return edge.oneWay?Math.max(0,edge.width*.5-1.65):Math.min(3.48,Math.max(1.43,edge.width*.5-1.65));
}
// Intersect the offset lanes first, then fillet their corners. Offsetting an already tight
// inner curve would make the steering briefly reverse at the triangular market junction.
function makeLeg(refs,line){
 const edges=refs.map(carriageway),points=[];
 const verts=edges.map((e,i)=>{
  const yaw=angle(e.a,e.b),off=laneOffset(e),x=e.a.x-Math.cos(yaw)*off,z=e.a.z+Math.sin(yaw)*off;
  if(!i)return {x,z};
  const prev=edges[i-1],prevYaw=angle(prev.a,prev.b),prevOff=laneOffset(prev);
  const px=prev.b.x-Math.cos(prevYaw)*prevOff,pz=prev.b.z+Math.sin(prevYaw)*prevOff;
  const tx=Math.sin(yaw),tz=Math.cos(yaw),ux=Math.sin(prevYaw),uz=Math.cos(prevYaw);
  const determinant=ux*tz-uz*tx;
  if(Math.abs(determinant)<.10)return {x:(px+x)*.5,z:(pz+z)*.5};
  const along=((x-px)*tz-(z-pz)*tx)/determinant;
  const limit=Math.min(5.8,dist(prev.a,prev.b)*.29,dist(e.a,e.b)*.29);
  const shift=Math.max(-limit,Math.min(limit,along));
  return {x:px+ux*shift,z:pz+uz*shift};
 });
 const tail=edges.at(-1),tailYaw=angle(tail.a,tail.b),tailOff=laneOffset(tail);
 verts.push({x:tail.b.x-Math.cos(tailYaw)*tailOff,z:tail.b.z+Math.sin(tailYaw)*tailOff});
 function add(p,limit){
  const prev=points.at(-1);
  if(prev&&dist(prev,p)<.01)return;
  points.push({...p,speed:limit});
 }
 const limit=e=>Math.min(line.maxSpeed,e.width<5?9:e.width<6.5?13:line.maxSpeed);
 function straight(a,b,cap){
  const n=Math.max(1,Math.ceil(dist(a,b)/3));
  for(let j=1;j<=n;j++)add(mix(a,b,j/n),cap);
 }
 let start=verts[0];add(start,limit(edges[0]));
 for(let i=0;i<edges.length;i++){
  const e=edges[i],n=edges[i+1];
  if(!n){straight(start,verts[i+1],limit(e));break;}
  const v=verts[i+1],before=verts[i],after=verts[i+2];
  const h=Math.abs(turn(angle(before,v),angle(v,after)));
  const trim=Math.min(h>1.8?13.5:9.5,dist(before,v)*.44,dist(v,after)*.44);
  const a=mix(v,before,trim/(dist(before,v)||1)),b=mix(v,after,trim/(dist(v,after)||1));
  straight(start,a,limit(e));
  const steps=Math.max(4,Math.ceil(trim/1.2),Math.ceil(h/.13));
  for(let j=1;j<=steps;j++){
   const t=j/steps;
   add(mix(mix(a,v,t),mix(v,b,t),t),lerp(limit(e),limit(n),t));
  }
  start=b;
 }
 const lane=points;
 // Finite forward/backward braking passes keep approach speed continuous, including tight bends.
 lane.forEach((p,i)=>{
  const prev=lane[Math.max(0,i-1)],next=lane[Math.min(lane.length-1,i+1)];
  p.yaw=angle(prev,next);p.ds=i?dist(prev,p):0;
  if(i>0&&i<lane.length-1){
   const curvature=Math.abs(turn(angle(prev,p),angle(p,next)))/Math.max(.05,(p.ds+dist(p,next))*.5);
   if(curvature>.0001)p.speed=Math.min(p.speed,Math.max(2,Math.sqrt(2.5/curvature)));
  }
 });
 lane[0].speed=0;lane.at(-1).speed=0;
 // Distances are full scale. Compress long, clear stretches for play, while keeping
 // low-speed manoeuvres and the first and last metres at each platform at street speed.
 const lengthMetres=lane.reduce((sum,p)=>sum+p.ds,0);
 let travel=0;
 for(const p of lane){
  travel+=p.ds;
  const t=Math.min(1,travel/210,(lengthMetres-travel)/210);
  const ramp=t*t*(3-2*t);
  p.pace=1+ramp*(line.id==="express"?2.7:.68);
  p.speed*=p.pace;
 }
 for(let i=1;i<lane.length;i++)lane[i].speed=Math.min(lane[i].speed,Math.sqrt(lane[i-1].speed**2+2*line.acceleration*lane[i].pace**2*lane[i].ds));
 for(let i=lane.length-2;i>=0;i--)lane[i].speed=Math.min(lane[i].speed,Math.sqrt(lane[i+1].speed**2+2*line.braking*lane[i].pace**2*lane[i+1].ds));
 let seconds=0,length=0;
 lane.forEach((p,i)=>{
  if(i){seconds+=2*p.ds/(p.speed+lane[i-1].speed);length+=p.ds;}
  p.seconds=seconds;
 });
 return {lane,seconds,length,edge:edges[0]};
}
export const harborStops=[];
const stopsById=new Map();
for(const [i,line] of busLines.entries()){
 line.stops=stopRows[i].map(r=>r[0]);line.legs=lines[i].map(refs=>makeLeg(refs,line));line.period=0;
 line.legs.forEach((leg,j)=>{
  const from=line.legs[(j+line.legs.length-1)%line.legs.length].lane.at(-1),to=leg.lane[0];
  from.x=to.x=(from.x+to.x)*.5;from.z=to.z=(from.z+to.z)*.5;
  from.yaw=to.yaw=from.yaw+turn(from.yaw,to.yaw)*.5;
 });
 line.legs.forEach((leg,j)=>{
  const [id,name,direction]=stopRows[i][j],p=leg.lane[0],{a,b,width}=leg.edge;
  const yaw=angle(a,b),tx=Math.sin(yaw),tz=Math.cos(yaw),nx=-tz,nz=tx;
  const at=(along,across)=>({x:a.x+tx*along+nx*across,z:a.z+tz*along+nz*across});
  const heading=(Math.atan2(-nx,nz)*180/Math.PI+360)%360;
  const stop={id,name,direction,line:line.id,heading,roadWidth:width,oneWay:leg.edge.oneWay,laneOffset:laneOffset(leg.edge),
   berth:{x:p.x,z:p.z,yaw:p.yaw},...at(3.35,width/2+1.02),shelter:{...at(.2,width/2+2.65),heading}};
  harborStops.push(stop);stopsById.set(id,stop);
  leg.start=line.period;line.period+=busDwell+leg.seconds;
 });
}
export const stopById=id=>stopsById.get(id);
export const busLine=index=>index<expressBusCount?busLines[0]:busLines[1];
export const routeLength=busLines[0].legs[0].length,busTravel=busLines[0].legs[0].seconds,busPeriod=busLines[0].period;
function phaseAt(line,index,seconds){
 const local=index-(line.id==="city"?expressBusCount:0);
 return ((seconds+local*line.period/line.count)%line.period+line.period)%line.period;
}
function poseAt(lane,t){
 let lo=1,hi=lane.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(lane[mid].seconds<t)lo=mid+1;else hi=mid;}
 const a=lane[lo-1],b=lane[lo],span=b.seconds-a.seconds,u=Math.max(0,Math.min(1,(t-a.seconds)/span));
 const speed=lerp(a.speed,b.speed,u),d=b.ds?(a.speed+speed)*.5*u*span/b.ds:0;
 return {...mix(a,b,d),yaw:a.yaw+turn(a.yaw,b.yaw)*d,speed};
}
export function busAt(index,seconds){
 const line=busLine(index),phase=phaseAt(line,index,seconds);
 let j=line.legs.findIndex((l,i)=>i+1===line.legs.length||phase<line.legs[i+1].start);
 const leg=line.legs[j],id=line.stops[j],next=line.stops[(j+1)%line.stops.length],elapsed=phase-leg.start;
 if(elapsed<busDwell)return {...stopById(id).berth,stop:id,next,left:Math.ceil(busDwell-elapsed),elapsed,speed:0,dwell:busDwell,line:line.id};
 const t=elapsed-busDwell;
 return {...poseAt(leg.lane,t),stop:null,next,left:Math.ceil(leg.seconds-t),elapsed:t,dwell:busDwell,line:line.id};
}
export function arrivalsAt(id,seconds){
 const stop=stopById(id);if(!stop)return [];
 const line=busLines.find(l=>l.id===stop.line),start=line.legs[line.stops.indexOf(id)].start;
 return Array.from({length:line.count},(_,i)=>{
  const index=i+(line.id==="express"?0:expressBusCount),phase=phaseAt(line,index,seconds);
  const delta=phase-start;return {index,seconds:delta>=0&&delta<busDwell?0:Math.ceil((start-phase+line.period)%line.period)};
 }).sort((a,b)=>a.seconds-b.seconds||a.index-b.index);
}
const cells=new Map();
for(const e of transitRoads){
 const pad=e.width*.5+4.5;
 for(let x=Math.floor((Math.min(e.a.x,e.b.x)-pad)/64);x<=Math.floor((Math.max(e.a.x,e.b.x)+pad)/64);x++)
  for(let z=Math.floor((Math.min(e.a.z,e.b.z)-pad)/64);z<=Math.floor((Math.max(e.a.z,e.b.z)+pad)/64);z++){
   const key=x+","+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(e);
  }
}
export function transitWalkable(p){
 return cells.get(Math.floor(p.x/64)+","+Math.floor(p.z/64))?.some(({a,b,width})=>{
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t)<width/2+4.35;
 })??false;
}
