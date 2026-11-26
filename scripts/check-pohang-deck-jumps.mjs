import assert from "node:assert/strict";
import {JUMP_MS,LAND_JUMP_MS,renderedJumpLift,worldJumpFeet} from "../public/activities.js";
import {createCoastPlay} from "../public/coast-play.js";
import {bridge,cruiseStairs,deckHeight,deckToSea,gangwayHeight,loungePorch,mainFloor,midFloor} from "../public/coast-vessel-layout.js";
import {mooring,onDock} from "../public/pohang-layout.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";

const start=10000,noop=()=>{};
async function passenger(spot,h,sailing){
 let time=start;
 const vessel={...mooring,yaw:sailing?0.8:0,speed:sailing?7:0,helm:sailing?"skipper":null};
 if(sailing)vessel.x+=220;
 const visit={id:"passenger"},view={pan:0,tilt:0};
 const me={...coastPoint(deckToSea(vessel,spot,time,h)),heading:0,jump:0,
  coast:{mode:"deck",board:false,deckX:spot.x,deckZ:spot.z,floor:h}};
 const play=createCoastPlay({me,visit:()=>visit,view:()=>view,now:()=>time,changed:noop,reset:noop,notice:noop,
  surfaceHeight:p=>onDock(seaPoint(p))?1.85:-1.035,
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
  const deckY=deckToSea(play.ship,local,time,s.floor).h;
  const before=deckY+renderedJumpLift(me,time,deckY),previous={x:me.x,y:me.y};
  Object.assign(me,next);play.afterMove(undefined,previous);
  if(s.mode!=="deck"&&me.jump)assert(Math.abs(worldJumpFeet(me,time)-before)<.007,"release to the world preserves the feet height");
  return true;
 }
 function launch(){play.startJump();me.jump=time;me.jumpOriginY=deckToSea(play.ship,{x:me.coast.deckX,z:me.coast.deckZ},time,me.coast.floor).h;}
 return {me,play,tick,step,launch,clock:()=>time};
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

for(const sailing of [false,true]){
 const g=await passenger({x:2.64,z:1.45},bridge.floor,sailing);
 g.launch();await g.tick(LAND_JUMP_MS/2);
 const floors=new Set([bridge.floor]);
 for(let i=0;i<40&&g.me.coast.mode==="deck";i++){
  assert(g.step(.095,0),"exposed sun deck must lead onto the lower outer decks");
  floors.add(g.me.coast.floor);
  await g.tick(12);
 }
 assert(floors.has(midFloor)&&floors.has(mainFloor),"each lower deck is sampled from the model before the sea");
 assert.equal(g.me.coast.mode,"walk","still airborne after leaving the hull");
 assert.equal(g.me.jump,start);assert(worldJumpFeet(g.me,g.clock())>mainFloor);
 assert.equal(g.me.coast.deckX,undefined);assert.equal(g.play.deckCheckpoint(),null);
 await g.tick(2300);assert.equal(g.me.coast.mode,"swim");assert.equal(g.me.jump,0);assert.equal(g.play.canJumpHere(),false);
 g.play.stop();
}
const quay=await passenger({x:-4.7,z:1.53},mainFloor,false);
assert.equal(quay.step(-.22,0),false);
quay.launch();await quay.tick(LAND_JUMP_MS/2);
for(let i=0;i<6&&quay.me.coast.mode==="deck";i++)assert(quay.step(-.09,0));
assert.equal(quay.me.coast.mode,"walk");assert(worldJumpFeet(quay.me,quay.clock())>3.8);
quay.me.x-=.55;assert(onDock(seaPoint(quay.me)));await quay.tick(1500);
assert.equal(quay.me.coast.mode,"walk");quay.play.stop();
for(const [x,z,h,shift] of [[4.65,0,mainFloor,.24],[3.13,-12.64,midFloor,.10]]){
 const rim=await passenger({x,z},h,false);rim.launch();await rim.tick(LAND_JUMP_MS/2);
 assert(rim.step(shift,0));await rim.tick(1200);assert.equal(rim.me.jump,0);
 assert.equal(rim.play.deckCheckpoint().h,h);
 for(let i=0;i<10;i++)assert(rim.step(-.025,0),"walk back in after landing on the rail margin");
 rim.play.stop();
}
const rampSpot={x:-5.65,z:.80},ramp=await passenger(rampSpot,gangwayHeight(rampSpot),false);
ramp.launch();await ramp.tick(180);
assert(ramp.step(0,.27));assert.equal(ramp.me.coast.mode,"walk");assert(onDock(seaPoint(ramp.me)));
assert(worldJumpFeet(ramp.me,ramp.clock())>1.85);ramp.play.stop();
for(const [spot,floor,dx,dz] of [[{x:0,z:8.27},bridge.floor,0,.25],[{x:3.51,z:-2},mainFloor,.26,0]]){
 const cabin=await passenger(spot,floor,false);cabin.launch();await cabin.tick(LAND_JUMP_MS/2);
 assert.equal(cabin.step(dx,dz),false,"jump cannot leave an enclosed cabin through its window");cabin.play.stop();
}
console.log("Cruise jumps: stairs, exposed decks, hull to sea and quay, closed cabins, moving vessel and legacy rails passed.");
