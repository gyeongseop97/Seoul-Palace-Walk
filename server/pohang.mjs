import {busAt,busCount,station,beachStop,distance,tables,dock,mooring,limits,festivalDuration,scheduledFestivalStart} from "../public/pohang-layout.js";
const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const initialized=new WeakMap();
function ensure(db){
 if(!initialized.has(db))initialized.set(db,db.batch([
  "CREATE TABLE IF NOT EXISTS coast_visitors(room TEXT,id TEXT,updated INTEGER,pose TEXT,seat INTEGER,PRIMARY KEY(room,id))",
  "CREATE INDEX IF NOT EXISTS coast_active ON coast_visitors(room,updated)",
  "CREATE TABLE IF NOT EXISTS coast_harbor(room TEXT PRIMARY KEY,x REAL,z REAL,yaw REAL,helm TEXT,updated INTEGER,festival INTEGER DEFAULT 0)",
  "CREATE TABLE IF NOT EXISTS coast_bus_seats(room TEXT,coach INTEGER,seat INTEGER,id TEXT,updated INTEGER,PRIMARY KEY(room,coach,seat),UNIQUE(room,id))",
  "CREATE TABLE IF NOT EXISTS coast_grills(room TEXT,spot INTEGER,started INTEGER,PRIMARY KEY(room,spot))"
 ].map(sql=>db.prepare(sql).bind())).catch(e=>{initialized.delete(db);throw e;}));
 return initialized.get(db);
}
const modes=new Set(["walk","swim","surf","bus","table","deck"]);
export async function coastRequest(db,{room,id,key,coast},now){
 if(!key||!coast||typeof coast!=="object")return reply({error:"승차 정보를 확인해 주세요."},400);
 const read=(sql,...args)=>db.prepare(sql).bind(...args);
 const owner=(await read("SELECT nickname,coat,avatar FROM walkers WHERE room=? AND id=? AND player_key=?",room,id,key).all()).results[0];
 if(!owner)return reply({error:"서울역에서 다시 승차해 주세요."},403);
 await ensure(db);
 const cmd=coast.action||"",p=coast.pose;
 if(cmd==="leave"){
  await db.batch([read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id),read("DELETE FROM coast_visitors WHERE room=? AND id=?",room,id),read("UPDATE coast_harbor SET helm=NULL,updated=? WHERE room=? AND helm=?",now,room,id)]);
  return reply({ok:true});
 }
 if(!p||![p.x,p.z,p.yaw].every(Number.isFinite)||p.x<limits.minX||p.x>limits.maxX||p.z<limits.minZ||p.z>limits.maxZ||!modes.has(p.mode))return reply({error:"포항 위치를 확인해 주세요."},400);
 const avatar=JSON.parse(owner.avatar),pose=JSON.stringify({x:p.x,z:p.z,yaw:p.yaw,mode:p.mode,walk:!!p.walk,hasBoard:!!p.hasBoard,
  character:avatar.character,look:avatar.look,chat:typeof p.chat==="string"?p.chat.trim().slice(0,80):"",chatAt:Math.min(now,Number(p.chatAt)||0),
  gesture:["fish","clam","drink"].includes(p.gesture)?p.gesture:null,gestureAt:Math.min(now,Number(p.gestureAt)||0),blush:Math.min(now+120000,Number(p.blush)||0),
  coach:Number.isInteger(p.coach)?p.coach:null,slot:Number.isInteger(p.slot)?Math.max(0,Math.min(5,p.slot)):0,deckX:Number.isFinite(p.deckX)?Math.max(-3.5,Math.min(3.5,p.deckX)):null,deckZ:Number.isFinite(p.deckZ)?Math.max(-12.8,Math.min(-6.7,p.deckZ)):null});
 const ops=[read("INSERT INTO coast_visitors(room,id,updated,pose) VALUES(?,?,?,?) ON CONFLICT(room,id) DO UPDATE SET updated=excluded.updated,pose=excluded.pose,seat=CASE WHEN coast_visitors.updated<? THEN NULL ELSE coast_visitors.seat END",room,id,now,pose,now-15000),
  read("INSERT OR IGNORE INTO coast_harbor(room,x,z,yaw,updated) VALUES(?,?,?,?,0)",room,mooring.x,mooring.z,0)];
 const spot=coast.table;
 const coach=coast.coach,seat=coast.seat;
 if(cmd==="board"&&Number.isInteger(coach)&&coach>=0&&coach<busCount&&Number.isInteger(seat)&&seat>=0&&seat<8){
  const stop=busAt(coach,now/1000).stop;
  if(stop&&distance(p,stop==="station"?station:beachStop)<29){
   ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND updated<?",room,now-15000));
   ops.push(read("INSERT OR IGNORE INTO coast_bus_seats(room,coach,seat,id,updated) VALUES(?,?,?,?,?)",room,coach,seat,id,now));
  }
 }else if(cmd==="exitBus")ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id));
 else if(p.mode==="bus")ops.push(read("UPDATE coast_bus_seats SET updated=? WHERE room=? AND id=?",now,room,id));
 else ops.push(read("DELETE FROM coast_bus_seats WHERE room=? AND id=?",room,id));
 if(cmd==="sit"&&Number.isInteger(spot)&&tables[spot]&&distance(p,tables[spot])<4.5){
  ops.push(read(`UPDATE coast_visitors SET seat=(SELECT ?*4+value FROM json_each('[0,1,2,3]')
    WHERE NOT EXISTS(SELECT 1 FROM coast_visitors v WHERE v.room=? AND v.updated>? AND v.seat=?*4+value AND v.id<>?) ORDER BY value LIMIT 1) WHERE room=? AND id=?`,spot,room,now-15000,spot,id,room,id));
 }
 if(cmd==="stand")ops.push(read("UPDATE coast_visitors SET seat=NULL WHERE room=? AND id=?",room,id));
 let claim=-1;
 const seated="EXISTS(SELECT 1 FROM coast_visitors WHERE room=? AND id=? AND seat BETWEEN ? AND ?)";
 if(["grill","eat"].includes(cmd)&&Number.isInteger(spot)&&tables[spot]&&distance(p,tables[spot])<4.5){
  const q=[room,id,spot*4,spot*4+3];
  if(cmd==="grill")ops.push(read("INSERT INTO coast_grills(room,spot,started) SELECT ?,?,? WHERE "+seated+" ON CONFLICT(room,spot) DO UPDATE SET started=excluded.started WHERE started=0",room,spot,now,...q));
  else claim=ops.push(read("UPDATE coast_grills SET started=0 WHERE room=? AND spot=? AND started=? AND started<=? AND "+seated+" RETURNING spot",room,spot,Number(coast.started)||-1,now-6500,...q))-1;
 }
 if(cmd==="festival"&&Math.abs(p.x-dock.x)<800&&Math.abs(p.z-dock.z)<1100){
  const duration=festivalDuration*1000,scheduled=scheduledFestivalStart(now);
  ops.push(read(`UPDATE coast_harbor SET festival=? WHERE room=? AND (festival=0 OR festival<=?)
    AND (? >= ? OR (festival>0 AND festival<=? AND festival>?))`,
    now,room,now-duration,now,scheduled+duration,scheduled,scheduled-duration));
 }
 // A stale helm returns to the pier so a disconnected skipper never strands the bay.
 ops.push(read("UPDATE coast_harbor SET helm=NULL WHERE room=? AND updated<? AND helm IS NOT NULL",room,now-18000));
 ops.push(read("UPDATE coast_harbor SET x=?,z=?,yaw=0,updated=? WHERE room=? AND helm IS NULL AND updated<? AND NOT EXISTS(SELECT 1 FROM coast_visitors WHERE room=? AND updated>? AND json_extract(pose,'$.mode')='deck')",mooring.x,mooring.z,now,room,now-18000,room,now-15000));
 if(cmd==="helm"&&p.mode==="deck")ops.push(read("UPDATE coast_harbor SET helm=?,updated=? WHERE room=? AND helm IS NULL AND (x-?)*(x-?)+(z-?)*(z-?)<=225",id,now,room,p.x,p.x,p.z,p.z));
 const boat=coast.boat;
 if(boat&&[boat.x,boat.z,boat.yaw].every(Number.isFinite)&&boat.x>0&&boat.x<1300&&boat.z>-1030&&boat.z<400){
  ops.push(read("UPDATE coast_harbor SET x=?,z=?,yaw=?,updated=? WHERE room=? AND helm=? AND abs(x-?)<=8+0.022*max(0,?-updated) AND abs(z-?)<=8+0.022*max(0,?-updated)",boat.x,boat.z,boat.yaw,now,room,id,boat.x,now,boat.z,now));
 }
 if(cmd==="release")ops.push(read("UPDATE coast_harbor SET helm=NULL,updated=? WHERE room=? AND helm=?",now,room,id));
 if(cmd==="moor"&&distance(p,mooring)<15)ops.push(read("UPDATE coast_harbor SET helm=NULL,x=?,z=?,yaw=0 WHERE room=? AND helm=? AND abs(x-?)<17 AND abs(z-?)<17",mooring.x,mooring.z,room,id,mooring.x,mooring.z));
 if(Math.random()<.008)ops.push(read("DELETE FROM coast_visitors WHERE updated<?",now-86400000));
 ops.push(read("SELECT coach,seat,id FROM coast_bus_seats WHERE room=? AND updated>?",room,now-15000),read("SELECT v.id,v.pose,v.seat,w.nickname,w.coat FROM coast_visitors v JOIN walkers w ON w.room=v.room AND w.id=v.id WHERE v.room=? AND v.updated>?"+(coast.shared===true?" AND v.id=?":""),room,now-15000,...(coast.shared===true?[id]:[])),
 read("SELECT x,z,yaw,helm,festival FROM coast_harbor WHERE room=?",room),read("SELECT spot,started FROM coast_grills WHERE room=?",room));
 const rows=await db.batch(ops);
 return reply({now,busSeats:rows.at(-4).results,ate:claim>=0&&rows[claim].results.length>0,people:rows.at(-3).results.map(r=>({...JSON.parse(r.pose),id:r.id,nickname:r.nickname,coat:r.coat,seat:r.seat})),boat:rows.at(-2).results[0],grills:rows.at(-1).results});
}
