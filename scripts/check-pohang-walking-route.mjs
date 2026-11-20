import assert from "node:assert/strict";
import {coastWalkingRoute,coastDryStep,coastWalkable,destinations} from "../public/coast-region.js";
import {shore,onDock,onPier,onHeadland,dock} from "../public/pohang-layout.js";
import {sandEdge,canCrossBeachEdge} from "../public/pohang-beach-profile.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {tracks} from "../public/space-walk-layout.js";
import {pavilionPoint,upperLevel} from "../public/pohang-pavilion-layout.js";

const drySurface=p=>p.x<=shore(p.z)||onDock(p)||onPier(p)||onHeadland(p);
function inspect(from,to){
 const route=coastWalkingRoute(from,to);
 assert.deepEqual(route.at(-1),to,"the entire route reaches the requested point");
 let start=seaPoint(from);
 for(const wp of route){
  const end=seaPoint(wp),n=Math.max(1,Math.ceil(Math.hypot(end.x-start.x,end.z-start.z)/.2));
  let previous=start;
  for(let i=1;i<=n;i++){
   const p={x:start.x+(end.x-start.x)*i/n,z:start.z+(end.z-start.z)*i/n};
   assert(drySurface(p),"no leg enters shallow or deep water");
   assert(canCrossBeachEdge(previous,p),"normal walking crosses the seawall only at an opening");
   assert(coastWalkable(coastPoint(p).x,coastPoint(p).y),"route stays on walkable ground");
   previous=p;
  }
  start=end;
 }
 return route;
}
const [station,,rack,pier,headland,tavern,pavilion]=destinations;
assert.equal(coastDryStep(pier,headland),false,"the straight line across the bay is blocked");
for(const [from,to] of [[pier,headland],[headland,pier],[pier,pavilion],[pavilion,rack],[station,pier],[pier,tavern]])inspect(from,to);
inspect(pier,coastPoint({x:1245,z:-1182})); // A map tap on open park grass, over 100 m from a road.
const high=tracks[2][83],upperHall={...coastPoint(pavilionPoint(-2,7)),coast:{track:upperLevel}};
const both=inspect({...coastPoint(high),coast:{track:high.h}},upperHall);
assert(both.some(point=>point.trackNode!=null),"a trip from one raised structure to the other descends the park stairs");
const z=-74,upper=coastPoint({x:sandEdge(z)-1,z}),lower=coastPoint({x:sandEdge(z)+5,z});
assert(!coastDryStep(upper,lower));
assert(inspect(upper,lower).length>1);
const wet=coastPoint({x:shore(dock.z+18)+.6,z:dock.z+18});
assert(coastWalkable(wet.x,wet.y),"free movement can still enter the water");
assert.deepEqual(coastWalkingRoute(rack,wet),[]);
assert.deepEqual(coastWalkingRoute(wet,rack),[]);
const across=coastPoint({x:shore(-72)-2,z:-72}),nearby=coastPoint({x:shore(-72)-4,z:-72});
assert.deepEqual(inspect(across,nearby),[nearby]);
console.log("Pohang walking routes reach the park, station, stairs, dock and pavilion on dry ground.");
