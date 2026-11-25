import {mappedRoads,mappedBuildings,mappedWalls,mappedMounds,mappedParks} from "./gyeongju-geography.js";
import {southernRoads,southernBuildings,southernWalls,southernMounds,southernParks} from "./gyeongju-southern-geography.js";
import {marketRooms,marketBuilding,marketRoomAt} from "./gyeongju-market.js";
import {gyeongjuPlantings} from "./gyeongju-planting-layout.js";
import {tower,observatoryApproach,insideObservatory} from "./gyeongju-observatory.js";
import {daereungwonPlaces,inCheonmaHall,cheonmaExhibit,michuStoneAt,twinTombName,twinHeight,cheonmaPoint} from "./daereungwon.js";
import {gyeongjuBikeDocks,crossesBikeRack} from "./gyeongju-bike.js";

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
export const cafeLayout=marketRooms.find(r=>r.id==="cafe");
const cafe=cafeLayout.fit;
// Surveyed pedestrian axis and the two plazas beyond the gatehouses.
export const woljeongBridge={north:point([554.3,714.3]),south:point([553.4,782.3]),halfWidth:3.4,
 northPlaza:point([554.5,693.4]),southPlaza:point([553.3,800.2])};
export const places={
 ...daereungwonPlaces,
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
 cheomseongdae:place(tower.x,tower.z,"첨성대"),
 observatoryEntrance:{...observatoryApproach,name:"첨성대 남쪽 창",heading:349},
 stars:place(609.1,169.4,"첨성대 별자리 산책길",40),
 gyerimEntry:place(656.8,311.4,"계림 북쪽 산책길",153),
 gyerim:place(593.1,429.4,"계림 숲길",155),
 woljeongNorth:{...woljeongBridge.northPlaza,name:"월정교 북쪽 입구",heading:181},
 woljeong:place(553.85,748.3,"월정교 누교",181),
 woljeongSouth:{...woljeongBridge.southPlaza,name:"월정교 남쪽 입구",heading:1},
};
export const buildings=[...mappedBuildings,...southernBuildings].map(([kind,name,ring])=>({kind,name,points:ring.map(point)}));
for(const building of buildings){
 const tenant=marketBuilding(building.points[0]);
 if(tenant){building.kind="market";building.name=tenant.name;}
}
export const walls=[...mappedWalls,...southernWalls].map(([kind,line])=>({kind,points:line.map(point)}));
export const parks=[...mappedParks,...southernParks].map(([kind,name,ring])=>({kind,name,points:ring.map(point)}));
export const mounds=[...mappedMounds,...southernMounds].map(([name,x,z,rx,rz,height,yaw])=>({name,x,z,rx,rz,height,yaw}));
export const roads=[...mappedRoads,...southernRoads].map(([kind,width,name,line])=>({kind,width,name,points:line.map(point)}));
function road(kind,width,name,points){roads.push({kind,width,name,points});}
const fromPairs=pairs=>pairs.map(point);
road("path",3.6,"천마총 전시관 진입로",[point([-139,-260.2]),places.cheonmaDoor]);
road("interior",2.3,"천마총 전시실 통로",[places.cheonmaDoor,cheonmaPoint(0,23),places.cheonmaGallery]);
// Open a gap in the surveyed visitor fence facing the south window.
const towerFence=walls.find(w=>w.kind==="fence"&&w.points.some(p=>Math.hypot(p.x-tower.x,p.z-tower.z)<22));
if(towerFence){
 const gap=towerFence.points.findIndex(p=>Math.abs(p.x-631)<.25&&Math.abs(p.z-160.2)<.25);
 if(gap>0&&gap<towerFence.points.length-1){
  const a=towerFence.points[gap-1],mid=towerFence.points[gap],b=towerFence.points[gap+1];
  walls.splice(walls.indexOf(towerFence),1,
   {...towerFence,points:[...towerFence.points.slice(0,gap),mix(mid,a,1.35/dist(mid,a))]},
   {...towerFence,points:[mix(mid,b,1.35/dist(mid,b)),...towerFence.points.slice(gap+1)]});
  road("path",2.0,"첨성대 남쪽 관람로",[mid,places.observatoryEntrance]);
  road("path",2.0,"첨성대 관람 울타리 출입구",[places.stars,mid]);
 }
}
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
for(const room of marketRooms){
 const f=room.fit;
 road("path",2.6,room.name+" 입구",[point(room.street),room.entry,f.door]);
 road("interior",2.6,room.name+" 계산대 통로",[f.door,f.point(0,.48),f.order]);
 for(const t of f.tables)for(const seat of t.seats){
  road("interior",1.15,room.name+" 좌석 통로",[f.point(0,seat.z),seat.approach]);
 }
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
  const id=key(x,z);if(!cells.has(id))cells.set(id,{surfaces:[],traffic:[],lawns:[],water:[],bridges:[],walls:[],solids:[],mounds:[]});
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
const pedestrianStreet=r=>r.kind!=="street"||r.name==="포석로";
// The same surveyed districts as the buildings and roads. Unmarked ground between the
// features is grass, including the verge around the station forecourt.
function openGround(p){
 return p.x>=-323&&p.x<=706&&p.z>=-522&&p.z<=223||
  p.x>=270&&p.x<=860&&p.z>=223&&p.z<=870||
  p.x>=-6770&&p.x<=-6398&&p.z>=4036&&p.z<=4342;
}
for(const park of parks)if(park.kind==="lawn"||park.kind==="wood")index(park.points,0,"lawns",park.points);
for(const r of roads)for(let i=1;i<r.points.length;i++){
 const a=r.points[i-1],b=r.points[i],radius=r.width/2;
 if(pedestrianStreet(r))index([a,b],radius,"surfaces",{a,b,radius});
 else index([a,b],radius,"traffic",{a,b,radius});
 if(r.kind==="bridge"||r.kind==="footbridge"||r.kind==="bridgeApproach")index([a,b],radius,"bridges",{a,b,radius});
}
for(const w of walls)for(let i=1;i<w.points.length;i++){
 const a=w.points[i-1],b=w.points[i];index([a,b],.28,"walls",{a,b});
}
for(const b of buildings)if(b.kind==="building"||b.kind==="station"||b.kind==="observatory")index(b.points,.12,"solids",b.points);
for(const dock of gyeongjuBikeDocks)index(dock.footprint,0,"solids",dock.footprint);
for(const p of parks)if(p.kind==="water")index(p.points,0,"water",p.points);
// Each gatehouse footprint straddles a visitor passage, with solid wings on either side.
for(const [z0,z1] of [[693.8,711.6],[784.4,799.5]]){
 const mid=z=>554.3-(z-714.3)*.9/68;
 for(const side of [-1,1]){
  const ring=[[z0,3.4],[z0,12],[z1,12],[z1,3.4]].map(([z,w])=>({x:mid(z)+side*w,z}));
  index(ring,0,"solids",ring);
 }
}
for(const m of mounds)index([m],m.name===twinTombName?60:Math.max(m.rx,m.rz),"mounds",{...m,c:Math.cos(m.yaw),s:Math.sin(m.yaw)});
const plantings=gyeongjuPlantings(parks,roads,places.stationExit,mounds);
export function gyeongjuWalkable(p){
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
 if(insideObservatory(p))return true;
 if(inCheonmaHall(p))return !cheonmaExhibit(p);
 if(michuStoneAt(p))return false;
 const cell=cells.get(key(Math.floor(p.x/cellSize),Math.floor(p.z/cellSize)));
 if(plantings.blocked(p))return false;
 if(!cell)return openGround(p);
 if(cell.water.some(ring=>inside(p,ring))&&!cell.bridges.some(({a,b,radius})=>distanceTo(p,a,b)<=radius))return false;
 const shop=marketRoomAt(p,.24);
 if(shop?.fit.blocked(p))return false;
 const onLane=segments=>segments.some(({a,b,radius})=>distanceTo(p,a,b)<=radius);
 if(!shop&&!onLane(cell.surfaces)){
  if(onLane(cell.traffic)||!openGround(p)&&!cell.lawns.some(poly=>inside(p,poly)))return false;
 }
 if(cell.walls.some(({a,b})=>distanceTo(p,a,b)<.27)||cell.solids.some(poly=>inside(p,poly)))return false;
 for(const m of cell.mounds){
  if(m.name===twinTombName){if(twinHeight(m,p)>.14)return false;continue;}
  const dx=p.x-m.x,dz=p.z-m.z;
  if(((m.c*dx-m.s*dz)/m.rx)**2+((m.s*dx+m.c*dz)/m.rz)**2<.98)return false;
 }
 return true;
}
export function gyeongjuClear(a,b){
 if(!gyeongjuWalkable(a)||!gyeongjuWalkable(b)||crossesBikeRack(a,b))return false;
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
  if(!pedestrianStreet(r))continue;
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
 // Mark the connected visitor paths in each district; short, isolated service paths
 // can also be the nearest road to a lawn, but cannot by themselves reach town.
 const linked=new Set();
 for(const origin of [places.stars,places.stationExit]){
  const first=nearby(origin,16).sort((i,j)=>dist(nodes[i].p,origin)-dist(nodes[j].p,origin)).find(i=>gyeongjuClear(origin,nodes[i].p));
  const queue=first===undefined?[]:[first];
  for(let head=0;head<queue.length;head++){
   const i=queue[head];if(linked.has(i))continue;linked.add(i);
   for(const j of nodes[i].edges)if(!linked.has(j))queue.push(j);
  }
 }
 network={nodes,nearby,linked};return network;
}
export function gyeongjuRoute(from,to){
 if(!from||!to)return [];
 const observatory=p=>dist(p,places.stars)<32,bridge=p=>dist(p,places.woljeongNorth)<6||
  dist(p,places.woljeong)<6||dist(p,places.woljeongSouth)<6;
 // The visitor route continues through the forest fork before rejoining the lane to Gyochon.
 if(observatory(from)&&bridge(to)||bridge(from)&&observatory(to)){
  const first=walkingRoute(from,places.gyerim),second=walkingRoute(places.gyerim,to);
  if(first.length&&second.length)return first.concat(second);
 }
 return walkingRoute(from,to);
}
// A distant lawn or the grass behind a wall corner may have no direct sightline to a
// connected path. Only then search the local ground, checking every step for collisions.
function lawnApproach(origin,{nearby,nodes,linked},contacts){
 if(contacts.some(i=>linked.has(i)))return [origin];
 const step=6,queue=[{x:origin.x,z:origin.z,dx:0,dz:0,parent:-1}],seen=new Set(["0,0"]);
 for(let i=0;i<queue.length&&i<5500;i++){
  const p=queue[i];
  const target=nearby(p,8).find(j=>linked.has(j)&&gyeongjuClear(p,nodes[j].p));
  if(target!==undefined){
   const steps=[nodes[target].p];
   for(let n=i;n>=0;n=queue[n].parent)steps.push({x:queue[n].x,z:queue[n].z});
   return steps.reverse();
  }
  for(const [ax,az] of groundDirections){
   const dx=p.dx+ax,dz=p.dz+az,id=key(dx,dz);
   if(seen.has(id))continue;
   const q={x:origin.x+dx*step,z:origin.z+dz*step,dx,dz,parent:i};
   if(gyeongjuClear(p,q)){seen.add(id);queue.push(q);}
  }
 }
 return [];
}
const groundDirections=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
function walkingRoute(from,to,tryGround=true){
 if(!gyeongjuWalkable(from)||!gyeongjuWalkable(to)||dist(from,to)>2500)return [];
 if(dist(from,to)<28&&gyeongjuClear(from,to))return [{x:to.x,z:to.z}];
 const graph=walkingNetwork(),{nodes,nearby}=graph;
 // A lawn destination can be well outside the road index's normal junction radius.
 // Widen only as needed and require a traversable approach all the way to a real path.
 const connectors=p=>{
  const checked=new Set();
  for(const radius of [18,54,108,210]){
   const candidates=nearby(p,radius).filter(i=>!checked.has(i)).sort((i,j)=>dist(nodes[i].p,p)-dist(nodes[j].p,p));
   const found=[];
   for(const i of candidates){
    if(gyeongjuClear(p,nodes[i].p))found.push(i);
    if(found.length===9)break;
    checked.add(i);
   }
   if(found.length)return found;
  }
  return [];
 };
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
 if(!tryGround)return [];
 const a=lawnApproach(from,graph,starts),b=lawnApproach(to,graph,[...ends]);
 if(!a.length||!b.length||a.length===1&&b.length===1)return [];
 const mid=walkingRoute(a.at(-1),b.at(-1),false);
 return mid.length?[...a.slice(1),...mid,...b.reverse().slice(1)]:[];
}
