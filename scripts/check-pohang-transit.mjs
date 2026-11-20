import assert from "node:assert/strict";
import {busAt,busLine,busLines,busCount,busDwell,harborStops,arrivalsAt,stopById,ground,inBounds} from "../public/pohang-layout.js";
import {coastObstacle,coastWalkable} from "../public/coast-region.js";
import {coastPoint} from "../public/region-coordinates.js";
import {beachAccess,sandEdge,shore,beachFloor,canCrossBeachEdge} from "../public/pohang-beach-profile.js";
import {beachParasols} from "../public/coast-beach-seats.js";
import {scooterHubs,canScoot} from "../public/coast-scooters.js";

const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const turn=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const walkable=p=>{const q=coastPoint(p);return coastWalkable(q.x,q.y);};
assert.equal(busCount,10);
assert.equal(harborStops.length,10);
for(const line of busLines){
 const coach=line.id==="express"?0:5;
 assert.equal(busLine(coach),line);
 for(const [i,leg] of line.legs.entries()){
  const stop=stopById(line.stops[i]),pose=busAt(coach,leg.start+.001);
  assert.equal(pose.stop,stop.id);assert.equal(pose.speed,0);
  assert(Math.abs(busAt(coach,leg.start+busDwell+.12).speed)<.4);
  const arriving=busAt(coach,leg.start+busDwell+leg.seconds-.12);
  assert(arriving.speed<.45);
  assert.equal(arrivalsAt(stop.id,leg.start+.01)[0].seconds,0);
  assert.equal(arrivalsAt(stop.id,leg.start+.01)[0].index,coach);
  assert(walkable(stop)&&walkable(stop.shelter)&&!coastObstacle(stop,2),stop.id+" curb is accessible");
  const yaw=pose.yaw,right=(p)=>-(p.x-pose.x)*Math.cos(yaw)+(p.z-pose.z)*Math.sin(yaw);
  assert(right(stop)>1.5&&right(stop.shelter)>right(stop),"boarding on right "+stop.id);
  const end=busAt(coach,leg.start+busDwell+leg.seconds-.00005),next=stopById(line.stops[(i+1)%line.stops.length]);
  assert(dist(end,next.berth)<.02&&turn(end.yaw,next.berth.yaw)<.02,"continuous terminal loop "+stop.id);
  for(let j=0;j<leg.lane.length;j++){
   const p=leg.lane[j];assert(ground(p)>=1.8,"bus on dry land");
   if(j)assert(turn(p.yaw,leg.lane[j-1].yaw)<.76,"smooth steer "+line.id+" "+[p.x,p.z]);
   for(const forward of [-5.25,0,5.25])for(const side of [-1.27,1.27]){
    const body={x:p.x+Math.sin(p.yaw)*forward+Math.cos(p.yaw)*side,z:p.z+Math.cos(p.yaw)*forward-Math.sin(p.yaw)*side};
    assert(!coastObstacle(body,2),"bus hull crosses a building at "+JSON.stringify(body));
   }
  }
 }
}
for(const g of beachAccess){
 for(const side of [-.36,0,.36]){
  const z=g.z+side*g.width,e=sandEdge(z);let last=1.85;
  for(let d=-1.2;d<g.run+1.2;d+=.12){
   const p={x:e+d,z};assert(inBounds(p)&&walkable(p),"blocked beach entry "+g.z);
   assert(canCrossBeachEdge({x:p.x-.12,z},p));
   const h=ground(p);assert(Math.abs(h-last)<.26,"sand approach height "+g.z);last=h;
  }
  assert(last<1.05&&last>.25);
 }
}
for(const z of [-560,-205,-147,-55,80,184]){
 const x=sandEdge(z);
 assert(!inBounds({x,z}));
 assert(!canCrossBeachEdge({x:x-1,z},{x:x+1,z}));
 assert(!canCrossBeachEdge({x:x+1,z},{x:x-1,z}));
 assert(beachFloor({x:x-.26,z})-beachFloor({x:x+.26,z})>.8);
}
for(const p of beachParasols)for(const c of p.chairs){
 assert(c.top>ground(c)&&walkable(c));
 assert(c.x>sandEdge(c.z)&&c.x<shore(c.z));
}
for(const hub of scooterHubs)assert(canScoot(hub)&&walkable(hub),hub.name);
console.log("Both Pohang lines, ten right-side boarding areas, full bus-body clearances, all beach stairs, ramps, chairs and scooter hubs passed.");
