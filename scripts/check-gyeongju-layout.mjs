import assert from "node:assert/strict";
import {cafeLayout,gyeongjuClear,gyeongjuRoute,gyeongjuWalkable,mounds,places,roads} from "../public/gyeongju-layout.js";
import {cafeFittings} from "../public/gyeongju-cafe.js";

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
const stops=["townBus","townReturnBus","hwangnidan","cafe","cafeCounter","northGate","photo","mainGate","stars"];
for(const a of stops)for(const b of stops)if(a!==b)walk(places[a],places[b]);
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
assert.ok(!gyeongjuWalkable(places.cheomseongdae));
for(const mound of mounds)assert.ok(!gyeongjuWalkable(mound));
assert.ok(!gyeongjuClear(places.northGate,places.photo));
const street=roads.find(r=>r.kind==="street"&&r.name==="포석로"&&r.width===4);
assert.ok(street,"one-way section of Hwangnidan-gil");
assert.equal(gyeongjuWalkable({x:-190.2,z:-361.1}),false,"road centre outside a crossing");
console.log(`Gyeongju: ${stops.length} destinations linked in both directions, KTX forecourt and all four cafe chairs reachable.`);
