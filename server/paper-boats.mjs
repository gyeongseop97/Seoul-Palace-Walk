import {boatBank,boatLifetime,canCatchBoat,paperColors} from "../public/paper-boats.js";
const ready=new WeakMap();
function ensure(db){
  if(!ready.has(db)){
    const schema=[
      "CREATE TABLE IF NOT EXISTS paper_boats(id TEXT PRIMARY KEY,room TEXT NOT NULL,owner TEXT NOT NULL,name TEXT NOT NULL,color TEXT NOT NULL,note TEXT NOT NULL,origin REAL NOT NULL,side INTEGER NOT NULL,sent INTEGER NOT NULL,expires INTEGER NOT NULL,picked TEXT)",
      "CREATE INDEX IF NOT EXISTS paper_boat_expiry ON paper_boats(expires)",
      "CREATE UNIQUE INDEX IF NOT EXISTS paper_boat_afloat ON paper_boats(room,owner) WHERE picked IS NULL"
    ];
    ready.set(db,db.batch(schema.map(sql=>db.prepare(sql).bind())).catch(e=>{ready.delete(db);throw e;}));
  }
  return ready.get(db);
}
const identifier=value=>typeof value==="string"&&/^[a-f0-9]{32}$/.test(value);
export async function paperBoatRequest(db,{room,id,key,paperBoat},now){
  const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
  if(!key||!paperBoat||!["list","launch","catch"].includes(paperBoat.action))return reply({error:"종이배 요청을 확인해 주세요."},400);
  const {action,boatId,color}=paperBoat;
  if(action!=="list"&&!identifier(boatId))return reply({error:"종이배를 다시 골라 주세요."},400);
  const read=(sql,...args)=>db.prepare(sql).bind(...args);
  const [player]=(await read("SELECT avatar,nickname FROM walkers WHERE room=? AND id=? AND player_key=? AND updated>=?",room,id,key,now-15000).all()).results;
  if(!player)return reply({error:"방에 다시 입장해 주세요."},403);
  await ensure(db);
  let letter=null;
  const person=JSON.parse(player.avatar);
  if(action==="launch"){
    const origin=boatBank(person),note=paperBoat.note;
    if(!origin||origin.x>=1052)return reply({error:"아래 산책로의 물가에 조금 더 가까이 와 주세요."},400);
    if(!Object.hasOwn(paperColors,color)||typeof note!=="string"||[...note].length>80||/[\p{Cc}\p{Bidi_Control}]/u.test(note))return reply({error:"종이 색과 쪽지를 확인해 주세요."},400);
    const expires=now+boatLifetime({id:boatId,origin:origin.x});
    const rows=await db.batch([read("DELETE FROM paper_boats WHERE expires<=?",now),
      read("INSERT OR IGNORE INTO paper_boats(id,room,owner,name,color,note,origin,side,sent,expires) VALUES (?,?,?,?,?,?,?,?,?,?)",boatId,room,id,player.nickname,color,note.normalize("NFC").trim(),origin.x,origin.side,now,expires),
      read("SELECT id FROM paper_boats WHERE room=? AND owner=? AND id=?",room,id,boatId)]);
    if(!rows[2].results.length)return reply({error:"앞서 띄운 배가 아직 물 위에 있어요."},409);
  }
  if(action==="catch"){
    const query="SELECT * FROM paper_boats WHERE room=? AND id=? AND expires>?";
    const [boat]=(await read(query,room,boatId,now).all()).results;
    if(!boat||boat.picked&&boat.picked!==id)return reply({error:"배가 이미 지나갔거나 누군가 먼저 건졌어요."},409);
    if(!boat.picked&&!canCatchBoat(person,boat,now))return reply({error:"배 가까운 물가에서 건져 주세요."},400);
    const result=await read("UPDATE paper_boats SET picked=? WHERE room=? AND id=? AND (picked IS NULL OR picked=?) RETURNING name,note,color",id,room,boatId,id).all();
    letter=result.results[0];if(!letter)return reply({error:"친구가 먼저 건졌어요."},409);
  }
  // Return boats that could be in sight, plus the player's own boat further downstream.
  const boats=(await read(`SELECT id,owner,color,origin,side,sent,expires FROM paper_boats
    WHERE room=? AND expires>? AND picked IS NULL
    AND (owner=? OR (origin<=? AND MIN(1052,origin+MAX(0,?-sent)*.00117)>=?))`,
    room,now,id,person.x+110,now,person.x-110).all()).results;
  return reply({boats,letter});
}
