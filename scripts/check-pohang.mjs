import {helmStation,boardingSpot,deckToSea} from "../public/coast-vessel-layout.js";
import {voyageAt,inSailingArea} from "../public/coast-voyage.js";
import {coastPoint} from "../public/region-coordinates.js";
import {scooterHubs,canScoot} from "../public/coast-scooters.js";
import {festivalBooth} from "../public/pohang-festival-site.js";
import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {coastRequest} from "../server/pohang.mjs";
import {tracks,loop,landings,parkStep,parkFloor,hillFloor} from "../public/space-walk-layout.js";
import {station,stopById,busLine,train,platformDoor,sideStreets,inBounds,beachStop,busAt,busPeriod,busTravel,busDwell,routeLength,distance,dock,mooring,tables,pavilion,ground,wave,showAge,festivalDuration} from "../public/pohang-layout.js";
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client),room="e".repeat(32);
try{
 await initializeDatabase(client);
 const ids=["a","b"].map(c=>c.repeat(32)),key="f".repeat(32);
 for(const id of ids)await db.prepare("INSERT INTO walkers(room,id,updated,avatar,view,player_key,nickname,coat) VALUES(?,?,0,'{}','{}',?,?,123)").bind(room,id,key,id.slice(0,1)).all();
 const clock=300000;
 const ask=async(id,pose,action="",extra={},time=clock)=>{const r=await coastRequest(db,{room,id,key,coast:{pose:{...pose,mode:"walk",yaw:0,...pose},action,...extra}},time);assert.equal(r.status,200);return r.json();};
 assert.equal((await coastRequest(db,{room,id:ids[0],key:"wrong",coast:{}},clock)).status,403);
 for(const id of ids)await ask(id,tables[0],"sit",{table:0});
 const dining={...tables[0],mode:"table"};
 const called=await ask(ids[0],dining,"callTavern",{table:0});
 assert.equal(new Set(called.people.map(p=>p.seat)).size,2);
 assert.equal(called.tavernOrders[0].phase,"called");
 const order={table:0,called:clock,items:{soju:1,sashimi:2,grilledClam:1}};
 assert.equal((await ask(ids[0],dining,"orderTavern",order,clock+500)).tavernOrders[0].ordered,0);
 assert.equal((await ask(ids[0],dining,"orderTavern",order,clock+2700)).tavernOrders[0].phase,"cooking");
 const delivered=await ask(ids[1],dining,"",{},clock+11100);
 assert.deepEqual(["soju","sashimi","rawClams"].map(k=>delivered.tavernOrders[0][k]),[4,6,3]);
 const taste={kind:"sashimi",table:0,token:"abc1".repeat(8)};
 const bit=await ask(ids[1],dining,"taste",taste,clock+11200);
 assert.equal(bit.bite.kind,"sashimi");assert.equal(bit.tavernOrders[0].sashimi,5);
 assert.equal((await ask(ids[1],dining,"taste",taste,clock+11500)).tavernOrders[0].sashimi,5);
 assert.equal((await ask(ids[1],{...tables[1],mode:"table"},"taste",{...taste,table:1,token:"b".repeat(32)},clock+13400)).bite,null);
 const grill=await ask(ids[0],dining,"tavernGrill",{table:0},clock+12100);
 assert.equal(grill.tavernOrders[0].cookingClams,3);
 assert.equal((await ask(ids[1],dining,"",{},clock+19000)).tavernOrders[0].grilledClam,3);
 for(const id of ids)await ask(id,tables[0],"stand");
 const hub=scooterHubs[1],rider={...hub,mode:"scooter"};
 assert.equal((await ask(ids[0],dock,"rentScooter")).scooter,null);
 assert.equal((await ask(ids[0],hub,"rentScooter")).scooter.dock,hub.id);
 assert(canScoot(hub));
 const parking={...rider,z:rider.z+1};
 assert((await ask(ids[0],parking,"parkScooter")).scooter.parked);
 assert((await ask(ids[0],scooterHubs[0],"rentScooter")).scooter.parked);
 assert((await ask(ids[0],scooterHubs[0],"mountScooter")).scooter.parked);
 assert.equal((await ask(ids[0],hub,"mountScooter")).scooter.parked,null);
 assert.equal((await ask(ids[0],{...scooterHubs[0],mode:"scooter"},"returnScooter")).scooter,null);
 assert.equal((await ask(ids[1],hub,"rentScooter")).scooter.dock,hub.id);
 assert((await ask(ids[1],parking,"parkScooter")).scooter.parked);
 assert.equal((await ask(ids[1],hub,"",{},clock+600001)).scooter,null);
 const pilot=(ship,t)=>({...deckToSea(ship,helmStation,t,7.85),mode:"deck",floor:7.85});
 const deck=pilot({...mooring,yaw:0},clock);
 assert.equal((await ask(ids[0],{...deckToSea({...mooring,yaw:0},boardingSpot,clock),mode:"deck",floor:2.46},"helm")).boat.helm,null);
 assert.equal((await ask(ids[0],deck,"helm")).boat.helm,ids[0]);
 assert.equal((await ask(ids[1],deck,"helm")).boat.helm,ids[0]);
 const moved={x:mooring.x+5,z:mooring.z+3,yaw:.7};
 assert.equal((await ask(ids[0],deck,"",{boat:moved},clock+600)).boat.x,moved.x);
 assert.equal((await ask(ids[1],festivalBooth,"festival")).boat.festival,0);
 for(const id of ids)await db.prepare("UPDATE walkers SET avatar=? WHERE room=? AND id=?").bind(
   JSON.stringify({...coastPoint(festivalBooth),coast:{mode:"walk",board:false}}),room,id).all();
 assert.equal((await ask(ids[1],dock,"festival")).boat.festival,0);
 assert.equal((await ask(ids[1],{...festivalBooth,mode:"deck"},"festival")).boat.festival,0);
 assert.equal((await ask(ids[1],festivalBooth,"festival")).boat.festival,clock);
 assert.equal((await ask(ids[0],dock,"festival",{},clock+2000)).boat.festival,clock);
 const abandoned=await ask(ids[1],dock,"",{},clock+21000);assert.equal(abandoned.boat.helm,null);assert.equal(abandoned.boat.x,mooring.x);
 const atStation=busPeriod*1000+500,boarding=stopById("station");
 const first=await ask(ids[0],boarding,"board",{coach:0,seat:3},atStation);
 assert(first.busSeats.some(s=>s.seat===3&&s.id===ids[0]));
 const second=await ask(ids[1],boarding,"board",{coach:0,seat:3},atStation+10);
 assert(!second.busSeats.some(s=>s.id===ids[1]));
 assert((await ask(ids[1],boarding,"board",{coach:0,seat:5},atStation+20)).busSeats.some(s=>s.seat===5&&s.id===ids[1]));
 assert.equal((await ask(ids[0],boarding,"exitBus",{},atStation+50)).busSeats.length,1);
 const cruiseTime=clock+32000;
 await ask(ids[0],deck,"helm",{},cruiseTime);
 const offshore={x:mooring.x+22,z:mooring.z+18,yaw:1};
 await ask(ids[0],deck,"",{boat:offshore},cruiseTime+2100);
 assert.equal((await ask(ids[0],{...offshore,mode:"deck"},"release",{},cruiseTime+2200)).boat.helm,null);
 assert.equal((await ask(ids[1],{...offshore,mode:"deck"},"",{},cruiseTime+22000)).boat.x,offshore.x);
 const follow=await ask(ids[1],pilot(offshore,cruiseTime+22100),"helm",{},cruiseTime+22100);
 assert.equal(follow.boat.helm,ids[1]);
 const tRelease=cruiseTime+22900,v=7;
 let drift=(await ask(ids[1],pilot(offshore,tRelease),"release",{boat:{...offshore,speed:v}},tRelease)).boat;
 assert.equal(drift.voyage.kind,"drift");assert.equal(drift.speed,v);
 const midway=voyageAt(drift.voyage,tRelease+5000),rest=voyageAt(drift.voyage,tRelease+15000);
 assert(midway.speed>0&&midway.speed<v&&rest.done);assert(distance(rest,offshore)>10);
 const tTour=tRelease+16000;
 const tour=(await ask(ids[1],pilot(rest,tTour),"tour",{},tTour)).boat;
 assert.equal(tour.voyage.kind,"tour");assert.equal(tour.helm,null);
 const other=await ask(ids[0],pilot(tour,tTour+100),"tour",{},tTour+100);
 assert.equal(other.boat.voyage.started,tTour);
 let far=0,last=tour;
 for(let t=1;t<=1200;t++){last=voyageAt(tour.voyage,tTour+t*1000);assert(inSailingArea(last));far=Math.max(far,distance(last,mooring));if(last.done)break;}
 assert(far>450&&last.done&&distance(last,mooring)<.01);
 const resumeTime=tTour+40000,during=voyageAt(tour.voyage,resumeTime);
 const resumed=(await ask(ids[0],pilot(during,resumeTime),"helm",{},resumeTime)).boat;
 assert.equal(resumed.helm,ids[0]);assert.equal(resumed.voyage,null);assert(distance(during,resumed)<.01);
 await ask(ids[0],pilot(during,resumeTime+100),"",{boat:{...during,speed:6}},resumeTime+100);
 await ask(ids[0],pilot(during,resumeTime+150),"leave",{},resumeTime+150);
 const unpiloted=(await ask(ids[1],dock,"",{},resumeTime+1150)).boat;
 assert.equal(unpiloted.voyage.kind,"drift");assert(unpiloted.speed>0&&unpiloted.speed<6);
 assert.equal(tracks.reduce((n,t)=>n+t.length-1,loop.length-1),717);
 // Enter from the hill, change branches across both landings, and return to
 // the ground. Check the two directions at a walking and running stride.
 const [fork,turnaround]=landings;
 const circuit=[...tracks[0],fork,...tracks[1],turnaround,...tracks[2].toReversed(),fork,...tracks[0].toReversed()];
 for(const path of [circuit,circuit.toReversed()])for(const stride of [.16,.39]){
  let floor;
  for(let j=1;j<path.length;j++){
   const a=path[j-1],b=path[j],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/stride));
   for(let k=1;k<=n;k++){
    const t=k/n,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
    floor=parkStep(p,floor);
    assert(Number.isFinite(floor)&&Math.abs(floor-(a.h+(b.h-a.h)*t))<.57,"Continuous stair walk at "+JSON.stringify(p));
   }
  }
 }
 for(const d of landings){
  for(const dx of [-.8,.8])for(const dz of [-.9,.9])assert.equal(parkStep({x:d.x+dx,z:d.z+dz},d.h),d.h);
  assert.equal(parkStep(d,undefined),null);
 }
 for(const sign of [-1,1]){
  const gate={x:turnaround.x+sign*(turnaround.halfX+.34),z:turnaround.z};
  assert.equal(parkStep(gate,turnaround.h),null);
 }
 const above=tracks[1][80];assert.equal(parkFloor(above,undefined),hillFloor(above));assert.equal(parkStep(above,undefined),null);
 assert.equal(ground(platformDoor),4.268);assert(ground({x:train.x,z:train.z+5.3})<2.3);
 assert(sideStreets.length>0&&inBounds(platformDoor));
 assert.equal(busAt(0,0).stop,"station");assert.equal(busAt(0,busTravel+busDwell+1).stop,"beach");assert.equal(busAt(0,busPeriod+1).stop,"station");
 assert(distance(busAt(0,3),boarding.berth)<.05&&distance(busAt(0,busTravel+busDwell+1),stopById("beach").berth)<.05&&routeLength>4000);
 const city=busLine(5),cityStop=stopById(city.stops[0]);
 const clockCity=Math.ceil((atStation/1000+2)/city.period)*city.period*1000+1200;
 assert.equal((await ask(ids[0],boarding,"board",{coach:5,seat:1,stop:cityStop.id},clockCity)).busSeats.length,0);
 assert((await ask(ids[0],cityStop,"board",{coach:5,seat:1,stop:cityStop.id},clockCity)).busSeats.some(s=>s.coach===5&&s.seat===1));
 assert(ground(pavilion)>2.5);assert(Number.isFinite(wave(dock.x,dock.z,400)));
 // Only the designated booth can start a performance, including at the old scheduled time.
 assert.equal(festivalDuration,180);
 const late=590000,end=late+festivalDuration*1000;
 assert.equal((await ask(ids[0],festivalBooth,"festival",{},late)).boat.festival,late);
 assert.equal((await ask(ids[1],festivalBooth,"festival",{},end-1)).boat.festival,late);
 assert.equal(showAge(end-1,late),179.999);
 assert.equal(showAge(end,late),-1);
 assert.equal((await ask(ids[1],festivalBooth,"festival",{},end)).boat.festival,end);
 assert.equal(showAge(1200000,end),-1);
 assert.equal(showAge(1200000,0),-1);
 assert.equal((await ask(ids[0],dock,"festival",{},1204000)).boat.festival,end);
 console.log("Pohang: road journey, sea heights, two guests, independent seats, shared grill, captain lease and synchronized festival passed.");
}finally{client.close();}
