import {mappedRoads,mappedBuildings,mappedWalls,mappedMounds,mappedParks} from "./gyeongju-geography.js";
import {cafeFittings} from "./gyeongju-cafe.js";

// Local survey frame in metres, east and south of 129.212 E, 35.836 N.
const point=([x,z])=>({x,z});
const place=(x,z,name,heading=0)=>({x,z,name,heading});
const dist=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
function project(p,a,b){
 const x=b.x-a.x,z=b.z-a.z;
 return mix(a,b,Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1))));
}
function distanceTo(p,a,b){return dist(p,project(p,a,b));}
export const cafeLayout={x:-228.6,z:-304.2,yaw:-2.70,width:9,depth:9.4};
const cafe=cafeFittings(cafeLayout);
export const places={
 station:place(-6591.3,4187,"경주역 KTX 역사"),
 stationExit:place(-6522,4181,"경주역 광장 출입구",53),
 stationBus:place(-6491.3,4158.8,"경주역(KTX) 정류장",304),
 townBus:place(-59.9,-423,"천마총후문·황리단길 하차",253),
 townReturnBus:place(111.7,-499.7,"천마총후문·황리단길 경주역 방면",77),
 hwangnidan:place(-193.2,-361.1,"황리단길 포석로",181),
 cafe:{...cafe.point(0,cafeLayout.depth/2+.95),name:"황남 한옥카페",heading:25},
 cafeCounter:{...cafe.order,name:"황남 한옥카페 카운터"},
 northGate:place(-102.3,-396.4,"대릉원 후문",166),
 mainGate:place(288.4,53.9,"대릉원 정문",140),
 magnolia:place(62.1,-268,"대릉원 목련"),
 photo:place(62.3,-264.3,"대릉원 목련 포토존",356),
 cheomseongdae:place(630.3,144,"첨성대"),
 stars:place(609.1,169.4,"첨성대 별자리 산책길",40),
};
export const buildings=mappedBuildings.map(([kind,name,ring])=>({kind,name,points:ring.map(point)}));
export const walls=mappedWalls.map(([kind,line])=>({kind,points:line.map(point)}));
export const parks=mappedParks.map(([kind,name,ring])=>({kind,name,points:ring.map(point)}));
export const mounds=mappedMounds.map(([name,x,z,rx,rz,height,yaw])=>({name,x,z,rx,rz,height,yaw}));
export const roads=mappedRoads.map(([kind,width,name,line])=>({kind,width,name,points:line.map(point)}));
function road(kind,width,name,points){roads.push({kind,width,name,points});}
const fromPairs=pairs=>pairs.map(point);
// Follow both curbs on the larger roads. Their offset polylines retain the turns in each survey.
const arteries=roads.filter(r=>r.kind==="street");
for(const r of arteries){
 const line=r.points,normals=line.slice(1).map((p,i)=>{
  const a=line[i],d=dist(a,p)||1;return {x:-(p.z-a.z)/d,z:(p.x-a.x)/d};
 });
 for(const side of [-1,1]){
  const edge=line.map((p,i)=>{
   const a=normals[Math.max(0,i-1)],b=normals[Math.min(i,normals.length-1)];
   const d=Math.max(.8,1+a.x*b.x+a.z*b.z),k=side*(r.width/2+1.0)/d;
   return {x:p.x+(a.x+b.x)*k,z:p.z+(a.z+b.z)*k};
  });
  road("sidewalk",2.6,r.name+" 보도",edge);
 }
}
const junctions=[[-188,-391],[-108.3,-416.1],[130,-489],[155.3,-260.9],[329,26.3],[389.7,97.1],[423.4,135.6],[337.3,147.7]];
// Join the smaller lanes and the stop approaches across the relevant carriageway.
for(const p of fromPairs(junctions)){
 const matches=[];
 for(const r of arteries)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],q=project(p,a,b),d=dist(p,q);
  if(d<16)matches.push({r,a,b,q,d});
 }
 matches.sort((a,b)=>a.d-b.d);
 const names=new Set();
 for(const {r,a,b,q} of matches){
  if(names.has(r.name))continue;
  names.add(r.name);
  const len=dist(a,b),dx=-(b.z-a.z)/len,dz=(b.x-a.x)/len,k=r.width/2+1.8;
  road("crossing",3.8,r.name+" 횡단보도",[{x:q.x-dx*k,z:q.z-dz*k},{x:q.x+dx*k,z:q.z+dz*k}]);
 }
}
// A level forecourt links the passenger doors to the city-bound boarding island.
road("platform",9,"경주역 보행광장",fromPairs([[-6527,4179],[-6519,4172],[-6510,4165],[-6502,4158],[-6491.3,4158.8],[-6481.8,4144.5]]));
road("crossing",4,"경주역 버스승강장 횡단보도",fromPairs([[-6499.0,4158.7],[-6491.3,4158.8]]));
road("path",3.1,"경주역 출입구",[places.stationExit,point([-6519,4172])]);
road("path",2.6,"황남 한옥카페 입구",[point([-233.6,-309.5]),cafe.point(0,cafeLayout.depth/2+.85),cafe.door,cafe.point(0,.48),cafe.order]);
for(const t of cafe.tables)for(const seat of t.seats){
 road("interior",1.15,"카페 좌석 통로",[cafe.point(0,seat.z),seat.approach]);
}
for(const key of ["townBus","townReturnBus"]){
 const stop=places[key];let end=null,best=Infinity;
 for(const r of roads.filter(r=>r.kind==="sidewalk"))for(let i=1;i<r.points.length;i++){
  const q=project(stop,r.points[i-1],r.points[i]),d=dist(stop,q);
  if(best>d){best=d;end=q;}
 }
 road("sidewalk",2.2,"황리단길 정류장 승차대",[stop,end]);
}

