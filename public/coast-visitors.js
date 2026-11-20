import {streetLine} from "./visitor-walks.js";
import {coastPoint} from "./region-coordinates.js";
import {parkRoad} from "./space-walk-layout.js";
import {arrival,stationShop,stationDoor,beachShop,promenade,beachStop} from "./pohang-layout.js";

const stops=[],routes=[];
const pathPoint=z=>({x:promenade(z)+1.2,z});
function circuit(points){
 const indices=points.map(point=>stops.push({...coastPoint(point),ref:point.ref})-1);
 const legs=[];let end=0;
 for(let i=0;i<points.length;i++){
  const j=(i+1)%points.length,a=stops[indices[i]],b=stops[indices[j]];
  const wait=a.ref!=null?21:i%2?13:9;
  legs.push({node:indices[i],start:end,until:end+wait,action:a.ref!=null?"shop":i%2?"photo":"cat"});end+=wait;
  const line=streetLine([a,b]),span=line.length/1.07;
  legs.push({node:indices[i],start:end,until:end+span,action:"walk",edge:{line}});end+=span;
 }
 routes.push({legs,end});
}
circuit([{x:arrival.x+1.5,z:arrival.z+2.8},{...stationShop,z:stationShop.z+.8,ref:0},{x:stationShop.x+1.8,z:stationShop.z+4},stationDoor,{x:stationShop.x+2,z:stationShop.z+5}]);
circuit([pathPoint(beachStop.z+31),pathPoint(beachStop.z+4),{...beachShop,z:beachShop.z+.9,ref:1},pathPoint(beachStop.z+3),pathPoint(beachStop.z-19)]);
for(const z of [-240,-455,-680])circuit([pathPoint(z),pathPoint(z+12),pathPoint(z+29),pathPoint(z+16)]);
circuit([...parkRoad.slice(-3),...parkRoad.slice(-2,-1)]);
export const coastVisitors={stops,createWalks(room){
 const seed=[...(room??"")].reduce((s,c)=>(Math.imul(s,31)+c.charCodeAt(0))>>>0,17);
 const parties=routes.map((route,id)=>({id,pair:id%3!==1,variant:(seed+id*113)%1989,offset:(seed%137)+id*21,route}));
 return {at(clock){
  const t=clock/1000;
  for(const p of parties){
   const phase=(t+p.offset)%p.route.end,l=p.route.legs.find(l=>phase<l.until)??p.route.legs.at(-1);
   p.node=l.node;p.start=t-(phase-l.start);p.until=p.start+(l.until-l.start);p.action=l.action;p.edge=l.edge;
  }
  return {t,parties};
 }};
}};
