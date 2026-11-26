import assert from "node:assert/strict";
import {worldJumpFeet,renderedJumpLift,LAND_JUMP_MS} from "../public/activities.js";
import {createCoastPlay} from "../public/coast-play.js";
import {registerCoast} from "../public/coast-region.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {clearSegment} from "../public/layout.js";
import {cafePoint,cafeLevel,cafeGround,cafeRoof} from "../public/coast-cafe.js";
import {pavilionPoint,pavilionFloor,upperLevel,lowerLevel} from "../public/pohang-pavilion-layout.js";
import {studioStairs} from "../public/coast-studio-layout.js";
import {stationPoint,stationRailHeight,transferLanding} from "../public/pohang-station-layout.js";
import {parkFloor,landings,hillFloor} from "../public/space-walk-layout.js";
import {ground} from "../public/pohang-layout.js";

registerCoast();
const fork=landings[0],stairZ=studioStairs.start+10.5*studioStairs.run;
const cases=[
 {name:"영일대 카페 옥상",point:d=>cafePoint(5,-.55+d),coast:{cafeFloor:cafeRoof},end:cafeGround},
 {name:"영일대 해상누각",point:d=>pavilionPoint(7.48+d,7),coast:{track:upperLevel},end:lowerLevel},
 {name:"스페이스워크",point:d=>({x:fork.x-.8,z:fork.z+1.38+d}),coast:{track:fork.h},end:hillFloor(fork)},
 {name:"관제실 바깥 돌계단",point:d=>({x:studioStairs.x-.40-d,z:stairZ}),coast:{},end:studioStairs.base}
];
function support(avatar){
 const p=seaPoint(avatar),s=avatar.coast;
 if(Number.isFinite(s.railY))return s.railY;
 return cafeLevel(p,s.cafeFloor)??pavilionFloor(p,s.track)??parkFloor(p,s.track)??ground(p);
}
function crossing({name,point,coast,end}){
 let time=10000;
 const me={...coastPoint(point(0)),heading:0,coast:{mode:"walk",...coast}};
 const play=createCoastPlay({me,now:()=>time});
 const start=support(me);
 const at=distance=>coastPoint(point(distance));
 function move(to){
  const feet=worldJumpFeet(me,time),beachLip=play.beachPassage(to.x,to.y);
  if(!play.canStep(to.x,to.y,beachLip,feet)||!clearSegment(me,to,.20,feet??.19,{from:me,airFeet:feet,beachLip}))return false;
  const from={...me};Object.assign(me,to);play.afterMove(undefined,from,feet);
  return true;
 }
 assert(!move(at(.95)),name+" walking is blocked by the lip or the rail");
 if(name!=="관제실 바깥 돌계단"){
  const next=at(.95);
  assert(!play.canStep(next.x,next.y,false,start+.45),name+" cannot clear a railing while feet are still below it");
 }
 assert(play.canJumpHere(),name+" takeoff is available");
 play.startJump();me.jump=time;me.jumpOriginY=start;
 let distance=0,prior=start,landedAt=null;
 for(let i=1;i<=180&&!landedAt;i++){
  time+=1000/60;
  if(distance<2.7&&move(at(distance+.075)))distance+=.075;
  const floor=support(me),feet=worldJumpFeet(me,time),drawn=floor+renderedJumpLift(me,time,floor);
  assert(Math.abs(drawn-prior)<.32,name+" feet remain on a continuous trajectory");
  if(i*1000/60>LAND_JUMP_MS/2&&feet<=floor)landedAt=floor;
  prior=drawn;
 }
 assert(distance>1.4,name+" cleared the edge");
 assert(landedAt!==null&&Math.abs(landedAt-end)<.025&&end<start-.9,name+" lands on its lower surface");
 console.log(name,start.toFixed(2)+"m → "+landedAt.toFixed(2)+"m");
}
for(const area of cases)crossing(area);
for(const {name,point,level,rail} of [
 {name:"카페",point:d=>cafePoint(5,.02+d),level:{cafeFloor:cafeRoof},rail:cafeRoof+.87},
 {name:"해상누각",point:d=>pavilionPoint(7.8+d,7),level:{track:upperLevel},rail:upperLevel+1.005},
 {name:"포항역",point:d=>stationPoint(14,transferLanding.z+2.35+d),level:{},rail:stationRailHeight(stationPoint(14,transferLanding.z+2.35))}
]){
 for(const direction of [-1,1]){
  const me={...coastPoint(point(0)),coast:{mode:"walk",...level}},play=createCoastPlay({me,now:()=>1000});
  play.afterMove(undefined,undefined,rail+.14);
  assert(Math.abs(support(me)-rail)<1e-6,name+" landing directly onto the rail");
  const next=coastPoint(point(direction*.65)),feet=me.coast.railY;
  assert(play.canStep(next.x,next.y,false,feet)&&clearSegment(me,next,.20,feet,{from:me,airFeet:feet}),name+" can leave either side of its rail");
  Object.assign(me,next);play.afterMove(undefined,undefined,feet);
  assert.equal(me.coast.railY,undefined,name+" releases the railing after stepping off");
 }
}
const swimmer={...coastPoint({x:525,z:-70}),coast:{mode:"swim"}};
assert(!createCoastPlay({me:swimmer,now:()=>1000}).canJumpHere());
console.log("Four land jumps reached their lower surface; swimming still disables jump.");