// Spatial bins keep per-frame collisions local even among the dense hanok alleys.
const cells=new Map(),cellSize=20;
const key=(x,z)=>x+","+z;
function index(points,margin,label,object){
 const xs=points.map(p=>p.x),zs=points.map(p=>p.z);
 const left=Math.floor((Math.min(...xs)-margin)/cellSize),right=Math.floor((Math.max(...xs)+margin)/cellSize);
 const top=Math.floor((Math.min(...zs)-margin)/cellSize),bottom=Math.floor((Math.max(...zs)+margin)/cellSize);
 for(let x=left;x<=right;x++)for(let z=top;z<=bottom;z++){
  const id=key(x,z);if(!cells.has(id))cells.set(id,{surfaces:[],walls:[],solids:[],mounds:[]});
  cells.get(id)[label].push(object);
 }
}
function inside(p,line){
 let hit=false;
 for(let i=0,j=line.length-1;i<line.length;j=i++){
  const a=line[j],b=line[i];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;
 }
 return hit;
}
for(const r of roads)for(let i=1;i<r.points.length;i++){
 const a=r.points[i-1],b=r.points[i],radius=r.width/2;
 if(r.kind!=="street")index([a,b],radius,"surfaces",{a,b,radius});
}
for(const w of walls)for(let i=1;i<w.points.length;i++){
 const a=w.points[i-1],b=w.points[i];index([a,b],.28,"walls",{a,b});
}
for(const b of buildings)if(b.kind==="building"||b.kind==="station"||b.kind==="observatory")index(b.points,.12,"solids",b.points);
for(const p of parks)if(p.kind==="water")index(p.points,0,"solids",p.points);
for(const m of mounds)index([m],Math.max(m.rx,m.rz),"mounds",{...m,c:Math.cos(m.yaw),s:Math.sin(m.yaw)});
export function gyeongjuWalkable(p){
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
 const cell=cells.get(key(Math.floor(p.x/cellSize),Math.floor(p.z/cellSize)));
 if(!cell)return false;
 const q=cafe.local(p),atCafe=Math.abs(q.x)<cafeLayout.width/2+.24&&Math.abs(q.z)<cafeLayout.depth/2+.24;
 if(atCafe&&cafe.blocked(p))return false;
 if(!atCafe&&!cell.surfaces.some(({a,b,radius})=>distanceTo(p,a,b)<=radius))return false;
 if(cell.walls.some(({a,b})=>distanceTo(p,a,b)<.27)||cell.solids.some(poly=>inside(p,poly)))return false;
 for(const m of cell.mounds){
  const dx=p.x-m.x,dz=p.z-m.z;
  if(((m.c*dx-m.s*dz)/m.rx)**2+((m.s*dx+m.c*dz)/m.rz)**2<.98)return false;
 }
 return true;
}
export function gyeongjuClear(a,b){
 if(!gyeongjuWalkable(a)||!gyeongjuWalkable(b))return false;
 const n=Math.ceil(dist(a,b)/.48);
 for(let i=1;i<n;i++)if(!gyeongjuWalkable(mix(a,b,i/n)))return false;
 return true;
}

