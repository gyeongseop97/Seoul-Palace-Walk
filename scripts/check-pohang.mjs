import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {coastRequest} from "../server/pohang.mjs";
import {tracks,loop,parkStep,parkFloor,hillFloor} from "../public/space-walk-layout.js";
import {station,train,platformDoor,sideStreets,inBounds,beachStop,busAt,busPeriod,busTravel,busDwell,routeLength,distance,dock,mooring,tables,pavilion,ground,wave,showAge,festivalDuration} from "../public/pohang-layout.js";
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client),room="e".repeat(32);
try{
 await initializeDatabase(client);
 const ids=["a","b"].map(c=>c.repeat(32)),key="f".repeat(32);
 for(const id of ids)await db.prepare("INSERT INTO walkers(room,id,updated,avatar,view,player_key,nickname,coat) VALUES(?,?,0,'{}','{}',?,?,123)").bind(room,id,key,id.slice(0,1)).all();
 const clock=300000;
 const ask=async(id,pose,action="",extra={},time=clock)=>{const r=await coastRequest(db,{room,id,key,coast:{pose:{...pose,mode:"walk",yaw:0,...pose},action,...extra}},time);assert.equal(r.status,200);return r.json();};
 assert.equal((await coastRequest(db,{room,id:ids[0],key:"wrong",coast:{}},clock)).status,403);
 for(const id of ids)await ask(id,tables[0],"sit",{table:0});
 const shared=await ask(ids[0],tables[0],"grill",{table:0});
 assert.equal(new Set(shared.people.map(p=>p.seat)).size,2);
 assert.equal(shared.grills[0].started,clock);
 assert.equal((await ask(ids[1],tables[0],"eat",{table:0,started:clock},clock+2000)).grills[0].started,clock);
 assert.equal((await ask(ids[1],tables[0],"eat",{table:0,started:clock},clock+7500)).grills[0].started,0);
 for(const id of ids)await ask(id,tables[0],"stand");
 const deck={x:mooring.x+1.55,z:mooring.z-10.5,mode:"deck"};
 assert.equal((await ask(ids[0],deck,"helm")).boat.helm,ids[0]);
 assert.equal((await ask(ids[1],deck,"helm")).boat.helm,ids[0]);
 const moved={x:mooring.x+5,z:mooring.z+3,yaw:.7};
 assert.equal((await ask(ids[0],deck,"",{boat:moved},clock+600)).boat.x,moved.x);
 assert.equal((await ask(ids[1],dock,"festival")).boat.festival,clock);
 assert.equal((await ask(ids[0],dock,"festival",{},clock+2000)).boat.festival,clock);
 const abandoned=await ask(ids[1],dock,"",{},clock+21000);assert.equal(abandoned.boat.helm,null);assert.equal(abandoned.boat.x,mooring.x);
 const atStation=busPeriod*1000+500;
 const first=await ask(ids[0],station,"board",{coach:0,seat:3},atStation);
 assert(first.busSeats.some(s=>s.seat===3&&s.id===ids[0]));
 const second=await ask(ids[1],station,"board",{coach:0,seat:3},atStation+10);
 assert(!second.busSeats.some(s=>s.id===ids[1]));
 assert((await ask(ids[1],station,"board",{coach:0,seat:5},atStation+20)).busSeats.some(s=>s.seat===5&&s.id===ids[1]));
 assert.equal((await ask(ids[0],station,"exitBus",{},atStation+50)).busSeats.length,1);
 const cruiseTime=clock+32000;
 await ask(ids[0],deck,"helm",{},cruiseTime);
 const offshore={x:mooring.x+22,z:mooring.z+18,yaw:1};
 await ask(ids[0],deck,"",{boat:offshore},cruiseTime+2100);
 assert.equal((await ask(ids[0],{...offshore,mode:"deck"},"release",{},cruiseTime+2200)).boat.helm,null);
 assert.equal((await ask(ids[1],{...offshore,mode:"deck"},"",{},cruiseTime+22000)).boat.x,offshore.x);
 assert.equal((await ask(ids[1],{...offshore,mode:"deck"},"helm",{},cruiseTime+22100)).boat.helm,ids[1]);
 assert.equal(tracks.reduce((n,t)=>n+t.length-1,loop.length-1),717);
 for(const line of tracks){
  let floor=line[0].h;
  for(const point of line){const step=parkStep(point,floor);assert(Number.isFinite(step)&&Math.abs(step-point.h)<.57);floor=step;}
 }
 const above=tracks[1][80];assert.equal(parkFloor(above,undefined),hillFloor(above));assert.equal(parkStep(above,undefined),null);
 assert.equal(ground(platformDoor),4.268);assert(ground({x:train.x,z:train.z+5.3})<2.3);
 assert(sideStreets.length>0&&inBounds(platformDoor));
 assert.equal(busAt(0,0).stop,"station");assert.equal(busAt(0,busTravel+busDwell+1).stop,"beach");assert.equal(busAt(0,busPeriod+1).stop,"station");
 assert(distance(busAt(0,3),station)<3&&distance(busAt(0,busTravel+busDwell+1),beachStop)<3&&routeLength>4000);
 assert.equal(ground(pavilion),2.25);assert(Number.isFinite(wave(dock.x,dock.z,400)));
 // A manual performance crossing a scheduled start gets its full ending.
 assert.equal(festivalDuration,180);
 const late=590000,end=late+festivalDuration*1000;
 assert.equal((await ask(ids[0],dock,"festival",{},late)).boat.festival,late);
 assert.equal((await ask(ids[1],dock,"festival",{},end-1)).boat.festival,late);
 assert.equal(showAge(end-1,late),179.999);
 assert.equal(showAge(end,late),-1);
 assert.equal((await ask(ids[1],dock,"festival",{},end)).boat.festival,end);
 assert.equal(showAge(1200000,end),0);
 assert.equal((await ask(ids[0],dock,"festival",{},1204000)).boat.festival,end);
 console.log("Pohang: road journey, sea heights, two guests, independent seats, shared grill, captain lease and synchronized festival passed.");
}finally{client.close();}
