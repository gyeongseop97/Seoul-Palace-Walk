import {tavernOps,tavernSchema} from "./coast-tavern.mjs";
import {voyageSchema,deckSeatSchema,deckSeatLease,harborSnapshot,vesselSnapshot,appendVesselOps,passengerDeckPoint} from "./coast-voyages.mjs";
import {bridge,cruiseBerth,mainDeckRail,mainDeckRailHalfWidth,mainFloor,gangwayToe,gangwayHeight,exitGate} from "../public/coast-vessel-layout.js";
import {inCoastSpace,seaPoint} from "../public/region-coordinates.js";
import {scooterSchema,scooterOps,rentalState} from "./coast-scooter-rentals.mjs";
import {canStartFestival as atFestivalBooth,festivalBooth} from "../public/pohang-festival-site.js";
import {tavernSeatReach,tavernSeatSpot} from "../public/coast-tavern-layout.js";
import {busAt,busCount,stopById,distance,tables,dock,mooring,limits,festivalDuration} from "../public/pohang-layout.js";
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const initialized=new WeakMap();
function ensure(db){
 if(!initialized.has(db))initialized.set(db,db.batch([
  ...tavernSchema,voyageSchema,deckSeatSchema,scooterSchema,
  "CREATE TABLE IF NOT EXISTS coast_visitors(room TEXT,id TEXT,updated INTEGER,pose TEXT,seat INTEGER,PRIMARY KEY(room,id))",
  "CREATE INDEX IF NOT EXISTS coast_active ON coast_visitors(room,updated)",
  "CREATE TABLE IF NOT EXISTS coast_harbor(room TEXT PRIMARY KEY,x REAL,z REAL,yaw REAL,helm TEXT,updated INTEGER,festival INTEGER DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS coast_bus_seats(room TEXT,coach INTEGER,seat INTEGER,id TEXT,updated INTEGER,PRIMARY KEY(room,coach,seat),UNIQUE(room,id))",

 ].map(sql=>db.prepare(sql).bind())).catch(e=>{initialized.delete(db);throw e;}));
 return initialized.get(db);
}
const clampDeck=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const modes=new Set(["scooter","walk","swim","surf","bus","table","deck"]);
async function canLaunchFireworks(read,room,p,avatar,now){
 if(!inCoastSpace(avatar))return false;
 const position=seaPoint(avatar);
 if(p.mode!=="deck")return atFestivalBooth(p)&&avatar.coast?.mode==="walk"&&
  avatar.seat==null&&!avatar.groundSit&&distance(position,festivalBooth)<11;
 if(!Number.isFinite(p.floor)||p.floor<mainFloor-exitGate.drop-.01||p.floor>bridge.floor+.01)return false;
 const row=(await read(harborSnapshot,room).all()).results[0];
 const ship=row?vesselSnapshot(row,now):{...mooring,yaw:0,speed:0};
 if(avatar.coast?.mode!=="deck"){
  // Boarding and the normal room position update may arrive in either order.
  const landing=cruiseBerth(ship);
  if(avatar.coast?.mode!=="walk"||!landing||distance(position,landing)>=11)return false;
 }
 const local=passengerDeckPoint(p,ship,now);
 if(!local)return false;
 const ramp=gangwayHeight(local);
 if(ramp!=null&&cruiseBerth(ship)&&!ship.helm&&Math.abs(p.floor-ramp)<.04)return true;
 if(p.floor<mainFloor-.01)return false;
 const halfWidth=mainDeckRailHalfWidth(local.z);
 return halfWidth>0&&Math.abs(local.x)<=halfWidth;
}
export async function coastRequest(db,{room,id,key,coast},now){
 if(!key||!coast||typeof coast!=="object")return reply({error:"승차 정보를 확인해 주세요."},400);
 const read=(sql,...args)=>db.prepare(sql).bind(...args);
 const owner=(await read("SELECT nickname,coat,avatar FROM walkers WHERE room=? AND id=? AND player_key=?",room,id,key).all()).results[0];
 if(!owner)return reply({error:"서울역에서 다시 승차해 주세요."},403);
 await ensure(db);
 const cmd=coast.action||"",p=coast.pose;
 if(cmd==="leave"){
  const sailing=[];await appendVesselOps(sailing,read,room,id,{mode:"walk"},coast,now);
  await db.batch([...sailing,read("DELETE FROM coast_scooters WHERE room=? AND id=?",room,id),read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id),read("DELETE FROM coast_visitors WHERE room=? AND id=?",room,id),read("UPDATE coast_harbor SET helm=NULL,updated=? WHERE room=? AND helm=?",now,room,id)]);
  return reply({ok:true});
 }
 if(!p||![p.x,p.z,p.yaw].every(Number.isFinite)||p.x<limits.minX||p.x>limits.maxX||p.z<limits.minZ||p.z>limits.maxZ||!modes.has(p.mode))return reply({error:"포항 위치를 확인해 주세요."},400);
 const avatar=JSON.parse(owner.avatar),pose=JSON.stringify({x:p.x,z:p.z,yaw:p.yaw,mode:p.mode,walk:!!p.walk,hasBoard:!!p.hasBoard,
  character:avatar.character,look:avatar.look,chat:typeof p.chat==="string"?p.chat.trim().slice(0,80):"",chatAt:Math.min(now,Number(p.chatAt)||0),
  gesture:["fish","clam","drink"].includes(p.gesture)?p.gesture:null,gestureAt:Math.min(now,Number(p.gestureAt)||0),blush:Math.min(now+120000,Number(p.blush)||0),
  coach:Number.isInteger(p.coach)?p.coach:null,slot:Number.isInteger(p.slot)?Math.max(0,Math.min(5,p.slot)):0,deckX:Number.isFinite(p.deckX)?clampDeck(p.deckX,gangwayToe,5):null,deckZ:Number.isFinite(p.deckZ)?clampDeck(p.deckZ,-18,mainDeckRail.front):null});
 const ops=[read("INSERT INTO coast_visitors(room,id,updated,pose) VALUES(?,?,?,?) ON CONFLICT(room,id) DO UPDATE SET updated=excluded.updated,pose=excluded.pose,seat=CASE WHEN coast_visitors.updated<? THEN NULL ELSE coast_visitors.seat END",room,id,now,pose,now-15000),
  read("INSERT OR IGNORE INTO coast_harbor(room,x,z,yaw,updated) VALUES(?,?,?,?,0)",room,mooring.x,mooring.z,0)];
 const scooterCommand=["rentScooter","returnScooter","mountScooter","parkScooter"].includes(cmd);
 if(scooterCommand)ops.push(...scooterOps(read,room,id,p,cmd,now));
 const rentalIndex=ops.push(read("SELECT dock,x,z,heading,parked FROM coast_scooters WHERE room=? AND id=? AND (parked=0 OR parked>?)",room,id,now-600000))-1;
 const spot=coast.table;
 const coach=coast.coach,seat=coast.seat;
 if(cmd==="board"&&Number.isInteger(coach)&&coach>=0&&coach<busCount&&Number.isInteger(seat)&&seat>=0&&seat<8){
  const stop=busAt(coach,now/1000).stop;
  if(stop&&(!coast.stop||coast.stop===stop)&&p.mode==="walk"&&distance(p,stopById(stop))<6.5){
   ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND updated<?",room,now-15000));
   ops.push(read("INSERT OR IGNORE INTO coast_bus_seats(room,coach,seat,id,updated) VALUES(?,?,?,?,?)",room,coach,seat,id,now));
  }
 }else if(cmd==="exitBus")ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id));
 else if(p.mode==="bus")ops.push(read("UPDATE coast_bus_seats SET updated=? WHERE room=? AND id=?",now,room,id));
 else ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id));
 if(cmd==="sit"&&p.mode==="walk"&&Number.isInteger(spot)&&tables[spot]&&distance(p,tables[spot])<4.5){
  const requested=tavernSeatSpot(spot,seat);
  if(Number.isInteger(seat)&&requested&&distance(p,requested)<tavernSeatReach){
   const place=spot*4+seat;
   ops.push(read(`UPDATE coast_visitors SET seat=? WHERE room=? AND id=? AND seat IS NULL AND NOT EXISTS
    (SELECT 1 FROM coast_visitors v WHERE v.room=? AND v.seat=? AND v.updated>?)`,place,room,id,room,place,now-15000));
  }else if(seat==null){
   ops.push(read(`UPDATE coast_visitors SET seat=(SELECT ?*4+value FROM json_each('[0,2,1,3]')
    WHERE NOT EXISTS(SELECT 1 FROM coast_visitors v WHERE v.room=? AND v.updated>? AND v.seat=?*4+value) ORDER BY key LIMIT 1) WHERE room=? AND id=? AND seat IS NULL`,spot,room,now-15000,spot,room,id));
  }
 }
 if(cmd==="stand")ops.push(read("UPDATE coast_visitors SET seat=NULL WHERE room=? AND id=?",room,id));
 const tavern=tavernOps(ops,read,room,id,p,coast,now);
 if(cmd==="festival"&&await canLaunchFireworks(read,room,p,avatar,now)){
  ops.push(read("UPDATE coast_harbor SET festival=? WHERE room=? AND (festival=0 OR festival<=?)",
    now,room,now-festivalDuration*1000));
 }
 await appendVesselOps(ops,read,room,id,p,coast,now);
 if(Math.random()<.008)ops.push(read("DELETE FROM coast_visitors WHERE updated<?",now-86400000));
 const deckSeats=ops.push(read("SELECT id,seat FROM coast_deck_seats WHERE room=? AND updated>?",room,now-deckSeatLease))-1;
 const tavernSeats=ops.push(read("SELECT seat FROM coast_visitors WHERE room=? AND updated>? AND seat IS NOT NULL",room,now-15000))-1;
 ops.push(read("SELECT coach,seat,id FROM coast_bus_seats WHERE room=? AND updated>?",room,now-15000),read("SELECT v.id,v.pose,v.seat,w.nickname,w.coat FROM coast_visitors v JOIN walkers w ON w.room=v.room AND w.id=v.id WHERE v.room=? AND v.updated>?"+(coast.shared===true?" AND v.id=?":""),room,now-15000,...(coast.shared===true?[id]:[])),
 read(harborSnapshot,room));
 const rows=await db.batch(ops);
 const orders=rows[tavern.orders].results;
 return reply({now,grills:orders.filter(o=>o.cookingClams>0).map(o=>({spot:o.spot,started:o.grillUntil-6500})),scooter:rentalState(rows[rentalIndex].results),tavernOrders:orders,tavernSeats:rows[tavernSeats].results.map(row=>row.seat),bite:tavern.receipt==null?null:rows[tavern.receipt].results[0]??null,busSeats:rows.at(-3).results,deckSeats:rows[deckSeats].results,people:rows.at(-2).results.map(r=>({...JSON.parse(r.pose),id:r.id,nickname:r.nickname,coat:r.coat,seat:r.seat})),boat:vesselSnapshot(rows.at(-1).results[0],now)});
}
