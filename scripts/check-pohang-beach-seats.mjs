import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {beachBenches,beachParasols} from "../public/coast-beach-seats.js";
import {cafeBenches,cafeDoor,cafeGround,cafeRoof,cafeStep,cafeLevel,cafePoint} from "../public/coast-cafe.js";
import {cafeAddressPoint,cafeFace} from "../public/pohang-cafe-site.js";
import {seaPoint} from "../public/region-coordinates.js";
import {coastWalkable} from "../public/coast-region.js";
import {ground,inWater} from "../public/pohang-layout.js";

for(const [index,bench] of beachBenches.entries()){
 const {chairs}=beachParasols[index];
 assert.equal(bench.slots.length,2);
 assert(Math.abs(chairs[0].z-chairs[1].z)>1);
 for(const [i,slot] of bench.slots.entries()){
  const p=seaPoint(slot),chair=chairs[i];
  assert(Math.hypot(p.x-chair.x,p.z-chair.z)<1e-9);
  assert(Math.abs(slot.top-ground(p)-.5)<1e-9);
  assert(coastWalkable(slot.approach.x,slot.approach.y)&&!inWater(seaPoint(slot.approach)));
 }
}
const surveyPin=cafePoint(0,-10.7);
assert(Math.abs(36.055-surveyPin.z/111020-cafeAddressPoint.lat)<1e-9);
assert(Math.abs(129.378+surveyPin.x/89950-cafeAddressPoint.lon)<1e-9);
assert(cafeFace.x>surveyPin.x&&cafeFace.z>surveyPin.z,"the glazing faces the cove across Haean-ro");
assert.equal(cafeBenches.length,6);
for(const bench of cafeBenches)for(const slot of bench.slots){
 const p=seaPoint(slot.approach);
 assert(coastWalkable(slot.approach.x,slot.approach.y));
 assert.equal(cafeLevel(p,slot.cafeFloor),slot.cafeFloor);
 assert.equal(slot.top,slot.cafeFloor+.49);
}
const route=[cafeDoor,cafePoint(0,-.8),cafePoint(16.5,-.8),cafePoint(16.5,-9.76),cafePoint(12,-9.76),cafePoint(12,-3.4)];
function traverseCafe(points,height){
 for(let j=1;j<points.length;j++){
  const a=points[j-1],b=points[j],n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.18);
  let prev=a;
  for(let i=1;i<=n;i++){
   const p={x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n};
   assert.notEqual(cafeStep(prev,p,height),false);
   height=cafeLevel(p,height)??cafeGround;prev=p;
  }
 }
 return height;
}
assert.equal(traverseCafe(route,cafeGround),cafeRoof);
assert.equal(traverseCafe(route.toReversed(),cafeRoof),cafeGround);
assert.equal(cafeStep(cafePoint(6,-.22),cafePoint(6,.60),cafeRoof),false);
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
try{
 await initializeDatabase(client);
 await getRoomWeather(db,Date.now(),async()=>new Response(null,{status:503}));
 const room="a".repeat(32),key="f".repeat(32);
 const ids=["b","c","d","e"].map(c=>c.repeat(32));
 await db.prepare("INSERT INTO rooms(id,code,created) VALUES(?,?,?)").bind(room,"BEACHT23",Date.now()).all();
 for(const id of ids)await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)")
  .bind(room,id,key,Date.now()).all();
 async function sit(i,seat,bench=beachBenches[0]){
  const slot=bench.slots[0];
  const spot=i===3?{x:105,y:130}:{...slot.approach,coast:{mode:"walk",board:false,cafeFloor:slot.cafeFloor}};
  const avatar={...spot,seat,seatSide:seat==null?null:0};
  const body={room,id:ids[i],key,view:{pan:0,zoom:0,tilt:0},avatar};
  const res=await api(new Request("http://localhost/api/room",{method:"POST",body:JSON.stringify(body)}),{DB:db});
  const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));
  return data.walkers.find(row=>row.id===ids[i]).avatar;
 }
 assert.equal((await sit(0,0)).seatSide,0);
 assert.equal((await sit(1,0)).seatSide,1);
 assert.equal((await sit(2,0)).seat,null);
 assert.equal((await sit(3,0)).seatSide,0,"the same seat index in Seoul is independent");
 await sit(0,null);
 assert.equal((await sit(2,0)).seatSide,0);
 for(const floor of [0,3]){
  const roomSeat=beachBenches.length+floor,bench=cafeBenches[floor];
  for(const i of [0,1,2])await sit(i,null,bench);
  assert.equal((await sit(0,roomSeat,bench)).seatSide,0);
  assert.equal((await sit(1,roomSeat,bench)).seatSide,1);
  assert.equal((await sit(2,roomSeat,bench)).seat,null,"full cafe table");
  await sit(0,null,bench);
  assert.equal((await sit(2,roomSeat,bench)).seatSide,0);
 }
 console.log("Verified parasols, cafe survey pin, window/roof seats, stairs, full tables, release and independence from Seoul.");
}finally{client.close();}
