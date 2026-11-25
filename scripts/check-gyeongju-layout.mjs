import assert from "node:assert/strict";
import {cafeLayout,gyeongjuClear,gyeongjuRoute,gyeongjuWalkable,mounds,places,roads} from "../public/gyeongju-layout.js";
import {cafeFittings} from "../public/gyeongju-cafe.js";
import {destinations,travelDistricts} from "../public/gyeongju-region.js";
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
  length+=distance(p,q);p=q;
 }
 return length;
}
const stops=["townBus","townReturnBus","hwangnidan","cafe","cafeCounter","northGate","photo","mainGate","stars",
 "gyerimEntry","gyerim","woljeongNorth","woljeong","woljeongSouth"];
assert.equal(Object.keys(travelDistricts).length,5);
assert.deepEqual(new Set(Object.values(travelDistricts).flat()),new Set(destinations));
for(const site of destinations)assert.ok(gyeongjuWalkable(localGyeongju(site)),site.name+" 순간이동");
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
console.log(`Gyeongju: ${stops.length} connected destinations, café seating, Gyerim scenic route and Woljeonggyo river crossing passed.`);
