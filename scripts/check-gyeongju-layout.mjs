import assert from "node:assert/strict";
import {cafeLayout,gyeongjuClear,gyeongjuRoute,gyeongjuWalkable,mounds,places,roads,tombGates,transferShelterYaw} from "../public/gyeongju-layout.js";
import {cafeFittings} from "../public/gyeongju-cafe.js";
import {destinations,travelDistricts,travelStops,transferStop,sameGyeongjuArea} from "../public/gyeongju-region.js";
import {inBulguksa,templeCameraBlocked,templeHeight,templePoint,templeSites,templeBridges,templePagodas,templePonds} from "../public/bulguksa-layout.js";
import {localGyeongju} from "../public/region-coordinates.js";
import {cheonmaPoint,twinHeight,twinTombName} from "../public/daereungwon.js";

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
    assert.ok(Math.abs(h-prev)<.12,from.name+" → "+to.name+" 관람로 단차");
    prev=h;
   }
  }
  length+=distance(p,q);p=q;
 }
 return length;
}
const stops=["townBus","townReturnBus","hwangnidan","cafe","cafeCounter","northGate","photo","mainGate","stars",
 "gyerimEntry","gyerim","woljeongNorth","woljeong","woljeongSouth"];
assert.equal(Object.keys(travelDistricts).length,6);
assert.deepEqual(new Set(Object.values(travelDistricts).flat()),new Set(destinations));
for(const site of destinations)assert.ok(gyeongjuWalkable(localGyeongju(site)),site.name+" 순간이동");
assert.equal(travelDistricts["불국사"][0].name,"불국사 일주문");
for(const from of templeSites)for(const to of templeSites)if(from!==to)walk(from,to);
for(const a of [travelStops.stationBus,travelStops.townReturnBus,travelStops.templeBus]){
 assert.equal(transferStop(a),a);
 for(const b of [travelStops.stationBus,travelStops.townReturnBus,travelStops.templeBus]){
  assert.equal(sameGyeongjuArea(a,b),a===b);
  if(a!==b)assert.deepEqual(gyeongjuRoute(localGyeongju(a),localGyeongju(b)),[]);
 }
}
const center=ring=>ring.reduce((p,q)=>({x:p.x+q.x/ring.length,z:p.z+q.z/ring.length}),{x:0,z:0});
for(const p of [...templePagodas,...templeBridges.map(b=>center(b.points)),...templePonds.map(center)])assert.equal(gyeongjuWalkable(p),false);
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
for(const mound of mounds)assert.ok(!gyeongjuWalkable(mound));
assert.ok(!gyeongjuClear(places.northGate,places.photo));
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
