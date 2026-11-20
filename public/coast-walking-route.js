import {geo,sideStreets,transitRoads,route,shore,promenade,dock,distance} from "./pohang-layout.js";
import {profileRows,beachAccess,sandEdge} from "./pohang-beach-profile.js";
import {parkRoad} from "./space-walk-layout.js";
import {stationWalkLine} from "./pohang-station-layout.js";
import {pavilionEntry,pavilionPoint,bridgeStart} from "./pohang-pavilion-layout.js";
import {cafePoint} from "./pohang-cafe-site.js";

// The road centres also cover the narrow corridors between the beach and the station.
// Add both sides of the seawall, its real openings, and the mouths of both piers.
function walkingLines(){
 const rows=[...new Set([...profileRows.filter(z=>z>=-937&&z<=300),-937,300,dock.z,pavilionEntry.z])].sort((a,b)=>a-b);
 return [route,parkRoad,stationWalkLine,...geo.coastRoads.map(line=>line.map(([x,z])=>({x,z}))),
  ...[...sideStreets,...transitRoads].map(({a,b})=>[a,b]),
  rows.map(z=>({x:promenade(z)+.9,z})),
  rows.map(z=>({x:(sandEdge(z)+shore(z))/2,z})),
  rows.map(z=>({x:shore(z)-1,z})),
  ...beachAccess.map(({z,run})=>[{x:promenade(z),z},{x:sandEdge(z)+run+.7,z}]),
  [{x:promenade(dock.z)-1,z:dock.z},dock],
  [pavilionPoint(0,bridgeStart-5),pavilionEntry,pavilionPoint(0,-7)],
  [-8,0,8].map(u=>pavilionPoint(u,-6)),
  [cafePoint(0,3),cafePoint(0,0),cafePoint(0,-2)]];
}

// Sample the full segment, including endpoints, against the same walls and ground as a footstep.
export function makeCoastPaths(walkable,canStep){
 const clear=(a,b,level)=>{
  const steps=Math.max(1,Math.ceil(distance(a,b)/.65));
  let previous=a;
  for(let i=1;i<=steps;i++){
   const t=i/steps,p=i===steps?b:{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   if(!walkable(p)||!canStep(previous,p,level))return false;
   previous=p;
  }
  return true;
 };
 const spacing=16,cells=new Map(),points=[],edges=new Map();
 const cellKey=(x,z)=>x+","+z;
 function indexRoads(){
  const unique=new Set();
  function add(p){
   const key=cellKey(Math.round(p.x*10),Math.round(p.z*10));
   if(unique.has(key))return;
   unique.add(key);
   const cell=cellKey(Math.floor(p.x/spacing),Math.floor(p.z/spacing));
   if(!cells.has(cell))cells.set(cell,[]);
   cells.get(cell).push(points.length);points.push(p);
  }
  for(const line of walkingLines()){
   add(line[0]);
   for(let j=1;j<line.length;j++){
    const a=line[j-1],b=line[j],n=Math.ceil(distance(a,b)/spacing);
    for(let i=1;i<=n;i++)add({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n});
   }
  }
 }
 function nearby(p,radius){
  const found=[];
  for(let x=Math.floor((p.x-radius)/spacing);x<=Math.floor((p.x+radius)/spacing);x++)
   for(let z=Math.floor((p.z-radius)/spacing);z<=Math.floor((p.z+radius)/spacing);z++)
    for(const id of cells.get(cellKey(x,z))??[])if(distance(p,points[id])<=radius)found.push(id);
  return found;
 }
 function edge(a,b){
  const key=Math.min(a,b)*points.length+Math.max(a,b);
  if(!edges.has(key))edges.set(key,clear(points[a],points[b])&&walkable(points[a]));
  return edges.get(key);
 }
 function connections(p,radius=70){
  const near=nearby(p,radius).sort((a,b)=>distance(points[a],p)-distance(points[b],p));
  const visible=[];
  for(const id of near)if(clear(p,points[id])){
   visible.push(id);
   if(visible.length>=12)break;
  }
  // Some open lawns in Hwanho Park are over 100 m from the nearest authored path.
  return !visible.length&&radius===70?connections(p,210):visible;
 }
 function path(from,to){
  if(!walkable(from)||!walkable(to))return [];
  if(clear(from,to))return [to];
  if(!points.length)indexRoads();
  const starts=connections(from),ends=new Set(connections(to));
  if(!starts.length||!ends.size)return [];
  const open=new Map(),cost=new Map(),parent=new Map();
  function enqueue(id,g,prev){
   if(g>=(cost.get(id)??Infinity))return;
   cost.set(id,g);parent.set(id,prev);
   open.set(id,g+1.1*distance(points[id],to));
  }
  for(const id of starts)enqueue(id,distance(from,points[id]),null);
  while(open.size){
   let current,minimum=Infinity;
   for(const [id,priority] of open)if(priority<minimum){current=id;minimum=priority;}
   if(ends.has(current)){
    const reverse=[to];
    for(let id=current;id!=null;id=parent.get(id))reverse.push(points[id]);
    return reverse.reverse();
   }
   open.delete(current);
   for(const id of nearby(points[current],spacing*1.12)){
    const next=cost.get(current)+distance(points[current],points[id]);
    if(next<(cost.get(id)??Infinity)&&edge(current,id))enqueue(id,next,current);
   }
  }
  return [];
 }
 return {path,clear};
}
