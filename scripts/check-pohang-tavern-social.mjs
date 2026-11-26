import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {createCoastPlay} from "../public/coast-play.js";
import {nearestTavernSeat,tavernSeatSpot} from "../public/coast-tavern-layout.js";
import {coastPoint,seaPoint} from "../public/region-coordinates.js";
import {canClink,clinkReach} from "../public/social-events.js";

const room="1".repeat(32),key="f".repeat(32),guests=["a","b","c","d"].map(c=>c.repeat(32));
const [alice,bob,carol,dan]=guests,view={pan:0,tilt:0,zoom:0};
const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
let now=Date.UTC(2026,0,1),sequence=0;
const realNow=Date.now;
Date.now=()=>now;
function atDistance(a,b,distance){
 const dx=b.x-a.x,dy=b.y-a.y,scale=distance/Math.hypot(dx,dy);
 return {x:a.x+dx*scale,y:a.y+dy*scale};
}
const eventId=()=>(++sequence).toString(16).padStart(32,"0");
const item=kind=>({kind,remaining:1,started:0});
const spot=id=>tavernSeatSpot(Math.floor(id/4),id%4);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const avatars=new Map(),pending=[],notices=new Map(),orderForms=new Map();
async function send(body){
 const response=await api(new Request("http://localhost/api/room",{method:"POST",body:JSON.stringify(body)}),{DB:db});
 const data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));
 return data;
}
const sync=(id,clink)=>send({room,id,key,avatar:avatars.get(id),view,clink});
const harbor=(id,point,mode,action,extra={})=>send({room,id,key,coast:{pose:{...point,yaw:0,mode},action,...extra}});
const sit=(id,stool)=>harbor(id,spot(stool),"walk","sit",{table:Math.floor(stool/4),seat:stool%4});
const stand=id=>harbor(id,seaPoint(avatars.get(id)),"table","stand");
const poll=async(...games)=>{
 for(const game of games)game.tick(0,[0,0]);
 await Promise.all(pending.splice(0));await new Promise(setImmediate);
};
function game(id,stool){
 const me={...coastPoint(spot(stool)),heading:0,coast:{mode:"walk",board:false},item:item("cheese"),secondItem:item("yakgwa")};
 avatars.set(id,me);
 const visitor={room,id,key},noop=()=>{};
 return createCoastPlay({me,visit:()=>visitor,now:()=>now,changed:noop,reset:noop,notice:text=>notices.set(id,text),
  chooseOrder:submit=>orderForms.set(id,submit),canReceiveFood:()=>false,
  request:(_,body)=>{const result=send(body).then(data=>Response.json(data));pending.push(result);return result;}});
}
async function serveBottle(id,stool){
 const table=Math.floor(stool/4),called=now;
 await harbor(id,spot(stool),"table","callTavern",{table});
 now+=2650;
 const order=await harbor(id,spot(stool),"table","orderTavern",{table,called,items:{soju:1}});
 assert.equal(order.tavernOrders.find(o=>o.spot===table).phase,"cooking");
 now+=8210;
}
async function invite(expected){
 await sync(bob);
 const id=eventId(),result=await sync(alice,{id,action:"invite",target:bob});
 assert.equal(result.social.clink,expected);
 return id;
}
async function accept(id,expected){
 const result=await sync(bob,{id,action:"accept"});
 assert.equal(result.social.clink,expected);
 if(expected==="accepted"){
  const mine=result.clinks.find(c=>c.id===id),peer=(await sync(alice)).clinks.find(c=>c.id===id);
  assert(mine.startedAt>0&&mine.endsAt>mine.startedAt);assert.deepEqual(peer,mine);
  now+=3000;
 }
}
try{
 await initializeDatabase(client);
 await getRoomWeather(db,now,async()=>new Response(null,{status:503}));
 await db.prepare("INSERT INTO rooms(id,code,created) VALUES(?,?,?)").bind(room,"TAVERN01",now).all();
 for(const id of guests)await db.prepare("INSERT INTO walkers(room,id,player_key,avatar,view,updated) VALUES(?,?,?,'{}','{}',?)").bind(room,id,key,now).all();
 const a=game(alice,0),b=game(bob,2),ma=avatars.get(alice),mb=avatars.get(bob);
 for(const [id,stool] of [[alice,0],[bob,2]]){
  const placed=await sit(id,stool);assert.equal(placed.people.find(p=>p.id===id).seat,stool);
 }
 const contested=await Promise.all([sit(carol,1),sit(dan,1)]);
 const snapshot=await harbor(alice,spot(0),"table");
 assert.deepEqual(snapshot.tavernSeats.toSorted((a,b)=>a-b),[0,1,2]);
 assert.equal(snapshot.people.filter(p=>[carol,dan].includes(p.id)&&p.seat===1).length,1);
 assert.equal(contested.filter((reply,i)=>reply.people.find(p=>p.id===[carol,dan][i]).seat===1).length,1);
 assert.equal(nearestTavernSeat(spot(3),new Set(snapshot.tavernSeats)).id,3);
 await poll(a,b);
 assert.equal(ma.coast.seat,0);assert.equal(mb.coast.seat,2);
 assert(!canClink(ma,now));await invite("unavailable");

 const ring=game=>{assert(game.menu().actions.has("bell"));game.trigger("bell");};
 ring(a);await poll(a);
 const call=a.tavernOrders[0].called;
 ring(a);assert.match(notices.get(alice),/갈게요/);
 now+=2700;await poll(a,b);
 assert(b.menu().actions.has("order"));ring(b);
 orderForms.get(bob)({soju:1,sashimi:1,grilledClam:1});await poll(b);
 assert.equal(b.tavernOrders[0].phase,"cooking");ring(b);assert.match(notices.get(bob),/준비/);
 now+=5300;await poll(a);ring(a);assert.match(notices.get(alice),/나갑니다/);
 now+=3000;await poll(a,b);
 for(const diner of [a,b]){
  const actions=diner.menu().actions;
  for(const id of ["bell","grill","drink","fish","stand"])assert(actions.has(id),id);
 }
 assert.equal(a.tavernOrders[0].called,call);
 const {soju,sashimi,rawClams}=a.tavernOrders[0];assert.deepEqual([soju,sashimi,rawClams],[4,3,3]);
 for(const avatar of [ma,mb]){
  assert.equal(avatar.coast.tableGlass,true);assert(canClink(avatar,now));
  assert.deepEqual([avatar.item,avatar.secondItem],[item("cheese"),item("yakgwa")]);
 }
 const portion={table:0,kind:"soju",token:eventId()};
 const sip=await harbor(alice,spot(0),"table","taste",portion);
 const retry=await harbor(alice,spot(0),"table","taste",portion);
 assert.deepEqual(sip.bite,retry.bite);assert.equal(sip.bite.token,portion.token);
 assert.equal(sip.tavernOrders[0].soju,3);assert.equal(retry.tavernOrders[0].soju,3);

 assert.equal(distance(ma,mb),distance(coastPoint(spot(0)),coastPoint(spot(2))));assert(distance(ma,mb)<clinkReach(ma,mb));
 await accept(await invite("invited"),"accepted");
 // Older room snapshots can still carry the original, wider stool positions.
 Object.assign(mb,atDistance(ma,mb,1.98));await accept(await invite("invited"),"accepted");
 await stand(bob);await sit(bob,3);await poll(b);
 assert.equal(mb.coast.seat,3);assert.equal(distance(ma,mb),distance(coastPoint(spot(0)),coastPoint(spot(3))));
 await accept(await invite("invited"),"accepted");
 Object.assign(mb,atDistance(ma,mb,2.1833));await accept(await invite("invited"),"accepted");
 const interrupted=await invite("invited");
 await stand(bob);await poll(b);
 assert.equal(mb.coast.mode,"walk");assert.equal(mb.coast.tableGlass,undefined);
 assert(!b.menu().actions.has("bell"));
 await accept(interrupted,"unavailable");
 await sync(alice,{id:interrupted,action:"cancel"});

 await stand(alice);await sit(alice,2);await sit(bob,4);
 await serveBottle(bob,4);await poll(a,b);
 assert.equal(ma.coast.seat,2);assert.equal(mb.coast.seat,4);assert.equal(mb.coast.tableGlass,true);
 Object.assign(mb,atDistance(ma,mb,2.14));assert.equal(clinkReach(ma,mb),0);await invite("unavailable");
 await stand(alice);await stand(bob);
 for(const [id,x] of [[alice,500],[bob,501.5]])avatars.set(id,{x,y:200,item:item("coffee")});
 await invite("unavailable");
 avatars.get(bob).x=501.2;
 await accept(await invite("invited"),"accepted");
 console.log("Explicit seats, simultaneous reservations, table glasses with full hands, idempotent servings, opposite/diagonal toasts, standing, different tables and normal drink reach passed.");
}finally{Date.now=realNow;client.close();}
