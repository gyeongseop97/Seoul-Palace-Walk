import {hill,landings,stairHalfWidth,tracks} from "./space-walk-layout.js";
import {coastPoint,seaPoint} from "./region-coordinates.js";

// Taps and footsteps use the same stair centrelines and landings. In plan view,
// several flights cross one another at different heights.
const nodes=[],neighbours=[],segments=[];
function addNode(point){
  neighbours.push([]);
  return nodes.push(point)-1;
}
function connect(i,j){
  const a=nodes[i],b=nodes[j],length=Math.hypot(b.x-a.x,b.z-a.z,b.h-a.h);
  neighbours[i].push([j,length]);
  neighbours[j].push([i,length]);
}
function onLanding(p,l,margin=0){
  return Math.abs(p.x-l.x)<=l.halfX+margin&&Math.abs(p.z-l.z)<=l.halfZ+margin;
}
const landingIds=landings.map(addNode);
let entrance;
for(const points of tracks){
  const ids=points.map(addNode);
  entrance??=ids[0];
  for(let i=1;i<ids.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z;
    connect(ids[i-1],ids[i]);
    segments.push({a,dx,dz,dh:b.h-a.h,length2:dx*dx+dz*dz,start:ids[i-1],end:ids[i]});
  }
  for(const end of [ids[0],ids.at(-1)])for(const id of landingIds){
    if(onLanding(nodes[end],nodes[id],.04)&&Math.abs(nodes[end].h-nodes[id].h)<.12)connect(end,id);
  }
}
const waypoint=(p,node)=>({...coastPoint(p),coast:{track:p.h},trackNode:node});

export function pickSpaceWalk({origin:o,direction:d},limit=105){
  if(Math.hypot(o.x-hill.x,o.z-hill.z)>limit+50)return null;
  let hit=null,nearest=limit;
  function record(t,node,h){
    nearest=t;
    hit={distance:t,point:waypoint({x:o.x+t*d.x,z:o.z+t*d.z,h},node)};
  }
  for(const id of landingIds){
    const l=nodes[id],t=(l.h-o.y)/d.y;
    if(t>0&&t<nearest&&onLanding({x:o.x+t*d.x,z:o.z+t*d.z},l))record(t,id,l.h);
  }
  for(const {a,dx,dz,dh,length2,start,end} of segments){
    if(!length2)continue;
    const u0=((o.x-a.x)*dx+(o.z-a.z)*dz)/length2;
    const rate=(d.x*dx+d.z*dz)/length2;
    const t=(a.h+dh*u0-o.y)/(d.y-dh*rate);
    if(!(t>0&&t<nearest))continue;
    const u=u0+t*rate;
    if(u<0||u>1)continue;
    if(Math.hypot(o.x+t*d.x-a.x-u*dx,o.z+t*d.z-a.z-u*dz)<=stairHalfWidth)record(t,u<.5?start:end,a.h+dh*u);
  }
  return hit;
}

function currentNode(point){
  const h=point.coast?.track;
  if(!Number.isFinite(h))return null;
  const p=seaPoint(point);
  for(const id of landingIds){
    if(Math.abs(nodes[id].h-h)<.28&&onLanding(p,nodes[id],.02))return id;
  }
  let best=null,nearest=1.15;
  for(let i=landings.length;i<nodes.length;i++){
    const a=nodes[i],d=Math.hypot(a.x-p.x,a.z-p.z,a.h-h);
    if(d<nearest){best=i;nearest=d;}
  }
  return best;
}

function pathBetween(start,end){
  const costs=new Map([[start,0]]),open=new Set([start]),previous=new Map();
  while(open.size){
    let from;
    for(const id of open)if(from===undefined||costs.get(id)<costs.get(from))from=id;
    if(from===end){
      const path=[end];
      while(path.at(-1)!==start)path.push(previous.get(path.at(-1)));
      return path.reverse().map(id=>waypoint(nodes[id],id));
    }
    open.delete(from);
    for(const [to,length] of neighbours[from]){
      const cost=costs.get(from)+length;
      if(cost>=(costs.get(to)??Infinity))continue;
      previous.set(to,from);costs.set(to,cost);open.add(to);
    }
  }
  return [];
}

export function spaceWalkRoute(from,target){
  const start=currentNode(from),end=target.trackNode;
  if(start==null&&end==null)return null;
  const path=pathBetween(start??entrance,end??entrance);
  if(path.length)path.push(target);
  return path;
}
