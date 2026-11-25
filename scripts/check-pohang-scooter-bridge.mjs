import assert from "node:assert/strict";
import {createCoastPlay} from "../public/coast-play.js";
import {registerCoast} from "../public/coast-region.js";
import {canScoot} from "../public/coast-scooters.js";
import {clearSegment} from "../public/layout.js";
import {ground} from "../public/pohang-layout.js";
import {apronStart,bridgeStart,lowerLevel,pavilionAxes,pavilionFloor,pavilionPoint,stairRun} from "../public/pohang-pavilion-layout.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";

registerCoast();
const point=(u,v)=>coastPoint(pavilionPoint(u,v));
function ride(u,v){
 const me={...point(u,v),coast:{mode:"scooter",board:false}},play=createCoastPlay({me,visit:()=>null,now:()=>1000});
 function step(x,y){
  if(!play.canStep(x,y)||!clearSegment(me,{x,y},.36,.19))return false;
  const from={x:me.x,y:me.y};Object.assign(me,{x,y});play.afterMove(undefined,from);return true;
 }
 function to(u,v){
  const target=point(u,v),start={x:me.x,y:me.y},n=Math.ceil(Math.hypot(target.x-start.x,target.y-start.y)/.114);
  let previous=ground(seaPoint(me));
  for(let i=1;i<=n;i++){
   assert(step(start.x+(target.x-start.x)*i/n,start.y+(target.y-start.y)*i/n),`blocked on approach to ${u},${v} at ${JSON.stringify(pavilionAxes(seaPoint(me)))}`);
   const floor=ground(seaPoint(me));assert(Math.abs(floor-previous)<.08,"continuous wheel contact");previous=floor;
   assert.equal(me.coast.track,pavilionFloor(seaPoint(me))??undefined);
  }
 }
 return {me,play,step,to};
}

// Both edges of the bridge meet the irregular shoreline; very small input steps must work too.
for(const u of [-2.2,0,2.2]){
 const r=ride(u,apronStart-2);
 r.to(u,-9);r.to(u,apronStart-2);
}
const diagonal=ride(-4,apronStart-.8);
diagonal.to(1.9,bridgeStart+4);diagonal.to(-4,apronStart-.8);
const across=ride(-3.3,apronStart+.2);
across.to(3.3,apronStart+.2);across.to(-3.3,apronStart+.2);
for(const side of [-1,1])for(const along of [-1,1]){
 const v0=bridgeStart+35,r=ride(side*2.36,v0);
 for(let i=0;i<15;i++){
  const {u,v}=pavilionAxes(seaPoint(r.me)),next=point(u+side*.12,v+along*.18);
  assert.equal(r.step(next.x,next.y),false,"stone railing blocks the outward component");
  assert(r.play.slideAlongRail(next.x-r.me.x,next.y-r.me.y,r.step));
 }
 const q=pavilionAxes(seaPoint(r.me));assert(Math.abs(q.u-side*2.36)<.001&&Math.abs(q.v-v0-along*2.7)<.001);
 r.to(0,q.v);
}
const plaza=ride(0,-12);plaza.to(5,-8);plaza.to(5,2);plaza.to(0,-6);
assert.equal(plaza.me.coast.track,lowerLevel);
for(const p of [pavilionPoint(0,stairRun.from+.5),pavilionPoint(1.45,3.3),pavilionPoint(2.49,bridgeStart+11),pavilionPoint(5,bridgeStart+22)])assert.equal(canScoot(p),false);
console.log("Scooters cross the bridge and promenade in both directions, glide along both railings and stop at water, columns and stairs.");
