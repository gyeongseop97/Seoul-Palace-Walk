import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createClient} from "@libsql/client";
import {initializeDatabase} from "../database/initialize.mjs";
import {adaptDatabase} from "../server/database.mjs";
import {getRoomWeather} from "../server/room-weather.mjs";
import {api} from "../room.mjs";
import {advanceCars,newRide,rideDefinitions} from "../public/amusement-session.js";

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
const token=()=>randomUUID().replaceAll("-","");
const view={pan:0,tilt:0,zoom:0},gate=kind=>rideDefinitions.get(kind).point;
async function send(endpoint,body,status=200){
  const response=await api(new Request("http://localhost/api/"+endpoint,{method:"POST",body:JSON.stringify(body)}),{DB:db});
  const data=await response.json();
  assert.equal(response.status,status,JSON.stringify(data));return data;
}
async function enter(nickname,code){
  const id=token(),key=token();
  const reply=await send("rooms",{action:code?"join":"create",code,nickname,id,key,avatar:gate("wheel"),view});
  return {room:reply.room,id,key,code:reply.code};
}
const act=(p,kind,command,spot=gate(kind))=>send("room",{...p,avatar:spot,view,amusement:{kind,...command}});
const join=()=>({action:"join",id:token()});
const leave=ticket=>({action:"leave",id:token(),ticket});
const look=p=>send("room",{...p,amusementWatch:true});
const realTime=Date.now;
let now=realTime();
Date.now=()=>now;
try{
  await initializeDatabase(client);
  await getRoomWeather(db,now,async()=>new Response(null,{status:503}));
  const a=await enter("여울"),b=await enter("마루",a.code),guest=await enter("봄",a.code),other=await enter("솔");
  for(const kind of ["wheel","viking","coaster","bumper"]){
    const one=join(),two=join();
    const pair=await Promise.all([act(a,kind,one),act(b,kind,two)]);
    assert(pair.every(reply=>reply.amusementResult==="ok"));
    const [ride]=(await look(guest)).amusementRides;
    assert.equal(pair[0].amusementRides[0].starts,pair[1].amusementRides[0].starts);
    assert.deepEqual(ride.riders.map(r=>r.seat).sort(),[0,1]);
    assert.deepEqual((await act(a,kind,one)).amusementRides[0].riders,ride.riders);
    assert.deepEqual((await send("room",{...other,avatar:gate(kind),view,amusementWatch:true})).amusementRides,[]);
    const late=join();now+=4600;
    assert.equal((await act(guest,kind,late)).amusementRides[0].starts,ride.starts);
    if(kind==="wheel"){
      const fourth=await enter("노을",a.code),fifth=await enter("하루",a.code);
      assert.equal((await act(fourth,kind,join())).amusementResult,"ok");
      assert.equal((await act(fifth,kind,join())).amusementResult,"full");
      await send("room",{...fourth,leave:true});
      assert.equal((await look(guest)).amusementRides[0].riders.length,3);
    }
    if(kind==="bumper"){
      const drive=(ticket,seq,steer=0)=>({action:"drive",id:token(),ticket,seq,throttle:1,steer});
      const carA=ride.riders.find(r=>r.id===a.id).seat,carB=ride.riders.find(r=>r.id===b.id).seat;
      assert.equal((await act(b,kind,drive(one.id,1))).amusementResult,"ended");
      await Promise.all([act(a,kind,drive(one.id,2)),act(b,kind,drive(two.id,1))]);
      await act(a,kind,drive(one.id,1,1));
      now+=700;
      const seen=(await look(guest)).amusementRides[0].cars;
      assert.deepEqual((await look(b)).amusementRides[0].cars,seen);
      assert.equal(seen[carA].steer,0);
      for(const i of [carA,carB])assert(Math.hypot(seen[i].vx,seen[i].vz)>1);
    }
    const exit=leave(one.id);
    await act(a,kind,exit);
    assert.equal((await act(a,kind,one)).amusementRides[0].riders.length,2);
    const rejoin=join();await act(a,kind,rejoin);
    await act(a,kind,exit);
    assert((await look(guest)).amusementRides[0].riders.some(r=>r.ticket===rejoin.id));
    now+=13000;
    assert.deepEqual((await send("room",{...guest,avatar:gate(kind),view,amusementWatch:true})).amusementRides[0].riders.map(r=>r.id),[guest.id]);
    await act(guest,kind,leave(late.id));
    assert.deepEqual((await look(guest)).amusementRides,[]);
  }
  assert.equal((await act(a,"wheel",join(),gate("coaster"))).amusementResult,"far");
  const session=newRide("bumper",now);
  session.riders=[{seat:0},{seat:1}];
  Object.assign(session.cars[0],{x:-.88,z:0,vx:4});
  Object.assign(session.cars[1],{x:.88,z:0,vx:-4});
  const copy=structuredClone(session);
  advanceCars(session,session.starts+40);
  assert(session.cars[0].vx<0&&session.cars[1].vx>0,"both occupied cars rebound");
  for(let t=40;t<=4000;t+=40)advanceCars(copy,copy.starts+t);
  advanceCars(session,session.starts+4000);
  assert.deepEqual(session.cars,copy.cars,"identical result at different rendering rates");
}finally{Date.now=realTime;client.close();}
console.log("Four shared rides passed: concurrent seating, late boarding, room isolation, full cabin, retry, disconnect and two-driver collision.");
