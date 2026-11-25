import assert from "node:assert/strict";
import {RAFT_CYCLE_MS,RAFT_DWELL_MS,RAFT_TRAVEL_MS,raftAt,raftSeatAtPose,raftStops} from "../public/gyeongju-raft-layout.js";
import {RAFT_LEASE_MS,driveRaft,liveRaftState,moorRaft,raftMooring,raftNavigable,raftPoseAt,raftTimesAt,releaseRaft,takeRaftHelm} from "../public/gyeongju-raft-navigation.js";
import {gyeongjuPoint,localGyeongju} from "../public/region-coordinates.js";
import {parks} from "../public/gyeongju-layout.js";

const epoch=Date.UTC(2026,0,1),distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),angle=(a,b)=>(b-a+540)%360-180;
const banks=parks.find(p=>p.name==="남천").points;
function wet({x,z}){
 let yes=false;
 for(let i=0,j=banks.length-1;i<banks.length;j=i++){
  const a=banks[i],b=banks[j];
  if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }
 return yes;
}
function safeHull(p){
 assert(raftNavigable(p),"raft clips bank/dock "+JSON.stringify(p));
 const q=localGyeongju(p),r=(180-p.heading)*Math.PI/180;
 for(const w of [-1.2,1.2])for(const f of [-2.3,2.3]){
  const corner={x:q.x+w*Math.cos(r)+f*Math.sin(r),z:q.z-w*Math.sin(r)+f*Math.cos(r)};
  assert(corner.x>400&&corner.x<549&&wet(corner),"hull outside river or across bridge");
 }
}
function checkHome(state,now){
 const home=releaseRaft(state,now),start=raftPoseAt(home,now);
 assert(distance(start,raftPoseAt(state,now))<.001);
 if(home.mode==="auto"){assert(start.stopId);return;}
 let p=start;
 for(let t=now;t<=home.arriveAt+100;t+=180){
  const q=raftPoseAt(home,t);safeHull(q);assert(distance(p,q)<1.1);p=q;
 }
 const landed=raftPoseAt(home,home.arriveAt+10),later=raftPoseAt(home,home.arriveAt+RAFT_DWELL_MS+RAFT_TRAVEL_MS+10);
 assert.equal(landed.stopId,home.home);assert.equal(landed.mode,"auto");
 assert(later.stopId&&later.stopId!==landed.stopId);
 const serialized=JSON.parse(JSON.stringify(liveRaftState(home,home.arriveAt+50)));
 assert.equal(raftTimesAt(serialized,home.home,home.arriveAt+200).departureMs,RAFT_DWELL_MS-200);
}
for(let t=epoch;t<epoch+RAFT_CYCLE_MS;t+=80){
 const auto=raftPoseAt(null,t);
 assert.equal(auto.stopId,raftAt(t).stopId);safeHull(auto);
 if((t-epoch)%1600===0)checkHome(takeRaftHelm(null,t,"driver"),t);
}

let now=epoch+500,seq=0,state=takeRaftHelm(null,now,"driver");
const send=(throttle,turn,ms=200)=>{
 state=driveRaft(state,now,{throttle,turn,seq:++seq});assert(state);
 assert.equal(driveRaft(state,now,{seq,throttle:0,turn:0}),null);
 now+=ms;const p=raftPoseAt(state,now);safeHull(p);return p;
};
assert.equal(takeRaftHelm(state,now,"other"),null);
for(const target of [raftStops[1],raftStops[0]]){
 // Push away from the pier first, then use the same forward/turn pair as a joystick to reach the far bank.
 for(let i=0;i<24;i++)send(.85,0);
 for(let i=0;i<260;i++){
  const p=raftPoseAt(state,now);if(raftMooring(p)?.id===target.id)break;
  const desired=Math.atan2(target.board.x-p.x,p.y-target.board.y)*180/Math.PI,error=angle(p.heading,desired);
  send(Math.abs(error)>64?.15:.84,Math.max(-1,Math.min(1,error/22)));
 }
 assert.equal(raftMooring(raftPoseAt(state,now))?.id,target.id);
 state=moorRaft(state,now);assert(state);
 while(now<state.arriveAt)send(0,0);
 const at=raftPoseAt(state,now);assert.equal(at.stopId,target.id);assert.equal(at.helm,"driver");safeHull(at);
}

// Probe every reachable corner of the play area, including approaches from behind each pier.
for(let x=404;x<=543;x+=8)for(let z=716;z<773;z+=6)for(let h=0;h<360;h+=45){
 const p={...gyeongjuPoint({x,z}),heading:h};if(!raftNavigable(p))continue;
 const s={...takeRaftHelm(null,epoch,"driver"),...p,stopId:null};
 checkHome(s,epoch);
 if(raftMooring(p)){
  const dock=moorRaft(s,epoch);
  for(let i=epoch;i<dock.arriveAt;i+=70)safeHull(raftPoseAt(dock,i));
 }
}
// Constant forward and reverse into every boundary must never cross the survey or lose the ability to turn.
for(const heading of [0,90,180,270])for(const throttle of [-1,1]){
 let s={...takeRaftHelm(null,epoch,"driver"),...gyeongjuPoint({x:480,z:740}),heading,stopId:null};
 for(let i=0;i<170;i++){
  const t=epoch+500*i;s=driveRaft(s,t,{throttle,turn:0,seq:i+1});safeHull(raftPoseAt(s,t+500));
 }
}
const loose=takeRaftHelm(null,epoch+25000,"driver"),active=driveRaft(loose,loose.at,{seq:1,throttle:1,turn:-.13});
const last=raftPoseAt(active,active.leaseUntil-.001),gone=raftPoseAt(active,active.leaseUntil);
assert(distance(last,gone)<.001);assert.equal(gone.helm,null);
assert.equal(driveRaft(active,active.leaseUntil+10,{throttle:0,turn:0,seq:2}),null);
assert.equal(takeRaftHelm(active,active.leaseUntil+10,"other").pilot,"other");
const expired=liveRaftState(active,active.leaseUntil+1);assert.equal(expired.mode,"return");
for(const seat of [0,1,2])assert(distance(raftSeatAtPose(gone,seat),gone)<1);
assert.equal(active.leaseUntil,active.at+RAFT_LEASE_MS);
console.log("Manual Namcheon raft: steering/reverse, full hull limits, both landings, passenger positions, lease expiry and continuous return to the timetable passed.");
