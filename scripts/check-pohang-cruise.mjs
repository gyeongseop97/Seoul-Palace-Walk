import assert from "node:assert/strict";
import {deckHeight,deckToSea,seaToDeck,boardingSpot,mainFloor,serviceSpot,helmStation,nearHelm,hullAttitude,
 nearCruiseExit,cruiseAtBerth,inWheelhouse,bridge,cruiseStairs,deckJumpSurface,loungePorch,midFloor} from "../public/coast-vessel-layout.js";
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
const [aftFlight,upperFlight]=cruiseStairs;
const direct=[at(aftFlight.x,aftFlight.start-.3),at(aftFlight.x,aftFlight.end),
 at(upperFlight.x,upperFlight.start),at(upperFlight.x,upperFlight.end+.3)];
assert.equal(walk(direct,mainFloor),bridge.floor);
assert.equal(walk(direct.toReversed(),bridge.floor),mainFloor);
// A visitor can enter off-centre, change lanes on the flight, then turn across its head.
for(const stair of cruiseStairs){
 for(const direction of [-1,1]){
  const left=stair.x-direction*.77,right=stair.x+direction*.77;
  const diagonal=[at(left,stair.start-.46),at(left,stair.start+.20),
   at(right,stair.end-.25),at(right,stair.end+.38),at(left,stair.end+.38)];
  assert.equal(walk(diagonal,stair.from),stair.to);
  assert.equal(walk(diagonal.toReversed(),stair.to),stair.from);
 }
 assert.equal(deckHeight(at(stair.x,stair.end-.24),stair.from),stair.from,"under the high treads");
 assert.equal(deckHeight(at(stair.x,stair.start+1.18),stair.from),null,"low stringer blocks side entry");
}
const sternTurn=[at(-3.9,-14.4),at(-3.66,-15.85),at(-2.6,-16.85),at(-1.5,-16.85)];
assert.equal(walk(sternTurn,mainFloor),mainFloor);
const porchBesideStep=loungePorch.aft+.40;
const onTread=at(loungePorch.left-.04,porchBesideStep),onPorch=at(loungePorch.left+.06,porchBesideStep);
const treadHeight=deckHeight(onTread);
assert.equal(deckJumpSurface(onTread,onPorch,treadHeight,treadHeight+.2),null,"the lounge slab cannot be jumped through");
assert.equal(deckJumpSurface(onPorch,onTread,midFloor,midFloor+.2),treadHeight,"open porch side lands on the tread below");
assert(treadHeight>aftFlight.from&&treadHeight<aftFlight.to);
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
// The port entry should take a full-width stream of passengers directly to the central aisle.
for(const z of [-.94,0,.94]){
 const across=[at(boardingSpot.x,z),at(0,z)];
 assert.equal(walk(across,mainFloor),mainFloor);
 assert.equal(walk(across.toReversed(),mainFloor),mainFloor);
}
for(const [x,z] of [[-3.85,-1.50],[-3.85,1.50],[3.85,0]]){
 assert.equal(deckHeight(at(x,z),mainFloor),null,"solid salon window");
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
console.log("Verified bow routes, diagonal entry and turning on both staircases, open stair landings, rails, windows, chair approaches and moving-hull alignment.");
