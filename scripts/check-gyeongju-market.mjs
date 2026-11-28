import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {api} from "../room.mjs";
import {diningServiceRoute,diningTrayPose} from "../public/dining-data.js";
import {gyeongjuWalkable,gyeongjuClear,gyeongjuRoute,places} from "../public/gyeongju-layout.js";
import {marketRooms,cityBenches,canyonDining,marketCounters,marketDining,marketDiningAt} from "../public/gyeongju-market.js";
import {gyeongjuPoint} from "../public/region-coordinates.js";
import {ITEMS} from "../public/activities.js";

for(const shop of marketRooms){
 const {fit}=shop;
 assert(gyeongjuRoute(shop.id==="pub"?places.woljeongNorth:places.hwangnidan,shop.entry).length,shop.name+" street approach");
 assert(gyeongjuClear(shop.entry,fit.order),shop.name+" counter");
 assert.equal(gyeongjuWalkable(fit.point(shop.width/2,0)),false,shop.name+" walls");
 for(const t of fit.tables)for(const seat of t.seats)assert(gyeongjuRoute(fit.order,seat.approach).length,shop.name+" chair");
 assert.equal(marketDiningAt(gyeongjuPoint(fit.order))===marketDining,shop.id==="restaurant");
}
for(const counter of marketCounters)for(const kind of counter.stock)assert(ITEMS[kind],kind);
const client=createClient({url:"file::memory:"}),DB=adaptDatabase(client);
const token=()=>randomUUID().replaceAll("-","");
const view={pan:0,tilt:0,zoom:0},player={id:token(),key:token(),nickname:"쌈밥 점검"},peer={id:token(),key:token(),nickname:"맞은편 손님"};
const originalClock=Date.now,originalFetch=globalThis.fetch;
let clock=Date.UTC(2026,1,8);
Date.now=()=>clock;
globalThis.fetch=async()=>Response.json({current:{time:clock/1000,weather_code:0,cloud_cover:0,precipitation:0,rain:0,snowfall:0}});
async function send(path,body){
 const response=await api(new Request("http://localhost/api/"+path,{method:"POST",body:JSON.stringify(body)}),{DB});
 const data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));return data;
}
try{
 await initializeDatabase(client);
 for(const venue of [marketDining,canyonDining]){
 const kind=venue.dishes[0].kind;
 const {room,code}=await send("rooms",{...player,view,action:"create",avatar:venue.menuPoint});
 await send("rooms",{...peer,view,action:"join",code,avatar:venue.menuPoint});
 const table=venue.benches[0],seat=cityBenches.indexOf(table),slot=table.slots[0];
 const sitting={...slot.approach,heading:slot.heading,seat,seatSide:0};
 const opposite={...table.slots[1].approach,heading:table.slots[1].heading,seat,seatSide:1};
 const call=async(p,avatar,action,kind)=>{
  const dining=action?{action,kind,request:token(),venue:venue.id}:undefined;
  return (await send("room",{room,...p,avatar,view,dining,diningVenue:venue.id})).dining;
 };
 assert.equal((await call(player,{...sitting,seat:0},"bell")).result,"unavailable");
 let ticket=(await call(player,sitting,"bell")).self;
 assert.equal(ticket.phase,"summoned");assert.equal(ticket.table.index,0);
 assert(diningServiceRoute(ticket.table,venue).length>0);
 const waiting=await call(peer,opposite,"bell");
 assert.equal(waiting.self.phase,"queued");assert.equal(waiting.tickets.length,2);
 clock=ticket.phaseUntil+1;ticket=(await call(player,sitting)).self;
 assert.equal(ticket.phase,"ordering");ticket=(await call(player,sitting,"order",kind)).self;
 for(const phase of ["cooking","serving"]){
  assert.equal(ticket.phase,phase);clock=ticket.phaseUntil+1;ticket=(await call(player,sitting)).self;
 }
 assert.equal(ticket.phase,"served");assert.deepEqual(diningTrayPose(ticket.table),slot.tray);
 assert.equal((await call(peer,opposite)).tickets.find(t=>t.player===player.id).phase,"served");
 for(let n=ITEMS[kind].uses-1;n>=0;n--){
  const eaten=await call(player,sitting,"bite");assert.equal(eaten.self.remaining,n);clock+=ITEMS[kind].duration+1;
 }
 }
 console.log("Both restaurants served. Four walk-in Gyeongju shop approaches, counter and seat clearance, shared table bell, serving, tray placement, opposite seats and all bites passed.");
}finally{Date.now=originalClock;globalThis.fetch=originalFetch;client.close();}
