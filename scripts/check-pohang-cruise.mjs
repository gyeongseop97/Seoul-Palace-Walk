import assert from "node:assert/strict";
import {deckHeight,deckToSea,seaToDeck,boardingSpot,mainFloor,serviceSpot,helmStation,nearHelm,hullAttitude,nearCruiseExit,cruiseAtBerth,inWheelhouse,bridge} from "../public/coast-vessel-layout.js";
import {cruiseSeats} from "../public/coast-vessel-seats.js";
import {mooring} from "../public/pohang-layout.js";

const at=(x,z)=>({x,z});
const stairs=[at(-4.48,-9.4),at(-3.53,-9.4),at(-3.53,-15.79),at(-2.55,-15.79),at(-2.55,-11.72)];
const route=[boardingSpot,...stairs,serviceSpot,at(1.7,-10.13),at(1.7,-5.44),
 at(0,1.9),at(0,3.5),helmStation];
const cruise={x:mooring.x+184,z:mooring.z+77,yaw:1.25},clock=1234567890000;
function walk(points,h){
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.115);
  for(let j=1;j<=n;j++){
   const p=at(a.x+(b.x-a.x)*j/n,a.z+(b.z-a.z)*j/n);
   const next=deckHeight(p,h);
   assert(next!==null&&Math.abs(next-h)<.45,JSON.stringify({p,h,next}));h=next;
   const world=deckToSea(cruise,p,clock,h),restored=seaToDeck(cruise,world,clock,h);
   assert(Math.hypot(restored.x-p.x,restored.z-p.z)<.001);
  }
 }
 return h;
}
assert.equal(walk(route,mainFloor),7.85);
assert.equal(walk(route.toReversed(),7.85),mainFloor);
const abaftCabin=at(-4.48,-9.5),bow=at(0,19.15);
const bowRoutes=[[boardingSpot,abaftCabin,at(0,-9.5),bow]];
for(const side of [-1,1]){
 const x=n=>side*n;
 bowRoutes.push([boardingSpot,abaftCabin,at(x(4.48),-9.5),at(x(4.34),5.9),at(x(3.83),9.85),at(x(3.59),10.7),at(0,14),bow]);
}
for(const path of bowRoutes){
 assert.equal(walk(path,mainFloor),mainFloor);
 assert.equal(walk(path.toReversed(),mainFloor),mainFloor);
}
for(const p of [at(0,19.55),at(1.3,18),at(-1.3,18),at(1.1,9.85)]){
 assert.equal(deckHeight(p,mainFloor),null,"rail or window at "+JSON.stringify(p));
}
for(const seat of cruiseSeats){
 assert.equal(deckHeight(seat.approach,seat.floor),seat.floor,seat.id+" aisle");
 assert.equal(deckHeight(seat,seat.floor),null,seat.id+" chair");
}
assert.equal(deckHeight(at(-1.74,2.75),7.85),null);
assert.equal(deckHeight(at(0,7.35),7.85),null);
assert.equal(nearHelm({...helmStation,h:mainFloor}),false);
assert.equal(nearHelm({...helmStation,h:7.85}),true);
assert(nearCruiseExit({...boardingSpot,h:mainFloor}));
for(const p of [boardingSpot,{...boardingSpot,h:5.46},{x:0,z:0,h:mainFloor},{...boardingSpot,z:2,h:mainFloor},{x:-boardingSpot.x,z:0,h:mainFloor}]){
 assert.equal(nearCruiseExit(p),false);
}
assert(inWheelhouse({x:0,z:4,h:bridge.floor}));
assert.equal(inWheelhouse({x:0,z:bridge.aft-.1,h:bridge.floor}),false);
assert.equal(inWheelhouse({x:0,z:4,h:mainFloor}),false);
assert(cruiseAtBerth({...mooring,yaw:0,speed:0}));
for(const ship of [{...mooring,yaw:Math.PI},{...mooring,yaw:0,z:mooring.z+3},{...mooring,yaw:0,speed:.2}]){
 assert.equal(cruiseAtBerth(ship),false);
}
const docked=hullAttitude({...mooring,yaw:0},clock);
assert(Math.abs(docked.pitch)<.003&&Math.abs(docked.roll)<.004);
console.log("Verified all three bow routes in both directions, rail and window collision, every chair approach, three connected decks, helm and hull motion.");
