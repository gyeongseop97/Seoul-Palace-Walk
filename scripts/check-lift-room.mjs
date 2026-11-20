import assert from "node:assert/strict";
import {createClient} from "@libsql/client";
import {adaptDatabase} from "../server/database.mjs";
import {roomLifts} from "../server/station-lifts.mjs";
import {mainLift as bank,airportLift,liftLanding} from "../public/station-levels.js";
import {liftPose} from "../public/lift-dispatch.js";

const client=createClient({url:"file::memory:"}),db=adaptDatabase(client);
const call=(id,floor)=>({id,action:"call",bank:bank.id,floor});
try{
  const now=100000,a=liftLanding(1),b=liftLanding(3);
  const first=call("a".repeat(32),1),second=call("b".repeat(32),3);
  const [r,s]=await Promise.all([roomLifts(db,"A",a,first,now),roomLifts(db,"A",b,second,now)]);
  assert(r.liftReply.ok&&s.liftReply.ok);
  const state=(await roomLifts(db,"A",a,null,now)).stationLifts.main;
  assert.equal(state.length,3);
  assert.deepEqual(state.slice(1).map(s=>s.floor).sort(),[1,3]);
  const duplicate=await roomLifts(db,"A",a,first,now+30000);
  assert.deepEqual(duplicate.stationLifts.main,state);
  const trip={id:"c".repeat(32),action:"select",floor:2,bank:bank.id};
  const time=state.at(-1).at+800;
  assert(!(await roomLifts(db,"A",a,trip,time)).liftReply.ok);
  const selected=await roomLifts(db,"A",bank.center,trip,time);
  assert.equal(selected.stationLifts.main.at(-1).floor,2);
  assert.equal(liftPose(bank,selected.stationLifts.main,time+86400000).floor,2);
  assert.deepEqual((await roomLifts(db,"B",a,null,time)).stationLifts,{});
  assert.equal(liftPose(airportLift,selected.stationLifts.airport,time).floor,-2);
  console.log("Concurrent calls, retries, floor selection, idle parking and room isolation passed");
}finally{client.close();}
