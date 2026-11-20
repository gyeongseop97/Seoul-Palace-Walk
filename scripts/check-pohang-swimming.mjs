import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {swimStroke,swimwearOptions,breaststroke} from "../public/beach-swimming.js";
import {amenities,nearbyAmenity} from "../public/beach-amenities.js";
import {coastPoint} from "../public/region-coordinates.js";
import {coastObstacle,coastWalkable} from "../public/coast-region.js";
import {ground,inWater,shore} from "../public/pohang-layout.js";

for(const a of amenities){
 assert.equal(nearbyAmenity(a.entry,a.kind),a);
 const p=coastPoint(a.entry);assert(coastWalkable(p.x,p.y),a.name);
 assert(coastObstacle({x:a.x,z:a.z},2),a.name+" fixture is solid");
}
for(const z of [-470,-121,111]){
 const x=shore(z);
 assert(!inWater({x:x+2,z})&&inWater({x:x+9,z}));
 assert(Math.abs(ground({x:x+5,z})+.85)<1e-6);
}
const rot=()=>({set(x,y,z){this.x=x;this.y=y;this.z=z;}});
const limb=()=>({upper:{rotation:rot()},lower:{rotation:rot()},end:{rotation:rot()}});
const rig={body:{position:rot(),rotation:rot()},chest:{rotation:rot()},pelvis:{rotation:rot()},headJoint:{rotation:rot()},arms:[limb(),limb()],legs:[limb(),limb()],itemPivots:[],tray:{}};
for(let i=0;i<120;i++){
 breaststroke(rig,swimStroke(i/60,true));
 for(const pair of [rig.arms,rig.legs])for(const part of ["upper","lower","end"]){
  const a=pair[0][part].rotation,b=pair[1][part].rotation;
  assert.equal(a.x,b.x);assert(Math.abs(a.y+b.y)<1e-8&&Math.abs(a.z+b.z)<1e-8);
 }
}
assert(swimStroke(.49/.64,true).tuck>.9&&swimStroke(.88/.64,true).tuck<.05);
assert(swimStroke(.52/.64,true).breath>.95);assert(swimStroke(0,false).idle);

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
try{
 await initializeDatabase(client);
 await getRoomWeather(db,Date.now(),async()=>new Response(null,{status:503}));
 const room="a".repeat(32),key="f".repeat(32),ids=["b","c"].map(id=>id.repeat(32));
 await db.prepare("INSERT INTO rooms(id,code,created) VALUES(?,?,?)").bind(room,"SEASIDE3",Date.now()).all();
 for(const id of ids)await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)").bind(room,id,key,Date.now()).all();
 const look={hair:"short",eyes:"round",outfit:"coat"},coast={mode:"walk",board:false},pose=coastPoint(amenities[0].entry);
 async function post(id,state){
  const avatar={...pose,coast:state,look},view={tilt:0,pan:0,zoom:0};
  const response=await api(new Request("http://localhost/api/room",{method:"POST",body:JSON.stringify({room,id,key,avatar,view})}),{DB:db});
  assert.equal(response.status,200);return (await response.json()).walkers;
 }
 await post(ids[1],coast);
 for(const key of Object.keys(swimwearOptions)){
  await post(ids[0],{...coast,swimwear:key});
  const peer=(await post(ids[1],coast)).find(p=>p.id===ids[0]);
  assert.equal(peer.avatar.coast.swimwear,key);assert.equal(peer.avatar.look.outfit,"coat");
 }
 const rinse={site:"north-rinse",at:Date.now()};await post(ids[0],{...coast,rinse});
 const peer=(await post(ids[1],coast)).find(p=>p.id===ids[0]);
 assert.deepEqual(peer.avatar.coast.rinse,rinse);assert.equal(peer.avatar.coast.swimwear,undefined);assert.equal(peer.avatar.look.outfit,"coat");
 console.log("Symmetric breaststroke, frog kick, water depth, four facilities, three synchronized swimwear choices and restoration passed.");
}finally{client.close();}
