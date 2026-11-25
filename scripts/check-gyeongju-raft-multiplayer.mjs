import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {RAFT_INDEX,busAt,busSeatPose,busStopTimes,busesForRegion,nearBus} from "../public/bus-network.js";
import {RAFT_BOARD_REACH,RAFT_CYCLE_MS,RAFT_DWELL_MS,RAFT_SEATS,RAFT_TRAVEL_MS,raftStops} from "../public/gyeongju-raft-layout.js";

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
const view={pan:0,tilt:0,zoom:0},[north,south]=raftStops;
const board=seat=>({action:"board",index:RAFT_INDEX,seat}),exit={action:"exit",index:RAFT_INDEX};
const uniqueId=()=>randomUUID().replaceAll("-","");
const avatarOf=(state,player)=>state.walkers.find(w=>w.id===player.id)?.avatar;
function samePose(actual,expected){
  assert(actual);
  for(const key of ["x","y","heading"])assert(Math.abs(actual[key]-expected[key])<.001,key+" differs");
}
async function send(path,body,status=200){
  const response=await api(new Request("http://localhost/api/"+path,{method:"POST",body:JSON.stringify(body)}),{DB:db});
  const state=await response.json();
  assert.equal(response.status,status,JSON.stringify(state));
  return state;
}
async function enter(name,code){
  const id=uniqueId(),key=uniqueId();
  const reply=await send("rooms",{action:code?"join":"create",code,id,key,nickname:name,avatar:north.board,view});
  return {room:reply.room,id,key,code:reply.code};
}
const sync=(p,avatar,bus,status)=>send("room",{...p,avatar,view,bus},status);
const peek=p=>send("room",p);
const outcome=reply=>reply.transport.bus;

const realTime=Date.now;
let now=Date.UTC(2026,0,1);
for(let i=0;i<RAFT_CYCLE_MS;i+=100){
  const pose=busAt(RAFT_INDEX,now+i);
  if(pose.stopId===north.id&&pose.elapsed<200){now+=i;break;}
}
const start=now;
Date.now=()=>now;
try{
  await initializeDatabase(client);
  await getRoomWeather(db,now,async()=>new Response(null,{status:503}));
  assert.equal(nearBus(north.board,now)?.bus.index,RAFT_INDEX);
  assert(!busesForRegion(true,north.board).includes(RAFT_INDEX));
  assert.equal(busStopTimes(north.id,now).departureMs,RAFT_DWELL_MS);
  const away={...north.board,x:north.board.x-RAFT_BOARD_REACH-.1};
  assert.equal(nearBus(away,now),null);
  const first=await enter("가람"),second=await enter("나루",first.code),departing=await enter("하늘",first.code);
  await sync(first,north.board,board(RAFT_SEATS),400);
  assert.equal(outcome(await sync(first,away,board(0))),"unavailable");
  const races=await Promise.all([first,second].map(p=>sync(p,north.board,board(0))));
  assert.deepEqual(races.map(outcome).sort(),["boarded","occupied"]);
  const winner=races.findIndex(r=>outcome(r)==="boarded");
  const [riderA,riderB]=winner===0?[first,second]:[second,first];
  now+=750;
  assert.equal(outcome(await sync(riderB,north.board,board(1))),"boarded");
  assert.equal(outcome(await sync(departing,north.board,board(2))),"boarded");
  const spectator=await enter("물결",first.code);
  assert.equal(outcome(await sync(spectator,north.board,board(2))),"occupied");
  const otherRoom=await enter("버들");
  assert.equal(outcome(await sync(otherRoom,north.board,board(0))),"boarded");
  await send("room",{...departing,leave:true});
  const disconnected=await enter("모래",first.code);
  assert.equal(outcome(await sync(disconnected,north.board,board(2))),"boarded");

  async function travelTo(t){
    while(now<t){
      now=Math.min(now+4000,t);
      await sync(riderA,north.board);
      await sync(riderB,north.board);
    }
  }
  await travelTo(start+RAFT_DWELL_MS+RAFT_TRAVEL_MS/2);
  const moving=busAt(RAFT_INDEX,now);
  assert(moving.traveling);
  assert.equal(nearBus(north.board,now),null);
  assert.equal(outcome(await sync(spectator,north.board,board(2))),"unavailable");
  assert.equal(outcome(await sync(riderA,north.board,exit)),"unavailable");
  const seen=await peek(spectator);
  for(const [seat,p] of [riderA,riderB].entries()){
    assert.deepEqual(avatarOf(seen,p).bus,{index:RAFT_INDEX,seat});
    samePose(avatarOf(seen,p),busSeatPose(moving,seat));
  }
  assert.equal(avatarOf(seen,disconnected),undefined);
  await travelTo(start+RAFT_DWELL_MS+RAFT_TRAVEL_MS+100);
  assert.equal(nearBus(south.board,now)?.bus.index,RAFT_INDEX);
  assert.equal(nearBus(north.board,now),null);
  assert.equal(outcome(await sync(spectator,south.board,board(2))),"boarded");
  const stale={...busSeatPose(moving,2),bus:{index:RAFT_INDEX,seat:2}};
  const resumed=avatarOf(await sync(disconnected,stale),disconnected);
  assert(!resumed.bus);
  samePose(resumed,north.exit);
  assert.equal(avatarOf(await peek(spectator),spectator).bus.seat,2);
  for(const [seat,p] of [riderA,riderB].entries()){
    const packet={...busSeatPose(moving,seat),bus:{index:RAFT_INDEX,seat}};
    const result=await sync(p,packet,exit);
    assert.equal(outcome(result),"exited");
    assert(!avatarOf(result,p).bus);
    samePose(avatarOf(result,p),south.exit);
    samePose(avatarOf(await sync(p,packet,exit),p),south.exit);
    samePose(avatarOf(await sync(p,packet),p),south.exit);
  }
}finally{
  Date.now=realTime;
  client.close();
}
console.log("Raft multiplayer passed: three seats, atomic reservations, room isolation, pier-only boarding, moving passengers, dry-shore exits, retries and reconnection.");
