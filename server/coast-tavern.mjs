import {tavernMenu,validTavernOrder} from "../public/tavern-menu.js";
import {distance,tables} from "../public/pohang-layout.js";

export const tavernSchema=[
 `CREATE TABLE IF NOT EXISTS coast_tavern(room TEXT,spot INTEGER,called INTEGER DEFAULT 0,ordered INTEGER DEFAULT 0,
 ready INTEGER DEFAULT 0,served INTEGER DEFAULT 0,touched INTEGER,soju INTEGER DEFAULT 0,sashimi INTEGER DEFAULT 0,
 grilledClam INTEGER DEFAULT 0,rawClams INTEGER DEFAULT 0,cookingClams INTEGER DEFAULT 0,grillUntil INTEGER DEFAULT 0,
 pendingSoju INTEGER DEFAULT 0,pendingFish INTEGER DEFAULT 0,pendingClams INTEGER DEFAULT 0,PRIMARY KEY(room,spot))`,
 "CREATE TABLE IF NOT EXISTS coast_bites(room TEXT,id TEXT,token TEXT,kind TEXT,at INTEGER,applied INTEGER DEFAULT 0,PRIMARY KEY(room,id,token))"
];
const seated=`EXISTS(SELECT 1 FROM coast_visitors WHERE room=? AND id=? AND seat BETWEEN ?*4 AND ?*4+3)`;
export function tavernOps(ops,read,room,id,p,coast,now){
 const cmd=coast.action,spot=coast.table,key=[room,spot],who=[room,id,spot,spot];
 // Deliver the order and open a cooked batch exactly once, regardless of which diner polls first.
 ops.push(read(`UPDATE coast_tavern SET soju=soju+pendingSoju,sashimi=sashimi+pendingFish,rawClams=rawClams+pendingClams,
  pendingSoju=0,pendingFish=0,pendingClams=0,touched=? WHERE room=? AND served>0 AND served<=? AND pendingSoju+pendingFish+pendingClams>0`,now,room,now));
 ops.push(read("UPDATE coast_tavern SET grilledClam=grilledClam+cookingClams,cookingClams=0,grillUntil=0,touched=? WHERE room=? AND cookingClams>0 AND grillUntil<=?",now,room,now));
 let receipt=null;
 if(Number.isInteger(spot)&&tables[spot]&&distance(p,tables[spot])<4.5&&p.mode==="table"){
  if(cmd==="callTavern"){
   ops.push(read(`INSERT INTO coast_tavern(room,spot,called,touched) SELECT ?,?,?,? WHERE `+seated+
    " ON CONFLICT(room,spot) DO UPDATE SET called=excluded.called,ordered=0,ready=0,served=0,touched=excluded.touched WHERE served>0 AND served<=excluded.called",...key,now,now,...who));
  }else if(cmd==="orderTavern"&&validTavernOrder(coast.items)){
   const n=k=>(coast.items[k]??0)*tavernMenu.find(d=>d.kind===k).servings;
   ops.push(read("UPDATE coast_tavern SET ordered=?,ready=?,served=?,touched=?,pendingSoju=?,pendingFish=?,pendingClams=? WHERE room=? AND spot=? AND ordered=0 AND called=? AND called<=? AND "+seated,
     now,now+5200,now+8200,now,n("soju"),n("sashimi"),n("grilledClam"),...key,coast.called??-1,now-2600,...who));
  }else if(cmd==="tavernGrill"){
   ops.push(read("UPDATE coast_tavern SET cookingClams=min(3,rawClams),rawClams=rawClams-min(3,rawClams),grillUntil=?,touched=? WHERE room=? AND spot=? AND rawClams>0 AND cookingClams=0 AND "+seated,now+6500,now,...key,...who));
  }else if(cmd==="taste"&&tavernMenu.some(d=>d.kind===coast.kind)&&typeof coast.token==="string"&&/^[0-9a-f-]{32,36}$/i.test(coast.token)){
   const {kind,token}=coast;
   ops.push(read(`INSERT OR IGNORE INTO coast_bites(room,id,token,kind,at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM coast_tavern WHERE room=? AND spot=? AND ${kind}>0) AND `+seated+
     " AND NOT EXISTS(SELECT 1 FROM coast_bites WHERE room=? AND id=? AND at>?)",room,id,token,kind,now,...key,...who,room,id,now-1350));
   ops.push(read(`UPDATE coast_tavern SET ${kind}=${kind}-1,touched=? WHERE room=? AND spot=? AND EXISTS(SELECT 1 FROM coast_bites WHERE room=? AND id=? AND token=? AND applied=0)`,now,...key,room,id,token));
   ops.push(read("UPDATE coast_bites SET applied=1 WHERE room=? AND id=? AND token=? AND applied=0",room,id,token));
   receipt=ops.push(read("SELECT token,kind,at FROM coast_bites WHERE room=? AND id=? AND token=? AND applied=1",room,id,token))-1;
  }
 }
 ops.push(read(`DELETE FROM coast_tavern WHERE room=? AND touched<? AND NOT EXISTS(SELECT 1 FROM coast_visitors v WHERE v.room=coast_tavern.room AND v.seat BETWEEN coast_tavern.spot*4 AND coast_tavern.spot*4+3 AND v.updated>?)`,room,now-30000,now-15000));
 if(Math.random()<.01)ops.push(read("DELETE FROM coast_bites WHERE room=? AND at<?",room,now-86400000));
 const orders=ops.push(read(`SELECT spot,called AS id,called,ordered,ready,served,soju,sashimi,grilledClam,rawClams,cookingClams,grillUntil,
 CASE WHEN ordered=0 AND called+2600>? THEN 'called' WHEN ordered=0 THEN 'ordering' WHEN served>? THEN 'cooking' ELSE 'served' END AS phase FROM coast_tavern WHERE room=?`,now,now,room))-1;
 return {orders,receipt};
}
