import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {busAt,busSeatPose,nearBus} from "../public/bus-network.js";
import {BUS_COUNT as firstCoach,busLocalPose} from "../public/sejong-bus.js";
import {gyeongjuBusCycle,gyeongjuBusInterval,gyeongjuBusStops,gyeongjuBusTimes} from "../public/gyeongju-bus.js";
import {buildings,gyeongjuClear,gyeongjuRoute,places} from "../public/gyeongju-layout.js";
import {localGyeongju} from "../public/region-coordinates.js";

const epoch=Date.UTC(2026,0,1),berth=gyeongjuBusStops[0],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function inside(p,ring){
 let hit=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)hit=!hit;
 }
 return hit;
}
assert(gyeongjuBusInterval>12000&&gyeongjuBusInterval<=42000);
const arrivals=new Map();
for(let t=epoch;t<epoch+gyeongjuBusCycle;t+=250){
 const bus=busAt(firstCoach,t),later=busAt(firstCoach,t+250);
 assert(distance(bus,later)<4.5,"route jumps across a road");
 if(bus.stopId&&!arrivals.has(bus.stopId))arrivals.set(bus.stopId,t);
 for(const side of [-1.28,1.28])for(const nose of [-5.33,0,5.33]){
  const corner=localGyeongju(busLocalPose(bus,side,nose));
  assert(!buildings.some(b=>inside(corner,b.points)),"coach body clips a building");
 }
}
assert.equal(arrivals.size,gyeongjuBusStops.length);
for(const stop of gyeongjuBusStops){
 const t=arrivals.get(stop.id)+300,board=localGyeongju(stop.board),exit=localGyeongju(stop.exit);
 assert(gyeongjuClear(board,exit)&&gyeongjuRoute(places.hwangnidan,board).length>0,stop.name);
 assert.equal(nearBus(stop.board,t)?.bus.index,firstCoach);
 assert(gyeongjuBusTimes(stop.id,t).departureMs>0);
 assert.equal(gyeongjuBusTimes(stop.id,t+12300).departureMs,null);
}

const room="a".repeat(32),key="f".repeat(32),ids=["1".repeat(32),"2".repeat(32)];
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client),view={pan:0,tilt:0,zoom:0};
let now=epoch+700;
const realNow=Date.now;
Date.now=()=>now;
async function sync(id,bus){
 const response=await api(new Request("http://localhost/api/room",{method:"POST",body:JSON.stringify({room,id,key,
  avatar:{x:berth.board.x,y:berth.board.y,heading:0},view,bus})}),{DB:db});
 const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));
 return data;
}
const board=seat=>({action:"board",seat,index:firstCoach}),leave={action:"exit",index:firstCoach};
const avatar=(state,id)=>state.walkers.find(p=>p.id===id).avatar;
try{
 await initializeDatabase(client);
 await getRoomWeather(db,now,async()=>new Response(null,{status:503}));
 await db.prepare("INSERT INTO rooms(id,code,created) VALUES(?,?,?)").bind(room,"HWANGNAM",now).all();
 for(const id of ids){
  await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)").bind(room,id,key,now).all();
  await sync(id);
 }
 const [a,b]=ids;
 assert.equal(avatar(await sync(a,board(0)),a).bus.seat,0);
 assert(!avatar(await sync(b,board(0)),b).bus);
 assert.equal(avatar(await sync(b,board(1)),b).bus.seat,1);
 const end=arrivals.get(gyeongjuBusStops[1].id)+1000;
 while(now+4000<end-4500){now+=4000;await sync(a);await sync(b);}
 now=end-4500;
 const moving=await sync(a,leave);
 assert(avatar(moving,a).bus);
 for(const [i,id] of ids.entries()){
  assert(distance(avatar(moving,id),busSeatPose(busAt(firstCoach,now),i))<.01);
 }
 now=end;
 for(const id of ids){
  const rider=avatar(await sync(id,leave),id);
  assert(!rider.bus);
  assert(distance(rider,gyeongjuBusStops[1].exit)<.05);
 }
}finally{Date.now=realNow;client.close();}
console.log("Gyeongju loop, walkable stops, coach-body clearance, two-player seating, moving positions and stop-only alighting passed.");
