import assert from "node:assert/strict";
import {gyeongjuClear,gyeongjuRoute,gyeongjuWalkable,parks,places} from "../public/gyeongju-layout.js";
import {localGyeongju} from "../public/region-coordinates.js";
import {RAFT_CYCLE_MS,RAFT_DOCK_WIDTH,RAFT_DWELL_MS,RAFT_LENGTH,RAFT_SEATS,RAFT_TRAVEL_MS,RAFT_WIDTH,
 nearRaftStop,onRaftPier,raftAt,raftHeave,raftPierHeight,raftSeatPose,raftStops,raftStopTimes} from "../public/gyeongju-raft-layout.js";

const river=parks.find(p=>p.name==="남천").points,epoch=Date.UTC(2026,0,1);
function inRiver(p){
 let inside=false;
 for(let i=0,j=river.length-1;i<river.length;j=i++){
  const a=river[i],b=river[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
for(const [i,stop] of raftStops.entries()){
 const board=localGyeongju(stop.board),exit=localGyeongju(stop.exit),gate=i?places.woljeongSouth:places.woljeongNorth;
 assert(!inRiver(stop.land)&&!inRiver(exit));
 assert(inRiver(board)&&onRaftPier(board)&&gyeongjuWalkable(board));
 assert(gyeongjuClear(stop.path,stop.land)&&gyeongjuClear(stop.land,stop.dockEnd)&&gyeongjuClear(exit,stop.land));
 for(const [a,b] of [[gate,board],[board,gate]]){
  const route=gyeongjuRoute(a,b);
  assert(route.length&&route.every((p,i)=>gyeongjuClear(i?route[i-1]:a,p)));
  assert(Math.hypot(route.at(-1).x-b.x,route.at(-1).z-b.z)<.02);
 }
 assert(!gyeongjuWalkable({x:board.x+RAFT_DOCK_WIDTH/2+.1,z:board.z}));
 assert(!gyeongjuWalkable({x:stop.dockEnd.x,z:stop.dockEnd.z+Math.sign(stop.dockEnd.z-stop.land.z)*.1}));
 assert(Math.abs(raftPierHeight(board)-.32)<1e-6&&raftPierHeight(stop.land)<.03);
 const t=epoch+i*(RAFT_TRAVEL_MS+RAFT_DWELL_MS);
 assert.equal(nearRaftStop(stop.board),stop);
 assert.equal(raftAt(t).stopId,stop.id);
 assert.equal(raftStopTimes(stop.id,t+500).departureMs,RAFT_DWELL_MS-500);
 assert.equal(raftStopTimes(stop.id,t+RAFT_DWELL_MS).departureMs,null);
}
assert.equal(RAFT_SEATS,3);
for(let t=epoch;t<epoch+RAFT_CYCLE_MS;t+=80){
 const boat=raftAt(t),center=localGyeongju(boat),next=raftAt(t+80),yaw=(180-boat.heading)*Math.PI/180;
 assert(Math.hypot(boat.x-next.x,boat.y-next.y)<.32);
 assert(Math.abs((boat.heading-next.heading+540)%360-180)<2);
 assert(Math.abs(raftHeave(t))<=.018);
 for(const side of [-RAFT_WIDTH/2,0,RAFT_WIDTH/2])for(const forward of [-RAFT_LENGTH/2,RAFT_LENGTH/2]){
  const p={x:center.x+side*Math.cos(yaw)+forward*Math.sin(yaw),z:center.z-side*Math.sin(yaw)+forward*Math.cos(yaw)};
  assert(inRiver(p)&&p.x>402&&p.x<545,"raft hull touches bank, stepping stones or bridge");
 }
 const seats=Array.from({length:RAFT_SEATS},(_,i)=>raftSeatPose(t,i));
 assert(seats.every(s=>Math.hypot(boat.x-s.x,boat.y-s.y)<1));
 assert(seats.every((s,i)=>seats.slice(i+1).every(other=>Math.hypot(s.x-other.x,s.y-other.y)>.82)));
}
assert.equal(raftSeatPose(epoch,3),null);
console.log("Namcheon: navigable bank trails and dock edges, smooth round trip inside water, Woljeonggyo/stone-crossing clearance and three distinct seats passed.");
