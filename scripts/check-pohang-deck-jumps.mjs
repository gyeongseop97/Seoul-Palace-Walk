import assert from "node:assert/strict";
import {JUMP_MS,renderedJumpLift} from "../public/activities.js";
import {createCoastPlay} from "../public/coast-play.js";
import {bridge,cruiseStairs,deckHeight,deckToSea,loungePorch,mainFloor,midFloor} from "../public/coast-vessel-layout.js";
import {mooring} from "../public/pohang-layout.js";
import {coastPoint} from "../public/region-coordinates.js";

const start=10000,noop=()=>{};
async function passenger(spot,h,sailing){
 let time=start;
 const vessel={...mooring,yaw:sailing?0.8:0,speed:sailing?7:0,helm:sailing?"skipper":null};
 if(sailing)vessel.x+=220;
 const visit={id:"passenger"},view={pan:0,tilt:0};
 const me={...coastPoint(deckToSea(vessel,spot,time,h)),heading:0,jump:0,
  coast:{mode:"deck",board:false,deckX:spot.x,deckZ:spot.z,floor:h}};
 const play=createCoastPlay({me,visit:()=>visit,view:()=>view,now:()=>time,changed:noop,reset:noop,notice:noop,
  request:async()=>{
   const distance=vessel.speed*(time-start)/1000;
   const boat={...vessel,x:vessel.x+distance*Math.sin(vessel.yaw),z:vessel.z+distance*Math.cos(vessel.yaw),sampleAt:time};
   return {ok:true,json:async()=>({boat,people:[]})};
  }});
 async function tick(ms){
  time+=ms;play.tick(ms/1000,[0,0]);await new Promise(setImmediate);
 }
 await tick(0);await tick(0);
 assert.equal(me.coast.floor,h);
 function step(dx,dz){
  const s=me.coast,local={x:s.deckX+dx,z:s.deckZ+dz};
  const next=coastPoint(deckToSea(play.ship,local,time,s.floor));
  if(!play.canStep(next.x,next.y))return false;
  Object.assign(me,next);play.afterMove();return true;
 }
 return {me,play,tick,step,clock:()=>time};
}

const upper=cruiseStairs[1];
const openings=[
 {x:0,z:upper.end+.10,h:bridge.floor,landing:midFloor,dx:0,dz:-1},
 {x:1,z:loungePorch.aft+.10,h:midFloor,landing:mainFloor,dx:0,dz:-1},
 ...cruiseStairs.map(stair=>{
  const p={x:stair.x-stair.side*(stair.half-.10),z:stair.start+.55*(stair.end-stair.start)};
  return {...p,h:deckHeight(p),landing:stair.from,dx:-stair.side,dz:0};
 })
];
for(const sailing of [false,true])for(const opening of openings){
 const {h,landing,dx,dz}=opening;
 const {me,play,tick,step,clock}=await passenger(opening,h,sailing);
 assert.equal(step(dx*.22,dz*.22),false,"walking cannot fall through an open side");
 play.startJump();me.jump=clock();
 let last=h,airborneAfterNormalJump=false;
 for(let i=1;i<=56;i++){
  await tick(25);
  if(i<=8)assert(step(dx*.034,dz*.034),`jump could not cross ${JSON.stringify(opening)}`);
  const s=me.coast,floor=deckToSea(play.ship,{x:s.deckX,z:s.deckZ},clock(),s.floor).h;
  const lift=renderedJumpLift(me,clock(),floor),feet=s.floor+lift;
  assert(Math.abs(feet-last)<.26,"feet must follow a continuous descent");
  assert.equal(renderedJumpLift(JSON.parse(JSON.stringify(me)),clock(),floor),lift);
  if(clock()-start>JUMP_MS&&lift>0)airborneAfterNormalJump=true;
  last=feet;
 }
 assert(airborneAfterNormalJump,"flight must continue to the lower deck");
 assert.equal(me.coast.floor,landing);assert.equal(me.coast.deckJumpY,undefined);
 assert.equal(play.deckCheckpoint().h,landing);
 if(sailing)assert(play.ship.x>mooring.x+223,"passenger's vessel moved during the jump");
 play.stop();
}
const guard=await passenger({x:2.65,z:1.5},bridge.floor,false);
guard.play.startJump();guard.me.jump=guard.clock();await guard.tick(JUMP_MS/2);
assert.equal(guard.step(.22,0),false,"solid perimeter rails still stop jumps");
guard.play.stop();
console.log("Both aft landings and both stair sides support continuous jumps on moored and sailing cruises; perimeter rails hold.");
