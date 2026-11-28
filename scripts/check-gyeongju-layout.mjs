import assert from "node:assert/strict";
import {cafeLayout,gyeongjuClear,gyeongjuMoundHeight,gyeongjuRoute,gyeongjuWalkable,gyeongjuWallTop,mounds,places,roads,tombGates,transferShelterYaw,walls} from "../public/gyeongju-layout.js";
import {cafeFittings} from "../public/gyeongju-cafe.js";
import {destinations,travelDistricts,travelStops,transferDestinations,transferStop,sameGyeongjuArea,templeWorshipAt,enteringBikeInterior,coastName} from "../public/gyeongju-region.js";
import {inBulguksa,templeAxis,templeCameraBlocked,templeHeight,templePoint,templeSites,stairPaths,stoneStairs,templePlantings,templePaths,templePagodas,templePonds} from "../public/bulguksa-layout.js";
import {drapePath,groundHeightAt} from "../public/bulguksa-ground.js";
import {templeHallTerraces} from "../public/bulguksa-hall-layout.js";
import {localGyeongju,gyeongjuPoint} from "../public/region-coordinates.js";
import {cheonmaLayer,cheonmaPoint,twinHeight,twinTombName} from "../public/daereungwon.js";
import {moundMesh,moundSurfaceHeight} from "../public/gyeongju-mound-surface.js";

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function walk(from,to){
 assert.ok(gyeongjuWalkable(from),from.name);
 assert.ok(gyeongjuWalkable(to),to.name);
 const path=gyeongjuRoute(from,to);
 assert.ok(path.length,`No path from ${from.name} to ${to.name}`);
 assert.ok(distance(path.at(-1),to)<.01);
 let length=0,p=from;
 for(const q of path){
  assert.ok(gyeongjuClear(p,q),`Obstruction between ${JSON.stringify(p)} and ${JSON.stringify(q)}`);
  if(inBulguksa(from)){
   const n=Math.ceil(distance(p,q)/.2);
   let prev=templeHeight(p);
   for(let i=1;i<=n;i++){
    const h=templeHeight({x:p.x+(q.x-p.x)*i/n,z:p.z+(q.z-p.z)*i/n});
    assert.ok(Math.abs(h-prev)<.19,from.name+" → "+to.name+" 관람로 단차");
    prev=h;
   }
  }
  length+=distance(p,q);p=q;
 }
 return length;
}
const stops=["townBus","townReturnBus","hwangnidan","cafe","cafeCounter","northGate","photo","mainGate","stars",
 "gyerimEntry","gyerim","woljeongNorth","woljeong","woljeongSouth"];
