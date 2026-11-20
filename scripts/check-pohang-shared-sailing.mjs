import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {coastRequest} from "../server/pohang.mjs";
import {createCoastPlay} from "../public/coast-play.js";
import {createVesselTrack} from "../public/coast-vessel-motion.js";
import {inSailingArea,voyageAt} from "../public/coast-voyage.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {deckToSea,helmStation,boardingSpot,mainFloor} from "../public/coast-vessel-layout.js";
import {distance,shore} from "../public/pohang-layout.js";

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
const room="9".repeat(32),key="f".repeat(32),ids=["a","b","c"].map(c=>c.repeat(32));
const start=Date.UTC(2026,0,1),origin={x:shore(-260)+220,z:-260,yaw:3.05},events=[];
let clock=start;
const later=(ms,run)=>events.push({at:clock+ms,run});
const noop=()=>{};
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const stats=()=>({speeds:[],noise:0,lastSpeed:null,stalled:0});
function measure(s,v){
 if(s.lastSpeed!=null)s.noise+=Math.abs(v-s.lastSpeed);
 s.lastSpeed=v;s.speeds.push(v);if(v<3)s.stalled++;
}
function setup(index,point,mode,ups,downs){
 const visit={id:ids[index],room,key},me={...coastPoint(point),heading:0,coast:{mode,board:false}};
 let count=0;
 const view={pan:0,tilt:0};
 const play=createCoastPlay({me,visit:()=>visit,now:()=>clock,view:()=>view,changed:noop,reset:noop,notice:noop,
  request:(_,body)=>new Promise(resolve=>{
   const seq=count++;
   later(ups[seq%ups.length],async()=>{
    const reply=await coastRequest(db,body,clock);
    assert.equal(reply.status,200);
    later(downs[seq%downs.length],()=>resolve(reply));
   });
  })});
 return {play,me,view};
}
try{
 await initializeDatabase(client);
 for(const id of ids)await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)").bind(room,id,key,clock).all();
 const pose={...deckToSea(origin,helmStation,clock,7.85),mode:"deck",yaw:origin.yaw,floor:7.85};
 await coastRequest(db,{room,id:ids[0],key,coast:{pose}},clock);
 await db.prepare("UPDATE coast_harbor SET x=?,z=?,yaw=?,updated=? WHERE room=?").bind(origin.x,origin.z,origin.yaw,clock,room).all();
 const acquired=await (await coastRequest(db,{room,id:ids[0],key,coast:{pose,action:"helm"}},clock)).json();
 assert.equal(acquired.boat.helm,ids[0]);
 const driver=setup(0,pose,"deck",[80,120,35,160],[55,80,40]);
 const passenger=setup(1,deckToSea(origin,boardingSpot,clock,mainFloor),"deck",[50,120,75],[40,240,120,55,420]);
 const shoreGuest=setup(2,{x:shore(-260)-12,z:-260},"walk",[30,90,70],[160,50,70,350,180]);
 const old={...origin},smooth=stats(),oldStats=stats();
 let separation=0,maxYawStep=0,maxAnchorError=0,crossedPi=false,sampledAtDifferentTime=false,legacyReady=false;
 for(let ms=0;ms<=26000;ms+=20){
  clock=start+ms;
  for(const e of events.filter(e=>e.at<=clock)){
   events.splice(events.indexOf(e),1);await e.run();
  }
  await new Promise(setImmediate);
  const before={...shoreGuest.play.ship},oldBefore={...old};
  const steer=ms>=10800&&ms<14600?-.65:ms>=21000&&ms<22800?.60:0;
  driver.play.tick(.02,[steer,ms>=1600&&ms<3600?-1:0]);passenger.play.tick(.02,[0,0]);shoreGuest.play.tick(.02,[0,0]);
  const ship=shoreGuest.play.ship,boat=shoreGuest.play.boat,pass=passenger.play.ship;
  if(!boat.helm||!passenger.play.boat.helm)continue;
  sampledAtDifferentTime||=boat.sampleAt<boat.updated;
  crossedPi||=driver.play.ship.yaw< -2.8;
  // Recreate the previous observer for comparison under the very same packet deliveries.
  if(!legacyReady||distance(old,boat)>24)Object.assign(old,boat);
  legacyReady=true;
  const lead=Math.max(0,Math.min(.55,(clock-boat.updated)/1000))*boat.speed,ease=1-Math.exp(-.02*6);
  old.x+=(boat.x+Math.sin(boat.yaw)*lead-old.x)*ease;
  old.z+=(boat.z+Math.cos(boat.yaw)*lead-old.z)*ease;
  if(ms>=5500&&ms<=10200){
   measure(smooth,distance(before,ship)/.02);measure(oldStats,distance(oldBefore,old)/.02);
  }
  if(ms>=5500){
   assert(inSailingArea(ship));
   maxYawStep=Math.max(maxYawStep,Math.abs(turn(before.yaw,ship.yaw)));
   separation=Math.max(separation,distance(ship,pass));
   const s=passenger.me.coast,seat=deckToSea(pass,{x:s.deckX,z:s.deckZ},clock,s.floor);
   maxAnchorError=Math.max(maxAnchorError,distance(seat,seaPoint(passenger.me)));
  }
 }
 assert(crossedPi&&sampledAtDifferentTime);
 assert(smooth.noise<oldStats.noise*.6&&smooth.stalled===0);
 assert(maxYawStep<.035&&separation<3.5&&maxAnchorError<.002,JSON.stringify({maxYawStep,separation,maxAnchorError}));
 for(const departure of [{x:540,z:-110,yaw:1.1},{x:507,z:-155,yaw:1.2}])for(const kind of ["tour","return"]){
  const voyage={kind,ox:departure.x,oz:departure.z,angle:departure.yaw,started:start};
  let pose;
  for(let ms=0;ms<=1000000;ms+=200){
   pose=voyageAt(voyage,start+ms);assert(inSailingArea(pose),kind+" studio departure");
   if(pose.done)break;
  }
  assert(pose.done);
 }
 const track=createVesselTrack();
 track.record({...origin,speed:10,updated:start,helm:ids[0]});
 track.record({...origin,x:origin.x+1,updated:start-200,speed:16,helm:ids[0]});
 const outage=track.at(start+3000);
 assert.equal(outage.speed,0);assert(distance(outage,track.at(start+10000))<.001);
 const range=s=>[.10,.90].map(q=>s.speeds.toSorted((a,b)=>a-b)[Math.floor(q*s.speeds.length)].toFixed(1)).join("–");
 console.log(`Shared helm through delayed packets: 10th–90th percentile speed ${range(oldStats)} to ${range(smooth)} m/s, largest observer difference ${separation.toFixed(2)} m, deck lock error ${maxAnchorError.toFixed(4)} m.`);
}finally{client.close();}
