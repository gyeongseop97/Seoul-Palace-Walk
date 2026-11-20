import {nearHelm,seaToDeck,deckHeight} from "../public/coast-vessel-layout.js";
import {inSailingArea,voyageAt} from "../public/coast-voyage.js";
import {clamp,mooring,distance} from "../public/pohang-layout.js";

export const voyageSchema="CREATE TABLE IF NOT EXISTS coast_voyages(room TEXT PRIMARY KEY,kind TEXT,started INTEGER,ox REAL,oz REAL,angle REAL,speed REAL)";
export const harborSnapshot=`SELECT h.x,h.z,h.yaw,h.helm,h.updated,h.festival,v.kind,v.started,v.ox,v.oz,v.angle,v.speed
 FROM coast_harbor h LEFT JOIN coast_voyages v ON v.room=h.room WHERE h.room=?`;
export function vesselSnapshot(row,now){
 const {kind,started,ox,oz,angle,speed,...boat}=row;
 const voyage=kind&&kind!=="manual"&&!boat.helm?{kind,started,ox,oz,angle,speed}:null;
 const sample=voyage?voyageAt(voyage,now):{speed:boat.helm?speed??0:0};
 return {...boat,...sample,voyage};
}
const save=`INSERT INTO coast_voyages(room,kind,started,ox,oz,angle,speed)
 SELECT room,?,?,x,z,yaw,COALESCE(?,(SELECT speed FROM coast_voyages WHERE room=coast_harbor.room),0) FROM coast_harbor WHERE room=? AND helm=?
 ON CONFLICT(room) DO UPDATE SET kind=excluded.kind,started=excluded.started,ox=excluded.ox,oz=excluded.oz,angle=excluded.angle,speed=excluded.speed`;
export async function appendVesselOps(ops,read,room,id,p,coast,now){
 const cmd=coast.action,b=coast.boat;
 // Base the release on the last accepted driving position and speed, in the same write transaction.
 if(b&&[b.x,b.z,b.yaw].every(Number.isFinite)&&inSailingArea(b)){
  ops.push(read("UPDATE coast_harbor SET x=?,z=?,yaw=?,updated=? WHERE room=? AND helm=? AND abs(x-?)<=8+.022*max(0,?-updated) AND abs(z-?)<=8+.022*max(0,?-updated)",b.x,b.z,b.yaw,now,room,id,b.x,now,b.z,now));
  ops.push(read(save,"manual",now,clamp(Number(b.speed)||0,-4,16),room,id));
 }
 if(cmd==="release"||cmd==="returnTrip"||cmd==="leave"){
  ops.push(read(save,cmd==="returnTrip"?"return":"drift",now,Number.isFinite(b?.speed)?clamp(b.speed,-4,16):null,room,id));
  ops.push(read("UPDATE coast_harbor SET helm=NULL,updated=? WHERE room=? AND helm=?",now,room,id));
 }else if(cmd==="moor"&&distance(p,mooring)<25){
  ops.push(read("DELETE FROM coast_voyages WHERE room=? AND EXISTS(SELECT 1 FROM coast_harbor WHERE room=? AND helm=? AND abs(x-?)<17 AND abs(z-?)<17)",room,room,id,mooring.x,mooring.z));
  ops.push(read("UPDATE coast_harbor SET helm=NULL,x=?,z=?,yaw=0,updated=? WHERE room=? AND helm=? AND abs(x-?)<17 AND abs(z-?)<17",mooring.x,mooring.z,now,room,id,mooring.x,mooring.z));
 }else if(p.mode==="deck"&&(cmd==="helm"||cmd==="tour")){
  const old=(await read(harborSnapshot,room).all()).results[0];
  const current=old?vesselSnapshot(old,now):{...mooring,yaw:0,speed:0,helm:null};
  const local=seaToDeck(current,p,now,p.floor),height=deckHeight(local,p.floor);
  const helmReach=nearHelm({...local,h:p.floor})&&(!Number.isFinite(p.floor)||Math.abs(p.floor-7.85)<.45);
  const allowed=cmd==="helm"?helmReach:height!=null&&(!current.voyage||current.voyage.kind==="drift"||current.done);
  if(!current.helm&&allowed){
   // Concurrent passengers see one pilot or one tour, with a continuous handover position.
   const stamp=old?.started??0;
   ops.push(read("UPDATE coast_harbor SET x=?,z=?,yaw=?,updated=?,helm=? WHERE room=? AND helm IS NULL AND COALESCE((SELECT started FROM coast_voyages WHERE room=?),0)=?",current.x,current.z,current.yaw,now,id,room,room,stamp));
   ops.push(read(save,cmd==="helm"?"manual":"tour",now,current.speed,room,id));
   if(cmd==="tour")ops.push(read("UPDATE coast_harbor SET helm=NULL WHERE room=? AND helm=? AND updated=?",room,id,now));
  }
 }
 // A vanished skipper leaves the boat drifting. Return an abandoned stopped vessel to its berth.
 ops.push(read(`UPDATE coast_voyages SET kind='drift',started=(SELECT updated FROM coast_harbor WHERE room=?)
  WHERE room=? AND kind='manual' AND EXISTS(SELECT 1 FROM coast_harbor WHERE room=? AND helm IS NOT NULL AND updated<?)`,room,room,room,now-18000));
 ops.push(read("UPDATE coast_harbor SET helm=NULL WHERE room=? AND helm IS NOT NULL AND updated<?",room,now-18000));
 ops.push(read(`UPDATE coast_harbor SET x=?,z=?,yaw=0,updated=? WHERE room=? AND helm IS NULL AND updated<? AND
  NOT EXISTS(SELECT 1 FROM coast_voyages WHERE room=? AND (kind IN ('tour','return') OR started>? AND abs(speed)>.05)) AND
  NOT EXISTS(SELECT 1 FROM coast_visitors WHERE room=? AND updated>? AND json_extract(pose,'$.mode')='deck')`,mooring.x,mooring.z,now,room,now-18000,room,now-100000,room,now-15000));
 ops.push(read("DELETE FROM coast_voyages WHERE room=? AND kind='drift' AND EXISTS(SELECT 1 FROM coast_harbor WHERE room=? AND helm IS NULL AND x=? AND z=? AND updated=?) AND started<?",room,room,mooring.x,mooring.z,now,now-18000));
}