assert.equal(Object.keys(travelDistricts).length,7);
assert.deepEqual(new Set(Object.values(travelDistricts).flat()),new Set(destinations));
for(const site of destinations)assert.ok(gyeongjuWalkable(localGyeongju(site)),site.name+" 순간이동");
assert.equal(travelDistricts["불국사"][0].name,"불국사 일주문");
for(const from of templeSites)for(const to of templeSites)if(from!==to)walk(from,to);
const amusementGate=travelDistricts["경주월드"][0];
assert.equal(amusementGate.name,"경주월드 정문");
assert.equal(travelDistricts["경주월드"].length,5);
for(const ride of travelDistricts["경주월드"].slice(1)){
 assert.ok(gyeongjuRoute(localGyeongju(amusementGate),localGyeongju(ride)).length,ride.name);
}
const terminals=[travelStops.stationBus,travelStops.townReturnBus,travelStops.templeBus,amusementGate];
for(const a of terminals){
 assert.equal(transferStop(a),a);
 const options=transferDestinations(a);
 assert.equal(options.length,3);
 for(const b of terminals){
  const choice=options.find(option=>option.board===b);
  if(a===b)assert.equal(choice,undefined);
  else assert.equal(choice.arrive,b===travelStops.townReturnBus?travelStops.townBus:b);
  assert.equal(sameGyeongjuArea(a,b),a===b);
  if(a!==b)assert.deepEqual(gyeongjuRoute(localGyeongju(a),localGyeongju(b)),[]);
 }
}
const center=ring=>ring.reduce((p,q)=>({x:p.x+q.x/ring.length,z:p.z+q.z/ring.length}),{x:0,z:0});
for(const p of [...templePagodas,...templePonds.map(center)])assert.equal(gyeongjuWalkable(p),false);
for(const stair of stairPaths){
 const foot=stair.points[0],landing=stair.points.at(-1);
 assert(gyeongjuClear(foot,landing)&&gyeongjuClear(landing,foot),"continuous stair flight into the upper court");
 assert(templeHeight(landing)-templeHeight(foot)>3);
}
for(const f of stoneStairs){
 const v=(f.south+f.north)/2;
 assert(!gyeongjuClear(templeAxis(f.u,v),templeAxis(f.u+f.width/2+1,v)),"stair rail blocks sideways movement");
}
for(const lawn of [templeAxis(45,83),templeAxis(-29,286),templeAxis(68,403),templeAxis(408,215)]){
 walk(templeSites[0],lawn);walk(lawn,templeSites[1]);
}
for(const hall of templeHallTerraces.filter(h=>h.plinth)){
 const foot=templeAxis(hall.u,hall.v+hall.deckD/2+hall.stairRun+.06),landing=templeAxis(hall.u,hall.v+hall.deckD/2-.3);
 assert(gyeongjuClear(foot,landing)&&gyeongjuClear(landing,foot),hall.name+" front steps");
 assert(Math.abs(templeHeight(landing)-templeHeight(foot)-hall.plinth)<.01,hall.name+" raised deck");
 const point=(x,z)=>templeAxis(hall.u+x,hall.v+z);
 const pad=point(0,hall.interior.padZ),door=point(0,hall.bodyD/2);
 const marker=templeWorshipAt(gyeongjuPoint(pad));
 assert(marker&&Math.abs(marker.h-templeHeight(pad))<.1&&Math.abs(marker.heading-351.4)<.1,hall.name+" altar-facing floor action");
 assert.equal(templeWorshipAt(gyeongjuPoint(door)),null);
 assert(gyeongjuClear(foot,pad)&&gyeongjuClear(pad,foot),hall.name+" enter and leave through the open doors");
 assert(!gyeongjuWalkable(point(hall.bodyW/2,0))&&!gyeongjuWalkable(point(0,hall.interior.screenZ+.7)),hall.name+" solid wall and altar");
 assert(!templeCameraBlocked(pad,templeHeight(pad)+1.6)&&templeCameraBlocked(pad,hall.floor+hall.interior.eave+.15),hall.name+" interior camera clearance");
 assert(enteringBikeInterior(gyeongjuPoint(landing),gyeongjuPoint(pad)));
 assert.equal(coastName(gyeongjuPoint(pad)),"불국사 "+hall.name+" 법당");
}
for(const path of templePaths)drapePath(path,(ring,indices)=>{
 for(let i=0;i<indices.length;i+=3){
  const tri=indices.slice(i,i+3).map(n=>ring[n]);
  const u=tri.reduce((sum,p)=>sum+p.u,0)/3,v=tri.reduce((sum,p)=>sum+p.v,0)/3;
  const y=tri.reduce((sum,p)=>sum+groundHeightAt(p.u,p.v),0)/3;
  assert(Math.abs(y-groundHeightAt(u,v))<1e-6,"path surface follows the lawn through each change of slope");
 }
});
assert(!gyeongjuWalkable(templeAxis(690,140)));
assert(templePlantings().trees.length>120&&templePlantings().trees.every(p=>!gyeongjuWalkable(p)));
const axisPoint=(p,u,v)=>({x:p.x+u*Math.cos(.15)+v*Math.sin(.15),z:p.z-u*Math.sin(.15)+v*Math.cos(.15)});
const [dabo,seok]=templePagodas;
for(const [u,v] of [[3.82,.6],[-3.60,.6],[.8,3.86],[.8,-3.60],[-2.06,-2.01]])assert.equal(gyeongjuWalkable(axisPoint(dabo,u,v)),false,"Dabotap plinth or stair");
for(const [u,v] of [[3.3,2.2],[-3.4,-2.1],[2.3,3.4]])assert.equal(gyeongjuWalkable(axisPoint(dabo,u,v)),true,"clear ground between stairs");
assert.equal(gyeongjuWalkable(axisPoint(seok,2.13,2.13)),false,"Seokgatap square base corner");
for(const [p,roof] of [[templePoint([2,16]),4.3],[templePoint([18,14]),2.9]]){
 assert.equal(templeCameraBlocked(p,templeHeight(p)+1.6),false,"visitor beneath gate or gallery");
 assert.equal(templeCameraBlocked(p,templeHeight(p)+roof),true,"camera stays outside its roof");
}
assert.deepEqual(destinations.filter(p=>p.caption).map(p=>p.caption.name).sort(),["검총","내물왕릉","미추왕릉","천마총","황남대총"].sort());
for(const id of ["cheonmaDoor","cheonmaGallery","twinTomb","michu","geomchong","naemul"]){
 walk(places.northGate,places[id]);walk(places[id],places.photo);
}
assert.ok(gyeongjuClear(places.cheonmaDoor,places.cheonmaGallery));
assert.ok(!gyeongjuWalkable(cheonmaPoint(0,12.8)),"천마총 전시대");
const twin=mounds.find(m=>m.name===twinTombName);
for(const dz of [-23,23])assert.ok(twinHeight(twin,{x:twin.x,z:twin.z+dz})>twinHeight(twin,twin)+3);
for(const a of stops)for(const b of stops)if(a!==b)walk(places[a],places[b]);
for(const [from,to] of [[places.stars,places.woljeongSouth],[places.woljeongSouth,places.stars]]){
 const steps=gyeongjuRoute(from,to);
 assert.ok(steps.some(q=>distance(q,places.gyerim)<.1),"scenic route goes through Gyerim");
 const length=walk(from,to);
 assert.ok(length>590&&length<1060,`scenic walk length ${length}`);
}
assert.ok(gyeongjuClear(places.woljeongNorth,places.woljeongSouth),"both gatehouses open onto the bridge");
for(const side of [-1,1]){
 const offset=(p,width)=>({x:p.x+side*width,z:p.z});
 assert.ok(gyeongjuWalkable(offset(places.woljeong,3)));
 for(const width of [3.8,7,17,35])assert.equal(gyeongjuWalkable(offset(places.woljeong,width)),false,"Namcheon outside the deck");
 assert.equal(gyeongjuWalkable(offset({x:554.4,z:702.7},8)),false,"gatehouse side wall");
}
assert.ok(walk(places.stationExit,places.stationBus)<65);
for(const [id,yaw] of Object.entries(transferShelterYaw)){
 const nx=Math.sin(yaw),nz=Math.cos(yaw),p=places[id];
 const facingRoad=roads.filter(r=>r.kind==="street"&&r.name===(id==="stationBus"?"경주역 버스 진입로":"태종로"));
 assert(facingRoad.some(r=>r.points.slice(1).some((b,i)=>{
  const a=r.points[i],dx=b.x-a.x,dz=b.z-a.z;
  const t=((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz);
  if(t<0||t>1)return false;
  const x=a.x+dx*t-p.x,z=a.z+dz*t-p.z,d=Math.hypot(x,z);
  return d<12&&(nx*x+nz*z)/d>.99;
 })),id+" opens towards its own carriageway");
}
for(const {center,yaw,width} of tombGates){
 const local=(u,v)=>({x:center.x+u*Math.cos(yaw)+v*Math.sin(yaw),z:center.z-u*Math.sin(yaw)+v*Math.cos(yaw)});
 assert(gyeongjuClear(local(0,-2.4),local(0,2.4)),center.name+" through passage");
 for(const side of [-1,1])assert(!gyeongjuWalkable(local(side*(width/2-.23),0)),center.name+" stone post");
}
walk(places.stationBus,places.stationExit);
assert.deepEqual(gyeongjuRoute(places.stationBus,places.townBus),[]);
assert.deepEqual(gyeongjuRoute(places.townReturnBus,places.stationExit),[]);
assert.ok(distance(places.stationExit,places.townBus)>7700);
assert.ok(distance(places.townBus,places.townReturnBus)>150);
const room=cafeFittings(cafeLayout);
for(const table of room.tables)for(const seat of table.seats){
 walk(places.cafe,seat.approach);
 walk(seat.approach,places.cafeCounter);
 assert.ok(!gyeongjuWalkable(room.point(seat.x,seat.z)));
}
assert.ok(!gyeongjuWalkable(room.point(cafeLayout.width/2,0)));
assert.ok(!gyeongjuWalkable(room.point(room.counter.x,room.counter.z)));
assert.ok(gyeongjuWalkable(places.cheomseongdae),"enterable upper chamber");
assert.ok(!gyeongjuWalkable({x:places.cheomseongdae.x+1.8,z:places.cheomseongdae.z}),"observatory masonry");
for(const mound of mounds){
 assert.ok(gyeongjuWalkable(mound),"봉분 꼭대기 "+JSON.stringify(mound));
 const {vertices,indices}=moundMesh(mound);
 for(let i=9;i+2<indices.length;i+=123){
  const tri=indices.slice(i,i+3).map(j=>vertices[j]),mean=axis=>tri.reduce((sum,q)=>sum+q[axis]/3,0);
  const h=moundSurfaceHeight(mound,{x:mean(0),z:mean(2)});
  assert(Math.abs(h-Math.max(0,mean(1)))<1e-5,"mound footing follows the rendered triangle");
 }
}
for(const name of ["검총","미추왕릉",twinTombName,"천마총","내물왕릉"]){
 const m=mounds.find(m=>m.name===name);
 walk(places.photo,m);walk(m,places.photo);
 assert(gyeongjuMoundHeight(m)>3);
}
assert(gyeongjuClear(places.northGate,places.photo),"봉분을 넘어 걸을 수 있는 대릉원 산책로");
const gallery=cheonmaPoint(1.5,12.8),turf=cheonmaPoint(6.2,12.8);
assert.equal(gyeongjuMoundHeight(gallery),0,"천마총 전시실 바닥");
assert(gyeongjuMoundHeight(gallery,true)>9,"전시실 바로 위에는 걸을 수 있는 봉분");
assert(!gyeongjuClear(gallery,turf)&&!gyeongjuWalkable(turf,gallery),"walkers in the exhibit cannot pass through its side wall");
assert(cheonmaLayer(turf,gallery)&&gyeongjuWalkable(gallery,turf),"walkers coming over the turf remain above the exhibit");
assert(!cheonmaLayer(places.cheonmaDoor,cheonmaPoint(0,28.1)),"the south entrance still leads into the exhibit");
assert(gyeongjuRoute({...gallery,up:true},places.cheonmaGallery).length,"map route leaves the turf and re-enters the gallery through its doorway");
const rim=templeAxis(-5,-17.24+17.05/2+.02);
assert(!gyeongjuWalkable(rim)&&gyeongjuWalkable(rim,null,6.20),"jump over the edge of Daeungjeon's raised deck");
const retaining=templeAxis(-35,21.3),cap=templeHeight(retaining);
assert(!gyeongjuWalkable(retaining,null,1)&&gyeongjuWalkable(retaining,null,cap+.01),"the retaining wall only clears from above its coping");
for(const f of stoneStairs){
 const v=f.north+(f.south-f.north)*.31;
 const deck=templeAxis(f.u+f.width/2-.4,v),rail=templeAxis(f.u+f.width/2+.16,v);
 const top=templeHeight(rail);
 assert(top-templeHeight(deck)>.64&&gyeongjuWalkable(rail,deck,top)&&!gyeongjuWalkable(rail,deck));
 assert(gyeongjuWalkable(rail,rail)&&gyeongjuWalkable(deck,rail),"a walker landing on the railing can leave it");
}
for(const kind of ["fence","stone"]){
 const examples=walls.filter(w=>w.kind===kind).flatMap(w=>w.points.slice(1).map((b,i)=>{
  const a=w.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  const p={x:a.x+dx*.37,z:a.z+dz*.37};
  return [p,{x:p.x+dz/len*.8,z:p.z-dx/len*.8},{x:p.x-dz/len*.8,z:p.z+dx/len*.8}];
 }));
 assert(examples.some(([top,a,b])=>{
  const h=gyeongjuWallTop(top);
  return h>1&&gyeongjuWalkable(a)&&gyeongjuWalkable(b)&&!gyeongjuWalkable(top,a)&&
   !gyeongjuWalkable(top,a,h-.1)&&gyeongjuWalkable(top,a,h)&&gyeongjuWalkable(top,top)&&gyeongjuWalkable(b,top);
 }),kind+" can be cleared, stood on and left");
}
const street=roads.find(r=>r.kind==="street"&&r.name==="포석로"&&r.width===4);
assert.ok(street,"one-way section of Hwangnidan-gil");
assert.ok(gyeongjuWalkable({x:-190.2,z:-361.1}),"the Hwangnidan road itself is walkable");
assert.ok(gyeongjuClear({x:-193.2,z:-361.1},{x:-186.8,z:-361.1}),"Hwangnidan-gil from kerb to kerb");
assert.equal(gyeongjuWalkable({x:155.3,z:-310}),false,"Gyerim-ro carriageway outside a crossing");
for(const lawn of [{x:600,z:252},{x:640,z:590},{x:701,z:-412}]){
 walk(places.stars,lawn);walk(lawn,places.stars);
}
for(const verge of [{x:-6412,z:4098},{x:-6595,z:4086},{x:-6542,z:4272}]){
 walk(places.stationExit,verge);walk(verge,places.stationBus);
}
console.log(`Gyeongju: ${stops.length} connected city destinations; ${templeSites.length} Bulguksa stops and their footpaths, hills and transfers; café seating, Gyerim and Woljeonggyo passed.`);
