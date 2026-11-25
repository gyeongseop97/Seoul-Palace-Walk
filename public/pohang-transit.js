import {roads,lines} from "./pohang-transit-geography.js";
import {expressCoaches,cityCoaches,busCount} from "./coast-fleet.js";
export {busCount};

import {angle,turn,laneOffset,makeBusLeg,busLanePose} from "./city-bus-lane.js";
export const transitRoads=roads.map(([x,z,u,v,width,oneWay])=>({a:{x,z},b:{x:u,z:v},width,oneWay:!!oneWay}));
export const busDwell=10;
const stopRows=[
 [["station","포항역","영일대 방면"],["beach","영일대해수욕장","포항역 방면"]],
 [["north-market","북부시장","영일대·환호공원 방면"],["port","포항여객선터미널","환호공원 방면"],["beach-park","영일대해수욕장","환호공원 방면"],["duho-park","두호동행정복지센터","환호공원 방면"],["park","환호공원","영일대·북부시장 방면"],["duho-city","두호동행정복지센터","북부시장 방면"],["beach-city","영일대해수욕장","북부시장 방면"],["port-city","포항여객선터미널","북부시장 방면"]]
];
export const busLines=[
 {id:"express",number:"급행",name:"포항역 급행",color:"#ae3538",coaches:expressCoaches,maxSpeed:24,acceleration:2.05,braking:2.6},
 {id:"city",number:"해안",name:"해안 시내버스",color:"#2c65aa",coaches:cityCoaches,maxSpeed:12.5,acceleration:1.55,braking:2.05}
];
function carriageway(ref){
 const {a,b,width,oneWay}=transitRoads[Math.abs(ref)-1];
 return {a:ref>0?a:b,b:ref>0?b:a,width,oneWay};
}
export const harborStops=[];
const stopsById=new Map();
for(const [i,line] of busLines.entries()){
 line.count=line.coaches.length;
 line.stops=stopRows[i].map(r=>r[0]);line.legs=lines[i].map(refs=>makeBusLeg(refs.map(carriageway),line));line.period=0;
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
const assignments=[];
for(const line of busLines)line.coaches.forEach((index,slot)=>{assignments[index]={line,slot};});
export const busLine=index=>assignments[index].line;
export const routeLength=busLines[0].legs[0].length,busTravel=busLines[0].legs[0].seconds,busPeriod=busLines[0].period;
function phaseAt(line,index,seconds){
 const offset=assignments[index].slot*line.period/line.coaches.length;
 return ((seconds+offset)%line.period+line.period)%line.period;
}
export function busAt(index,seconds){
 const line=busLine(index),phase=phaseAt(line,index,seconds);
 let j=line.legs.findIndex((l,i)=>i+1===line.legs.length||phase<line.legs[i+1].start);
 const leg=line.legs[j],id=line.stops[j],next=line.stops[(j+1)%line.stops.length],elapsed=phase-leg.start;
 if(elapsed<busDwell)return {...stopById(id).berth,stop:id,next,left:Math.ceil(busDwell-elapsed),elapsed,speed:0,dwell:busDwell,line:line.id};
 const t=elapsed-busDwell;
 return {...busLanePose(leg.lane,t),stop:null,next,left:Math.ceil(leg.seconds-t),elapsed:t,dwell:busDwell,line:line.id};
}
export function arrivalsAt(id,seconds){
 const stop=stopById(id);if(!stop)return [];
 const line=busLines.find(l=>l.id===stop.line),start=line.legs[line.stops.indexOf(id)].start;
 return line.coaches.map(index=>{
  const phase=phaseAt(line,index,seconds);
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
