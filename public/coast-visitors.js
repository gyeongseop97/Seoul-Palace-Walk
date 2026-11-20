import {streetLine} from "./visitor-walks.js";
import {coastPoint} from "./region-coordinates.js";
import {parkRoad} from "./space-walk-layout.js";
import {stationShop,promenade} from "./pohang-layout.js";
import {stationPoint} from "./pohang-station-layout.js";
import {cafePoint} from "./coast-cafe.js";

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
circuit([stationPoint(-42,18),stationPoint(-24,23),{...stationShop,ref:0},stationPoint(-10,23),stationPoint(4,17),stationPoint(-24,15)]);
// Guests approach the cafe along its own frontage, including after the venue moves.
circuit([cafePoint(-3.6,2),cafePoint(-1.5,1.7),{...cafePoint(0,1.4),ref:1},cafePoint(1.6,1.7),cafePoint(4,2.1)]);
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
