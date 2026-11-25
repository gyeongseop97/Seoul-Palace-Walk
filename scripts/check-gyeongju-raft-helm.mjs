import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {RAFT_INDEX} from "../public/bus-network.js";
import {raftStops,raftSeatAtPose} from "../public/gyeongju-raft-layout.js";
import {RAFT_LEASE_MS,raftPoseAt} from "../public/gyeongju-raft-navigation.js";

const client=createClient({url:"file::memory:"}),DB=adaptDatabase(client);
const epoch=Date.UTC(2026,0,1),pier=raftStops[0],view={pan:0,tilt:0,zoom:0};
const token=()=>randomUUID().replaceAll("-","");
const oldClock=Date.now;
let now=epoch+1000;
Date.now=()=>now;
async function post(path,body,status=200){
  const response=await api(new Request("http://localhost/api/"+path,{method:"POST",body:JSON.stringify(body)}),{DB});
  const data=await response.json();
  assert.equal(response.status,status,JSON.stringify(data));
  return data;
}
async function enter(name,code){
  const player={id:token(),key:token()};
  const room=await post("rooms",{...player,nickname:name,action:code?"join":"create",code,avatar:pier.board,view});
  return {...player,room:room.room,code:room.code};
}
const sync=(p,body={},status=200)=>post("room",{...p,raftWatch:true,...body},status);
const board=(p,seat)=>sync(p,{avatar:pier.board,view,bus:{action:"board",index:RAFT_INDEX,seat}});
const exit=p=>sync(p,{avatar:pier.board,view,bus:{action:"exit",index:RAFT_INDEX}});
const helm=(p,action,lease,controls={})=>sync(p,{raft:{action,lease,...controls}});
const drive=(p,lease,seq,throttle,turn)=>helm(p,"drive",lease,{seq,throttle,turn});
const avatar=(reply,p)=>reply.walkers.find(w=>w.id===p.id)?.avatar;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function posesMatch(reply,p){
  const a=avatar(reply,p),seat=raftSeatAtPose(raftPoseAt(reply.raft,now),a.bus.seat);
  assert(distance(a,seat)<.0001);
  assert(Math.abs(a.heading-seat.heading)<.001);
}
try{
  await initializeDatabase(client);
  await getRoomWeather(DB,now,async()=>new Response(null,{status:503}));
  const first=await enter("가람"),second=await enter("누리",first.code),third=await enter("다온",first.code);
  const independent=await enter("마루");
  assert.equal((await helm(third,"take")).raftResult,"unavailable");
  assert.equal((await board(first,1)).transport.bus,"boarded");
  assert.equal((await board(second,2)).transport.bus,"boarded");
  const claims=await Promise.all([first,second].map(p=>helm(p,"take")));
  assert.deepEqual(claims.map(r=>r.raftResult).sort(),["occupied","taken"]);
  const [pilot,mate]=claims[0].raftResult==="taken"?[first,second]:[second,first];
  const lease=claims.find(r=>r.raftResult==="taken").raft.lease;
  assert.equal((await helm(pilot,"take")).raft.lease,lease);
  assert.equal((await drive(mate,lease,1,1,0)).raftResult,"unavailable");
  await sync(pilot,{raft:{action:"drive",lease,seq:1,throttle:2,turn:0}},400);
  assert.equal((await sync(independent)).raft,null);

  // Keep a manually moored boat at port past its old scheduled departure.
  let seq=0;
  for(let i=0;i<5;i++){
    now+=3500;
    assert.equal((await drive(pilot,lease,++seq,0,0)).raftResult,"driven");
    await sync(mate,{avatar:pier.board,view});
    await sync(third,{avatar:pier.board,view});
  }
  assert(!raftPoseAt(null,now).stopId);
  assert.equal((await board(third,0)).transport.bus,"boarded");
  const before=raftPoseAt((await sync(third)).raft,now);
  assert.equal(before.stopId,pier.id);
  for(let i=0;i<4;i++){
    assert.equal((await drive(pilot,lease,++seq,1,.26)).raftResult,"driven");
    now+=1000;
  }
  const underway=await sync(mate);
  const pose=raftPoseAt(underway.raft,now);
  assert(pose.traveling&&distance(before,pose)>3);
  assert(Math.abs(pose.heading-before.heading)>1);
  for(const p of [pilot,mate,third])posesMatch(underway,p);
  assert.equal((await drive(pilot,lease,seq-1,-1,-1)).raftResult,"unavailable");
  assert.equal((await exit(pilot)).transport.bus,"unavailable");
  assert.equal((await exit(mate)).transport.bus,"unavailable");
  assert.equal((await helm(mate,"release",lease)).raftResult,"unavailable");
  const released=await helm(pilot,"release",lease);
  assert.equal(released.raftResult,"released");
  assert.equal(released.raft.mode,"return");
  assert.equal((await helm(pilot,"release",lease)).raftResult,"released");
  assert(distance(raftPoseAt(released.raft,now),pose)<.01);
  const retake=await helm(pilot,"take"),secondLease=retake.raft.lease;
  assert.equal(retake.raftResult,"taken");assert.notEqual(lease,secondLease);
  assert.equal((await helm(pilot,"release",lease)).raftResult,"unavailable");
  assert.equal((await drive(pilot,lease,100,1,0)).raftResult,"unavailable");
  now+=RAFT_LEASE_MS+20;
  const lost=await sync(mate);
  assert.equal(lost.raft.mode,"return");
  assert(!raftPoseAt(lost.raft,now).helm);
  const relief=await helm(mate,"take");
  assert.equal(relief.raftResult,"taken");
  assert.equal((await drive(pilot,secondLease,100,1,0)).raftResult,"unavailable");
  // An unrelated/wrong-key disconnect never releases the current helm.
  await post("room",{...mate,key:token(),leave:true});
  assert.equal((await sync(pilot)).raft.pilot,mate.id);
  await post("room",{...mate,leave:true});
  assert.equal((await sync(pilot)).raft.mode,"return");
  const back=await sync(pilot);
  now=Math.ceil(back.raft.arriveAt)+100;
  const docked=await sync(pilot,{avatar:pier.board,view});
  assert.equal(docked.raft.mode,"auto");
  assert(raftPoseAt(docked.raft,now).stopId);

  // A driver who steps off at a dock immediately frees the helm. The next passenger can take it.
  now=epoch+111000;
  const local=await enter("라온",independent.code),friend=await enter("새롬",independent.code);
  await board(local,0);await board(friend,2);
  const initial=await helm(local,"take");
  assert.equal(initial.raftResult,"taken");
  await drive(local,initial.raft.lease,1,.35,0);
  now+=900;
  const moored=await helm(local,"moor",initial.raft.lease);
  assert.equal(moored.raftResult,"moored");
  const plan=moored.raft;
  assert.equal((await helm(local,"moor",initial.raft.lease)).raftResult,"moored");
  if(now<plan.arriveAt){
    assert.equal((await exit(friend)).transport.bus,"unavailable");
    now=Math.ceil(plan.arriveAt)+1;
  }
  const ashore=await exit(local);
  assert.equal(ashore.transport.bus,"exited");assert(distance(avatar(ashore,local),pier.exit)<.001);
  assert.notEqual(ashore.raft.mode,"manual");
  assert.equal((await helm(friend,"take")).raftResult,"taken");
}finally{Date.now=oldClock;client.close();}
console.log("Manual helm passed: shared claim, ordered controls, stale leases, room isolation, docking, all rider positions, return travel, timeout, departure and disconnect.");