// Surveyed intersections normally share vertices. Also connect projected sidewalks and
// adjacent clipped ways where their actual walkable surfaces meet.
let network;
function walkingNetwork(){
 if(network)return network;
 const nodes=[],buckets=new Map(),byPoint=new Map(),cell=9;
 const nearby=(p,radius)=>{
  const out=[];
  for(let x=Math.floor((p.x-radius)/cell);x<=Math.floor((p.x+radius)/cell);x++)
   for(let z=Math.floor((p.z-radius)/cell);z<=Math.floor((p.z+radius)/cell);z++){
    for(const i of buckets.get(key(x,z))||[])if(dist(p,nodes[i].p)<=radius)out.push(i);
   }
  return out;
 };
 function add(p){
  const id=key(Math.round(p.x*100),Math.round(p.z*100));
  if(byPoint.has(id))return byPoint.get(id);
  if(!gyeongjuWalkable(p))return -1;
  const i=nodes.length,bin=key(Math.floor(p.x/cell),Math.floor(p.z/cell));
  nodes.push({p,edges:new Set()});byPoint.set(id,i);
  if(!buckets.has(bin))buckets.set(bin,[]);
  buckets.get(bin).push(i);
  return i;
 }
 function join(i,j){
  if(i>=0&&j>=0&&i!==j&&!nodes[i].edges.has(j)&&gyeongjuClear(nodes[i].p,nodes[j].p)){
   nodes[i].edges.add(j);nodes[j].edges.add(i);
  }
 }
 for(const r of roads){
  if(r.kind==="street")continue;
  let previous=add(r.points[0]);
  for(let k=1;k<r.points.length;k++){
   const a=r.points[k-1],b=r.points[k],steps=Math.max(1,Math.ceil(dist(a,b)/6.8));
   for(let s=1;s<=steps;s++){
    const current=add(s===steps?b:mix(a,b,s/steps));
    join(previous,current);previous=current;
   }
  }
 }
 for(let i=0;i<nodes.length;i++)for(const j of nearby(nodes[i].p,7.5))if(j<i)join(i,j);
 network={nodes,nearby};return network;
}
export function gyeongjuRoute(from,to){
 if(!gyeongjuWalkable(from)||!gyeongjuWalkable(to)||dist(from,to)>2500)return [];
 if(dist(from,to)<28&&gyeongjuClear(from,to))return [{x:to.x,z:to.z}];
 const {nodes,nearby}=walkingNetwork();
 const connectors=p=>nearby(p,18).sort((i,j)=>dist(nodes[i].p,p)-dist(nodes[j].p,p))
   .filter(i=>gyeongjuClear(p,nodes[i].p)).slice(0,9);
 const starts=connectors(from),ends=new Set(connectors(to));
 const costs=new Map(),previous=new Map(),queue=[];
 function push(i,c,parent){
  if(c>=(costs.get(i)??Infinity))return;
  costs.set(i,c);previous.set(i,parent);
  const score=c+dist(nodes[i].p,to);
  let lo=0,hi=queue.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(queue[mid].score>score)lo=mid+1;else hi=mid;}
  queue.splice(lo,0,{i,c,score});
 }
 for(const i of starts)push(i,dist(from,nodes[i].p),-1);
 while(queue.length){
  const {i,c}=queue.pop();
  if(c!==costs.get(i))continue;
  if(ends.has(i)){
   const steps=[to];let n=i;
   while(n!==-1){steps.push(nodes[n].p);n=previous.get(n);}
   steps.push(from);steps.reverse();
   const route=[];let cursor=0;
   while(cursor<steps.length-1){
    let end=cursor+1;
    while(end+1<steps.length&&dist(steps[cursor],steps[end+1])<24&&gyeongjuClear(steps[cursor],steps[end+1]))end++;
    route.push({x:steps[end].x,z:steps[end].z});cursor=end;
   }
   return route;
  }
  for(const j of nodes[i].edges)push(j,c+dist(nodes[i].p,nodes[j].p),i);
 }
 return [];
}
