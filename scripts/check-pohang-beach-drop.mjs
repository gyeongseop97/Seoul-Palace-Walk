import assert from "node:assert/strict";
import {registerCoast} from "../public/coast-region.js";
import {createCoastPlay} from "../public/coast-play.js";
import {sandEdge,beachFloor,atBeachWall} from "../public/pohang-beach-profile.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {clearSegment} from "../public/layout.js";
import {renderedJumpLift,JUMP_MS} from "../public/activities.js";

registerCoast();
let time=10_000;
const me={heading:90,coast:{mode:"walk",board:false}};
const play=createCoastPlay({me,now:()=>time});
function step(dx,dz){
 const next={x:me.x+dx,y:me.y+dz},pass=play.beachPassage(next.x,next.y);
 if(!play.canStep(next.x,next.y,pass)||!clearSegment(me,next,.36,.19,pass))return false;
 Object.assign(me,next);return true;
}
for(const [z,speed,dz] of [[-205,2.58,0],[-147,6.675,.015],[80,2.58,-.012]]){
 const edge=sandEdge(z);
 Object.assign(me,coastPoint({x:edge-1,z}),{jump:0});delete me.coast.beachJumpY;
 for(let i=0;i<120;i++)step(speed/60,0);
 assert(seaPoint(me).x<edge&&!atBeachWall(seaPoint(me)),"walking stops at the inland side");
 play.startJump();me.jump=time;
 let passed=false,lastHeight=beachFloor(seaPoint(me));
 for(let i=1;i<=75;i++){
  time+=1000/60;step(speed/60,dz);
  const p=seaPoint(me),floor=beachFloor(p),height=floor+renderedJumpLift(me,time,floor);
  if(p.x>sandEdge(p.z)+.21)passed=true;
  assert(Math.abs(height-lastHeight)<.19,"continuous flight over the drop");
  lastHeight=height;
 }
 assert(passed&&lastHeight<1&&renderedJumpLift(me,time,lastHeight)===0,"land on the sand");
 for(let i=0;i<180;i++)step(-speed/60,0);
 play.startJump();me.jump=time;
 assert.equal(me.coast.beachJumpY,undefined);
 for(let i=0;i<90;i++){time+=JUMP_MS/60;step(-speed/60,0);}
 assert(seaPoint(me).x>sandEdge(seaPoint(me).z),"cannot jump up through the retaining wall");
}
const z=-205,edge=sandEdge(z);
for(const side of [-1,1]){
 Object.assign(me,coastPoint({x:edge+side*.08,z}),{jump:0});
 assert(step(side*.16,0),"a stationary landing can leave the wall thickness on its own side");
}
console.log("Walk and run jumps clear three beach walls, land smoothly and preserve one-way access.");
