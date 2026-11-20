import assert from "node:assert/strict";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {hill,hillFloor,landings,parkStep,tracks} from "../public/space-walk-layout.js";
import {pickSpaceWalk,spaceWalkRoute} from "../public/space-walk-navigation.js";

function tap(p){
  const hit=pickSpaceWalk({origin:{x:p.x,y:p.h+.7,z:p.z},direction:{x:0,y:-1,z:0}});
  assert(hit&&Math.abs(hit.point.coast.track-p.h)<.025,"tap lands on this level");
  return hit.point;
}
function checkTrip(start,end,landing){
  const from={...coastPoint(start),coast:{track:start.h}},path=spaceWalkRoute(from,tap(end));
  assert(path?.length>1);
  assert(path.some(p=>Math.hypot(p.x-coastPoint(landing).x,p.y-coastPoint(landing).y)<.01),"route passes through landing");
  let current=start,h=start.h;
  for(const waypoint of path){
    const next=seaPoint(waypoint),dx=next.x-current.x,dz=next.z-current.z;
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.14));
    for(let k=1;k<=n;k++){
      h=parkStep({x:current.x+dx*k/n,z:current.z+dz*k/n},h);
      assert(Number.isFinite(h),"route remains on connected stairs and landings");
    }
    current=next;
  }
  assert(Math.abs(h-end.h)<.05);
}
for(const [end,landing] of [[5,landings[0]],[-8,landings[1]]]){
  const a=tracks[1].at(end),b=tracks[2].at(end);
  checkTrip(a,b,landing);checkTrip(b,a,landing);
}
const grass={x:hill.x-30,z:hill.z+19};
const groundPoint=coastPoint(grass),high=tracks[2][83];
const approach=spaceWalkRoute(groundPoint,tap(high));
assert.deepEqual(seaPoint(approach[0]),seaPoint(coastPoint(tracks[0][0])));
const exit=spaceWalkRoute({...coastPoint(high),coast:{track:high.h}},groundPoint);
assert.deepEqual(exit.at(-1),groundPoint);
assert(Math.abs(exit.at(-2).coast.track-hillFloor(tracks[0][0]))<.01);
assert.equal(spaceWalkRoute(groundPoint,coastPoint({x:grass.x+1,z:grass.z})),null);
console.log("Space Walk taps follow the correct level through both landings and the park entrance.");
