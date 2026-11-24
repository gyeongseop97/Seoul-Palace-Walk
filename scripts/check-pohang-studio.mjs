import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {coastRequest} from "../server/pohang.mjs";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {createCoastPlay} from "../public/coast-play.js";
import {restoreStudioPosition,studioConsole,studioDock,studioDoor,studioFloor,studioInRoom,studioLadder,studioMooring,studioShipClear,studioStairs,studioStorm} from "../public/coast-studio-layout.js";
import {cruiseBerth,deckToSea,helmStation} from "../public/coast-vessel-layout.js";
import {inSailingArea,voyageAt} from "../public/coast-voyage.js";
import {inBounds,inWater} from "../public/pohang-layout.js";

const dbClient=createClient({url:"file::memory:"}),db=adaptDatabase(dbClient);
const room="9".repeat(32),id="2".repeat(32),key="f".repeat(32),v={room,id,key};
let now=Date.UTC(2026,0,1),monitorVisits=0;
async function command(pose,action,boat){
 const response=await coastRequest(db,{...v,coast:{pose,action,boat}},now);
 assert.equal(response.status,200);return response.json();
}
try{
 await initializeDatabase(dbClient);
 await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)").bind(room,id,key,now).all();
 const ship={...studioMooring,x:studioMooring.x-1,speed:0};
 assert(inSailingArea(ship));assert(!inSailingArea({...studioDock,yaw:Math.PI/2}));
 assert(studioShipClear({x:539,z:studioDoor.z,yaw:Math.PI/2}));
 assert(!studioShipClear({x:540.4,z:studioDoor.z,yaw:Math.PI/2}));
 const helm={...deckToSea(ship,helmStation,now,7.85),mode:"deck",floor:7.85,yaw:Math.PI};
 await command(helm);
 await db.prepare("UPDATE coast_harbor SET x=?,z=?,yaw=?,updated=? WHERE room=?").bind(ship.x,ship.z,ship.yaw,now,room).all();
 assert.equal((await command(helm,"helm")).boat.helm,id);
 const docked=await command(helm,"moor",ship);
 assert.equal(cruiseBerth(docked.boat),studioDock);assert.equal(docked.boat.helm,null);
 assert.equal(cruiseBerth({...docked.boat,speed:.1}),null);
 for(const kind of ["tour","return"]){
  const trip={kind,started:now,ox:studioMooring.x,oz:studioMooring.z,angle:studioMooring.yaw};
  let finished=false;
  for(let elapsed=0;elapsed<900000;elapsed+=500){
   const frame=voyageAt(trip,now+elapsed);assert(inSailingArea(frame),"the autonomous ship must clear the quay");
   if(frame.done){finished=true;break;}
  }
  assert(finished);
 }
 now+=120000;
 assert.equal(cruiseBerth((await command({...studioDoor,yaw:0,mode:"walk"})).boat),studioDock);
 const view={},noop=()=>{},me={...coastPoint({x:555.80,z:studioLadder.z}),coast:{mode:"swim"},heading:90};
 const play=createCoastPlay({me,visit:()=>v,now:()=>now,changed:noop,reset:noop,notice:noop,view:()=>view,openMonitor:()=>monitorVisits++,
  request:async()=>Response.json(docked)});
 play.tick(0,[0,0]);await new Promise(setImmediate);
 const action=id=>{const a=play.menu().actions.get(id);assert(a?.marker,id);a.run();};
 function walk(x,z){
  const start=seaPoint(me),n=Math.ceil(Math.hypot(x-start.x,z-start.z)/.12);
  for(let i=1;i<=n;i++){
   const p={x:start.x+(x-start.x)*i/n,z:start.z+(z-start.z)*i/n},w=coastPoint(p);
   assert(inBounds(p)&&!inWater(p)&&play.canStep(w.x,w.y),JSON.stringify(p));
   Object.assign(me,w);play.afterMove();play.tick(.016,[0,0]);
  }
 }
 assert(!play.menu().actions.has("studioConsole"));
 action("studioClimb");walk(558,-70);action("embark");assert.equal(me.coast.mode,"deck");action("disembark");
 const stair=studioStairs;
 assert(studioDoor.z>stair.end&&stair.end>stair.start,"flight rises to the right when seen from the sea");
 walk(stair.x,stair.start);
 for(let i=0;i<stair.treads;i++){
  walk(stair.x,stair.start+(i+.5)*stair.run);
  assert.equal(studioFloor(seaPoint(me)),stair.base+i*stair.rise);
 }
 walk(stair.x,studioDoor.z);assert.equal(studioFloor(seaPoint(me)),studioDoor.h);
 walk(studioDoor.x-1,studioDoor.z);action("studioDoor");walk(studioConsole.x-.8,studioConsole.z);
 action("studioConsole");assert.equal(monitorVisits,1);
 walk(studioDoor.x+1,studioDoor.z);action("studioDoor");walk(stair.x,studioDoor.z);
 walk(stair.x,stair.start-.2);walk(studioLadder.x+1,studioLadder.z);
 action("studioWater");assert(inWater(seaPoint(me)));assert.equal(me.coast.mode,"swim");
 const saved=(x,z,extra={})=>({...coastPoint({x,z}),heading:0,height:0,up:false,layout:4,...extra});
 const oldStep=restoreStudioPosition(saved(566,-77.725));
 assert.equal(studioFloor(seaPoint(oldStep)),stair.base+10*stair.rise);
 assert.equal(oldStep.heading,180);assert.equal(restoreStudioPosition(oldStep),oldStep);
 assert.equal(studioFloor(seaPoint(restoreStudioPosition(saved(565,-89.3)))),studioDoor.h);
 assert(studioInRoom(seaPoint(restoreStudioPosition(saved(571,-88)))));
 assert.equal(studioFloor(seaPoint(restoreStudioPosition(saved(566,-74)))),stair.base+2*stair.rise);
 for(const pose of [saved(566,-73.2),saved(563,-74),saved(564,-82),saved(566,-82,{deck:{x:0,z:0,h:2.46}}),saved(566,-82,{layout:5})])
  assert.equal(restoreStudioPosition(pose),pose);
 assert(studioStorm({x:490,z:-70})>.95);assert.equal(studioStorm(studioDock),0);
 play.stop();console.log("Verified offshore mooring, swim ladder, 30 steps, doorway, console and return to water.");
}finally{dbClient.close();}
