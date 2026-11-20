import {nearScooterHub,scooterParkTime,canScoot} from "../public/coast-scooters.js";

export const scooterSchema="CREATE TABLE IF NOT EXISTS coast_scooters(room TEXT,id TEXT,dock TEXT,x REAL,z REAL,heading REAL,parked INTEGER DEFAULT 0,PRIMARY KEY(room,id))";
export function scooterOps(read,room,id,p,cmd,now){
 const key=[room,id],hub=nearScooterHub(p),ops=[];
 ops.push(read("DELETE FROM coast_scooters WHERE room=? AND id=? AND parked>0 AND parked<=?",...key,now-scooterParkTime));
 if(cmd==="rentScooter"&&p.mode==="walk"&&hub){
  ops.push(read("INSERT OR IGNORE INTO coast_scooters(room,id,dock) VALUES(?,?,?)",...key,hub.id));
 }else if(cmd==="returnScooter"&&hub&&["walk","scooter"].includes(p.mode)){
  ops.push(read("DELETE FROM coast_scooters WHERE room=? AND id=? AND (parked=0 OR (x-?)*(x-?)+(z-?)*(z-?)<10)",...key,p.x,p.x,p.z,p.z));
 }else if(cmd==="parkScooter"&&p.mode==="scooter"&&canScoot(p)){
  ops.push(read("UPDATE coast_scooters SET x=?,z=?,heading=?,parked=? WHERE room=? AND id=? AND parked=0",p.x,p.z,p.yaw,now,...key));
 }else if(cmd==="mountScooter"&&p.mode==="walk"){
  ops.push(read("UPDATE coast_scooters SET parked=0 WHERE room=? AND id=? AND parked>0 AND (x-?)*(x-?)+(z-?)*(z-?)<9",...key,p.x,p.x,p.z,p.z));
 }
 return ops;
}
export function rentalState(rows){
 const s=rows[0];return s?{dock:s.dock,parked:s.parked?{x:s.x,z:s.z,yaw:s.heading,at:s.parked}:null}:null;
}
