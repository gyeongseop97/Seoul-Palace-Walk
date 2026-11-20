import assert from "node:assert/strict";
import {alcoholGait,finishAlcoholSip,staggeredStep} from "../public/avatar-gestures.js";
import {drawLiveMotion} from "../public/motion-stream.js";

const start=Date.UTC(2026,0,1);
const first=finishAlcoholSip({},start,false);
let drunk=first;
for(let i=1;i<8;i++)drunk={...drunk,...finishAlcoholSip(drunk,start,false)};
assert.equal(alcoholGait({},start,false),null);
for(const fast of [false,true]){
 const mild=alcoholGait(first,start,fast),strong=alcoholGait(drunk,start,fast);
 assert(strong.speedScale<mild.speedScale&&mild.speedScale<1&&strong.speedScale>.4);
 assert.equal(alcoholGait(drunk,drunk.blushUntil,fast),null);
 assert(alcoholGait(drunk,drunk.blushUntil-5,fast).speedScale>.999);
}
for(const fixed of [{seat:0},{groundSit:true},{bike:{dock:"a"}},{bus:{index:0}},
 {coast:{mode:"scooter"}},{coast:{mode:"swim"}},{coast:{mode:"surf"}},{coast:{mode:"table"}}]){
 assert.equal(alcoholGait({...drunk,...fixed},start,true),null);
}

const step=(p,dx,dy,gait,allow=()=>true)=>staggeredStep(p,p.x+dx,p.y+dy,gait,(x,y)=>{
 if(!allow(x,y))return false;
 Object.assign(p,{x,y});return true;
});
function travel(fast,stepMs){
 const pos={x:0,y:0},remote={avatar:{...drunk},sample:{at:start},live:{frames:[]},
  position:{x:0,y:0,heading:90},error:{x:0,y:0},velocity:{x:0,y:0}};
 let total=0,minHeading=90,maxHeading=90;
 for(let elapsed=0;elapsed<10000;elapsed+=stepMs){
  const at=start+elapsed,gait=alcoholGait(drunk,at+stepMs/2,fast),delta=stepMs/1000;
  const x=pos.x,y=pos.y;
  step(pos,(fast?6.675:2.58)*gait.speedScale*delta,0,gait);
  const vx=(pos.x-x)/delta,vy=(pos.y-y)/delta,heading=Math.atan2(vx,-vy)*180/Math.PI;
  assert(vx>0);total+=Math.hypot(vx,vy)*delta;
  remote.live.frames.push({...pos,at,heading,vx,vy,running:fast,blocked:false});
  if(remote.live.frames.length>15)remote.live.frames.shift();
  assert(drawLiveMotion(remote,at,delta));
  assert.equal(remote.running,fast);assert.equal(remote.stepping,true);
  minHeading=Math.min(minHeading,remote.position.heading);maxHeading=Math.max(maxHeading,remote.position.heading);
 }
 assert(minHeading<84&&maxHeading>96);
 assert(Math.abs(pos.y)<.75&&Math.hypot(remote.position.x-pos.x,remote.position.y-pos.y)<.8);
 return {pos,total};
}
for(const fast of [false,true]){
 const active=travel(fast,10),background=travel(fast,125);
 assert(Math.abs(active.total-background.total)<1e-6);
 assert(Math.abs(active.pos.x-background.pos.x)<.02&&Math.abs(active.pos.y-background.pos.y)<.04);
 assert(active.total<(fast?6.675:2.58)*7);
}
const corridor={x:0,y:0},gait={turn:.20};
assert(step(corridor,.2,0,gait,(_,y)=>y<=0));assert.deepEqual(corridor,{x:.2,y:0});
assert(!step(corridor,.2,0,gait,()=>false));assert.deepEqual(corridor,{x:.2,y:0});
step(corridor,0,0,gait);assert.deepEqual(corridor,{x:.2,y:0});
console.log("Walking and running pace, gentle steering, remote movement and facing, frame-rate independence, collision fallback, stationary controls and recovery passed.");
