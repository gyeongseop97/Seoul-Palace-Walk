import assert from "node:assert/strict";
import {deckHeight,deckToSea,seaToDeck,boardingSpot,mainFloor,serviceSpot,helmStation,nearHelm,hullAttitude} from "../public/coast-vessel-layout.js";
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
assert.equal(walk([boardingSpot,at(-4.48,-9.5),at(0,-9.5),at(0,5),at(0,-9.5)],mainFloor),mainFloor);
assert.equal(deckHeight(at(-1.74,2.75),7.85),null);
assert.equal(deckHeight(at(0,7.35),7.85),null);
assert.equal(nearHelm({...helmStation,h:mainFloor}),false);
assert.equal(nearHelm({...helmStation,h:7.85}),true);
const docked=hullAttitude({...mooring,yaw:0},clock);
assert(Math.abs(docked.pitch)<.003&&Math.abs(docked.roll)<.004);
console.log("Verified three connected decks in both directions, salon, bridge doorway, wheel, sea orientation and moored stability.");
