import {advanceCars,newRide,rideCapacity,rideDefinitions} from "../public/amusement-session.js";

const ready=new WeakMap();
const onlineMs=12000;
const validToken=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
export function validAmusement(command){
  if(!validToken(command?.id)||!rideDefinitions.has(command.kind))return false;
  if(command.action==="join")return true;
  if(!validToken(command.ticket))return false;
  return command.action==="leave"||command.action==="drive"&&command.kind==="bumper"&&
    [command.throttle,command.steer].every(value=>[-1,0,1].includes(value))&&Number.isSafeInteger(command.seq)&&command.seq>0;
}
export function ensureAmusement(db){
  if(!ready.has(db))ready.set(db,db.prepare(`CREATE TABLE IF NOT EXISTS room_amusement
    (room TEXT PRIMARY KEY, revision INTEGER NOT NULL, updated INTEGER NOT NULL, state TEXT NOT NULL)`).bind().all()
    .catch(error=>{ready.delete(db);throw error;}));
  return ready.get(db);
}
export const selectAmusement=(db,room)=>db.prepare("SELECT revision,state FROM room_amusement WHERE room=?").bind(room);
export const pruneAmusement=(db,now)=>db.prepare("DELETE FROM room_amusement WHERE updated<?").bind(now-86400000);

function atGate(actor,kind,now){
  if(!actor||actor.updated<now-onlineMs)return false;
  const avatar=JSON.parse(actor.avatar),point=rideDefinitions.get(kind).point;
  return Math.hypot(avatar.x-point.x,avatar.y-point.y)<=6&&!avatar.bus&&!avatar.bikeRide&&
    !(avatar.bike&&!avatar.bike.parked)&&avatar.seat==null&&!avatar.groundSit;
}
function settle(state,actors,now){
  let changed=false;
  state.rides=state.rides.filter(ride=>{
    if(ride.ends<=now){changed=true;return false;}
    advanceCars(ride,now);
    ride.riders=ride.riders.filter(rider=>{
      if(atGate(actors.get(rider.id),ride.kind,now))return true;
      changed=true;return false;
    });
    return ride.riders.length>0;
  });
  return changed;
}
function perform(state,id,actor,command,now){
  const {action,kind,ticket}=command;
  let ride=state.rides.find(entry=>entry.kind===kind);
  const rider=ride?.riders.find(person=>person.id===id);
  if(action==="drive"){
    if(!rider||rider.ticket!==ticket)return "ended";
    const car=ride.cars[rider.seat];
    if(command.seq>(rider.seq??0)){
      rider.seq=command.seq;
      Object.assign(car,{throttle:command.throttle,steer:command.steer,until:now+1900});
    }
    return "ok";
  }
  const receipt=state.receipts.find(receipt=>receipt.id===command.id&&receipt.player===id);
  if(receipt)return receipt.result;
  let result="ok";
  if(action==="leave"){
    if(rider?.ticket===ticket){
      ride.riders=ride.riders.filter(person=>person!==rider);
      if(!ride.riders.length)state.rides=state.rides.filter(entry=>entry!==ride);
    }
  }else if(!atGate(actor,kind,now))result="far";
  else if(rider||state.rides.some(entry=>entry.riders.some(person=>person.id===id)))result="already";
  else if(ride?.riders.length>=rideCapacity[kind])result="full";
  else{
    if(!ride){ride=newRide(kind,now);state.rides.push(ride);}
    const occupied=new Set(ride.riders.map(person=>person.seat));
    let seat=0;
    while(occupied.has(seat))seat++;
    ride.riders.push({id,nickname:actor.nickname||"동행",seat,ticket:command.id});
    if(ride.cars)Object.assign(ride.cars[seat],{throttle:0,steer:0,until:0});
  }
  state.receipts=state.receipts.filter(entry=>now-entry.at<120000).slice(-255);
  state.receipts.push({player:id,id:command.id,result,at:now});
  return result;
}
export async function roomAmusement(db,{room,id,key,command,row,rows}){
  for(let attempt=0;attempt<6;attempt++){
    const now=Date.now(),state=row?JSON.parse(row.state):{rides:[],receipts:[]};
    const actors=new Map(rows.map(actor=>[actor.id,actor]));
    const changed=settle(state,actors,now);
    const result=command?perform(state,id,actors.get(id),command,now):undefined;
    const reply={amusementRides:state.rides,amusementResult:result};
    if(!command&&!changed)return reply;
    const auth="EXISTS(SELECT 1 FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?)";
    const data=JSON.stringify(state),args=[room,id,key,now-onlineMs];
    const save=row?db.prepare(`UPDATE room_amusement SET revision=revision+1,updated=?,state=?
      WHERE room=? AND revision=? AND ${auth} RETURNING revision`).bind(now,data,room,row.revision,...args):
      db.prepare(`INSERT INTO room_amusement(room,revision,updated,state) SELECT ?,1,?,? WHERE ${auth}
        ON CONFLICT(room) DO NOTHING RETURNING revision`).bind(room,now,data,...args);
    if((await save.all()).results.length)return reply;
    const [latest,walkers]=await db.batch([selectAmusement(db,room),db.prepare(
      "SELECT id,nickname,avatar,updated FROM walkers WHERE room=? AND updated>=?").bind(room,now-onlineMs)]);
    row=latest.results[0];rows=walkers.results;
  }
  return {amusementResult:"busy"};
}
