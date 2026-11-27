import assert from "node:assert/strict";
import {rink,onRink,createSportRide,advanceSkater,iceTrick,iceEvent,advanceHill,hillPoint,hillHeight,hillLength,gates} from "../public/outdoor-sports.js";
import {replyToWave} from "../public/resident-greeting.js";
import {gyeongjuWalkable} from "../public/gyeongju-layout.js";
import {localGyeongju} from "../public/region-coordinates.js";

const ice=createSportRide("skate"),p={...rink,sport:"skate"},zero={x:0,y:0};
let t=5000;
function skate(n,input){for(let i=0;i<n;i++){advanceSkater(ice,p,1/60,input,t);t+=1000/60;assert(onRink(p));}}
skate(115,{x:1,y:0});
const speed=ice.speed,where=p.x;skate(12,zero);
assert(p.x>where&&ice.speed<speed&&ice.speed>5);
skate(2,{x:-1,y:0});assert.equal(iceEvent(p,t).kind,"fall");
assert(!iceTrick(ice,p,"spin",t));skate(100,zero);
for(const kind of ["spin","hop"]){assert(iceTrick(ice,p,kind,t));assert.equal(iceEvent(p,t).kind,kind);skate(85,zero);}
Object.assign(p,{x:rink.x+rink.rx-1,y:rink.y});ice.vx=8;ice.vy=0;
skate(7,zero);assert.equal(iceEvent(p,t).kind,"fall");
for(const kind of ["luge","sled"]){
 const ride=createSportRide(kind),person={};let done=false,collided=false,peak=0;
 for(let i=0;i<23000&&!done;i++){
  const before=ride.speed,contact=ride.contact;
  done=advanceHill(ride,person,1/60,{x:i<160?0:i<850?1:0,y:0});
  if(!contact&&ride.contact&&ride.speed<before*.65)collided=true;
  peak=Math.max(peak,ride.speed);
  assert(Number.isFinite(person.heading)&&gyeongjuWalkable(localGyeongju(person)));
 }
 assert(done&&peak>4&&collided&&ride.gate===gates.length);
 assert(hillHeight(0,0)>40&&hillHeight(hillLength,0)===0);
 const braking=createSportRide(kind);braking.speed=6;advanceHill(braking,{},.1,{x:0,y:1});assert(braking.speed<6);
}
const npc={},pose={x:300,y:225,heading:0,stepping:true},start=10000;
const player={x:301,y:225,gesture:{kind:"wave",at:start}};
replyToWave(npc,pose,[player],start);assert(!pose.gesture);
replyToWave(npc,pose,[player],start+600);assert.equal(pose.gesture.kind,"wave");assert(pose.greetingLook<0);
for(const peer of [{...player,x:320},{...player,gesture:{kind:"clap",at:start}}]){
 const target={x:300,y:225,heading:0};replyToWave({},target,[peer],start+600);assert(!target.gesture);
}
assert(gyeongjuWalkable(localGyeongju(hillPoint(0))));
console.log("Passed greeting, skating inertia, falls, two tricks, mountain access, downhill acceleration, collision slowdown, braking and both race finishes.");
