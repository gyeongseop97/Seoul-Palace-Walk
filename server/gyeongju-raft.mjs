import {RAFT_INDEX} from "../public/bus-network.js";
import {takeRaftHelm,driveRaft,releaseRaft,moorRaft,liveRaftState} from "../public/gyeongju-raft-navigation.js";

const axis=n=>Number.isFinite(n)&&n>=-1&&n<=1;
export function validRaftCommand(cmd){
  if(cmd?.action==="take")return true;
  if(!/^[0-9a-f]{32}$/.test(cmd?.lease??""))return false;
  if(cmd.action==="drive")return Number.isSafeInteger(cmd.seq)&&cmd.seq>0&&axis(cmd.throttle)&&axis(cmd.turn);
  return cmd.action==="release"||cmd.action==="moor";
}
export async function readRaft(db,room){
  const {results}=await db.prepare("SELECT state FROM gyeongju_rafts WHERE room=?").bind(room).all();
  return results[0]?.state??null;
}
function resolved(saved,now){
  const current=liveRaftState(saved,now);
  return current!==saved&&saved.released?{...current,released:saved.released}:current;
}
export const currentRaft=(raw,now)=>raw?resolved(JSON.parse(raw),now):null;
export async function settleRaft(db,room,raw,now){
  if(!raw)return null;
  const saved=JSON.parse(raw),current=resolved(saved,now);
  // Once a disconnected pilot's raft has returned, keep only its new timetable.
  if(current!==saved)await db.prepare("UPDATE gyeongju_rafts SET state=? WHERE room=? AND state=?")
    .bind(JSON.stringify(current),room,raw).all();
  return current;
}
// Changing leaseUntil sets the exact instant at which the shared navigation returns to port.
// When alighting, only do this if the preceding transport operation actually freed the seat.
export function dropRaftHelm(db,room,id,key,now,afterExit=false){
  return db.prepare(`UPDATE gyeongju_rafts SET state=json_set(state,'$.leaseUntil',max(?,json_extract(state,'$.at')))
    WHERE room=? AND json_extract(state,'$.mode')='manual' AND json_extract(state,'$.pilot')=?
    AND json_extract(state,'$.leaseUntil')>? AND EXISTS (
      SELECT 1 FROM walkers w WHERE w.room=gyeongju_rafts.room AND w.id=? AND w.player_key=?
      ${afterExit?"AND json_extract(w.avatar,'$.bus.index') IS NOT ?":""}
    )`).bind(now,room,id,now,id,key,...(afterExit?[RAFT_INDEX]:[]));
}
function nextCommand(state,cmd,id,now){
  if(cmd.action==="take"){
    if(state?.mode==="manual")return {result:state.pilot===id?"taken":"occupied"};
    return {result:"taken",next:{...takeRaftHelm(state,now,id),lease:crypto.randomUUID().replaceAll("-","")}};
  }
  if(cmd.action==="release"&&state?.released?.pilot===id&&state.released.lease===cmd.lease)return {result:"released"};
  if(state?.mode!=="manual"||state.pilot!==id||state.lease!==cmd.lease)return {result:"unavailable"};
  if(cmd.action==="release")return {result:"released",next:{...releaseRaft(state,now),released:{pilot:id,lease:cmd.lease}}};
  if(cmd.action==="moor"){
    if(state.stopId||state.waypoints)return {result:"moored"};
    const next=moorRaft(state,now);
    return next?{result:"moored",next:{...next,lease:state.lease}}:{result:"unavailable"};
  }
  if(cmd.seq<=state.seq)return {result:cmd.seq===state.seq&&cmd.throttle===state.throttle&&cmd.turn===state.turn?"driven":"unavailable"};
  const next=driveRaft(state,now,cmd);
  return next?{result:"driven",next:{...next,lease:state.lease}}:{result:"unavailable"};
}

export async function applyRaftCommand(db,{room,id,key,now,active,cmd,raw,seated,refresh}){
  let state=currentRaft(raw,now);
  if(!seated)return {raft:state,raftResult:"unavailable"};
  // Compare the exact row used to integrate the pose. A second server may have just
  // accepted a different driver, expired a seat, or received a newer control packet.
  for(let attempt=0;attempt<3;attempt++){
    const {result,next}=nextCommand(state,cmd,id,Math.max(now,state?.at??0));
    if(!next)return {raft:state,raftResult:result};
    const encoded=JSON.stringify(next);
    const save=db.prepare(`INSERT INTO gyeongju_rafts(room,state) SELECT ?,? WHERE EXISTS (
        SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=? AND json_extract(avatar,'$.bus.index')=?
      ) ON CONFLICT(room) DO UPDATE SET state=excluded.state WHERE gyeongju_rafts.state IS ? RETURNING room`)
      .bind(room,encoded,room,id,key,active,RAFT_INDEX,raw);
    const statements=[save];
    if(refresh)statements.push(db.prepare(`UPDATE walkers SET updated=max(updated,?) WHERE room=? AND id=? AND player_key=? AND updated>=?
      AND json_extract(avatar,'$.bus.index')=? AND EXISTS(SELECT 1 FROM gyeongju_rafts WHERE room=? AND state=?)`)
      .bind(now,room,id,key,active,RAFT_INDEX,room,encoded));
    const [saved]=await db.batch(statements);
    if(saved.results.length)return {raft:next,raftResult:result};
    const latest=await readRaft(db,room);
    if(latest===raw)break;
    raw=latest;
    state=currentRaft(raw,now);
  }
  return {raft:state,raftResult:"unavailable"};
}
