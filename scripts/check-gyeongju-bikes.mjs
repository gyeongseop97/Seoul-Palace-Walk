import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {gyeongjuBikeDocks} from "../public/gyeongju-bike.js";
import {registerGyeongju,enteringBikeInterior} from "../public/gyeongju-region.js";
import {marketRooms} from "../public/gyeongju-market.js";
import {cheonmaPoint} from "../public/daereungwon.js";
import {observatoryApproach,chamberEntry} from "../public/gyeongju-observatory.js";
import {gyeongjuPoint,localGyeongju} from "../public/region-coordinates.js";
import {gyeongjuWalkable,gyeongjuRoute} from "../public/gyeongju-layout.js";
import {bikePassengerPose,nearBikeDock} from "../public/sejong-bike.js";
import {canRideBikeSegment} from "../public/bike-movement.js";

registerGyeongju();
const interiors=[[observatoryApproach,chamberEntry],[cheonmaPoint(0,29),cheonmaPoint(0,27)],
 ...marketRooms.map(room=>[room.entry,room.fit.point(0,room.depth/2-.4)])];
for(const [door,inside] of interiors){
 assert(enteringBikeInterior(gyeongjuPoint(door),gyeongjuPoint(inside)));
 assert(!enteringBikeInterior(gyeongjuPoint(inside),gyeongjuPoint(door)));
}
for(const from of gyeongjuBikeDocks){
 assert.equal(gyeongjuWalkable(localGyeongju(from)),false);
 assert.equal(nearBikeDock(from.access,to=>canRideBikeSegment(from.access,to))?.id,from.id);
 for(const to of gyeongjuBikeDocks){
  if(from===to)continue;
  const legs=gyeongjuRoute(localGyeongju(from.access),localGyeongju(to.access));
  assert(legs.length,from.name+" → "+to.name);
  let point=from.access;
  for(const leg of legs){
   const next=gyeongjuPoint(leg);
   assert(canRideBikeSegment(point,next),from.name+" → "+to.name+" "+JSON.stringify(leg));
   point=next;
  }
  assert(Math.hypot(to.access.x-point.x,to.access.y-point.y)<.01);
 }
}

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
try{
 await initializeDatabase(client);
 await getRoomWeather(db,Date.now(),async()=>new Response(null,{status:503}));
 const view={pan:0,tilt:0,zoom:0},driver={id:"a".repeat(32),key:"1".repeat(32)},guest={id:"b".repeat(32),key:"2".repeat(32)};
 const [from,,mid,to]=gyeongjuBikeDocks;
 const start={...from.access,heading:47},finish={...to.access,heading:281};
 async function post(path,body){
  const reply=await api(new Request("http://localhost/api/"+path,{method:"POST",body:JSON.stringify(body)}),{DB:db});
  const result=await reply.json();assert.equal(reply.status,200,JSON.stringify(result));return result;
 }
 const {room,code}=await post("rooms",{...driver,view,avatar:start,action:"create",nickname:"자전거 점검"});
 await post("rooms",{...guest,view,avatar:start,action:"join",code,nickname:"동승 점검"});
 const sync=(user,avatar,bike)=>post("room",{room,...user,avatar,view,bike});
 const member=(data,user)=>data.walkers.find(p=>p.id===user.id).avatar;
 assert.equal((await sync(driver,start,{action:"take",dock:to.id})).transport.bike,"unavailable");
 assert.equal((await sync(driver,start,{action:"take",dock:from.id})).transport.bike,"taken");
 const offer="c".repeat(32);
 assert.equal((await sync(guest,start,{action:"requestRide",id:offer,driver:driver.id})).transport.bike,"requested");
 const accepted=await sync(driver,start,{action:"acceptRide",id:offer});
 assert.equal(accepted.transport.bike,"accepted");
 assert.equal(member(accepted,guest).bikeRide.driver,driver.id);
 const stop={...mid.access,heading:17},parked=await sync(driver,stop,{action:"park"});
 assert.equal(parked.transport.bike,"parked");
 assert.equal(member(parked,guest).bikeRide,undefined);
 const rear=bikePassengerPose(stop),passenger=member(parked,guest);
 assert(Math.hypot(passenger.x-rear.x,passenger.y-rear.y)<.01,"passenger steps down in Gyeongju");
 assert.equal((await sync(driver,stop,{action:"mount"})).transport.bike,"mounted");
 const returned=await sync(driver,finish,{action:"return",dock:to.id});
 assert.equal(returned.transport.bike,"returned");assert.equal(member(returned,driver).bike,undefined);
 console.log("Gyeongju: all four Tasilra docks are connected; room rental, rear-seat consent, parking, remounting and return at another rack passed.");
}finally{client.close();}
